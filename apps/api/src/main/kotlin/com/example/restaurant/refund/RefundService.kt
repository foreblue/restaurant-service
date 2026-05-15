package com.example.restaurant.refund

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.payment.CancellationPolicyRepository
import com.example.restaurant.payment.PaymentEntity
import com.example.restaurant.payment.PaymentRepository
import com.example.restaurant.payment.PaymentStatus
import com.example.restaurant.payment.PaymentType
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationStatus
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.Locale

private const val DEFAULT_REFUND_CURRENCY = "KRW"
private const val MAX_MANUAL_RESOLVE_MEMO_LENGTH = 1000

@Service
class RefundService(
    private val reservationRepository: ReservationRepository,
    private val paymentRepository: PaymentRepository,
    private val refundRepository: RefundRepository,
    private val cancellationPolicyRepository: CancellationPolicyRepository,
    private val lookupTokenService: ReservationLookupTokenService,
    private val refundGateway: RefundGateway,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun previewCustomerCancellation(
        reservationId: Long,
        lookupToken: String?,
    ): RefundPreviewResponse {
        val reservation = accessibleReservation(reservationId, lookupToken)
        reservation.requireCustomerCancellationPreviewable()
        return calculateRefund(reservation, RefundReason.CUSTOMER_CANCEL).toPreviewResponse(reservation)
    }

    fun previewCustomerCancellation(reservation: ReservationEntity): RefundPreviewResponse {
        reservation.requireCustomerCancellationPreviewable()
        return calculateRefund(reservation, RefundReason.CUSTOMER_CANCEL).toPreviewResponse(reservation)
    }

    @Transactional
    fun requestCustomerCancellationRefund(reservation: ReservationEntity): RefundOperationResponse =
        requestRefund(
            reservation = reservation,
            reason = RefundReason.CUSTOMER_CANCEL,
            requesterRole = RefundRequesterRole.CUSTOMER,
        )

    @Transactional
    fun requestRestaurantCancellationRefund(reservation: ReservationEntity): RefundOperationResponse =
        requestRefund(
            reservation = reservation,
            reason = RefundReason.RESTAURANT_CANCEL,
            requesterRole = RefundRequesterRole.OWNER,
        )

    @Transactional(readOnly = true)
    fun latestRefundOperation(reservation: ReservationEntity): RefundOperationResponse =
        refundRepository.findByReservationIdOrderByCreatedAtAsc(reservation.id)
            .lastOrNull()
            ?.toOperationResponse()
            ?: RefundCalculation.noRefund(
                reason = if (reservation.status == ReservationStatus.CANCELLED_BY_RESTAURANT) {
                    RefundReason.RESTAURANT_CANCEL
                } else {
                    RefundReason.CUSTOMER_CANCEL
                },
                message = "환불이 필요한 온라인 결제가 없습니다.",
            ).toOperationResponse(reservation)

    @Transactional
    fun retryFailedRefund(
        refundId: Long,
        principal: BusinessPrincipal,
        metadata: RefundRequestMetadata,
    ): RefundOperationResponse {
        val refund = refundRepository.findByIdForUpdate(refundId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "환불 요청을 찾을 수 없습니다.")
        if (refund.status == RefundStatus.SUCCEEDED) {
            return refund.toOperationResponse(message = "이미 완료된 환불입니다.")
        }
        if (refund.status != RefundStatus.FAILED) {
            throw ApiException(ErrorCode.CONFLICT, "실패 상태의 환불만 재시도할 수 있습니다.")
        }
        auditRefund(
            action = "REFUND_RETRY_REQUESTED",
            refund = refund,
            actorRole = principal.role.name,
            metadata = metadata,
        )
        return executeGatewayRefund(
            refund = refund,
            gatewayIdempotencyKey = "${refund.idempotencyKey}-retry-${refund.id}",
            actorRole = principal.role.name,
            metadata = metadata,
        )
    }

    @Transactional
    fun markManualResolved(
        refundId: Long,
        request: AdminRefundManualResolveRequest?,
        principal: BusinessPrincipal,
        metadata: RefundRequestMetadata,
    ): RefundOperationResponse {
        val refund = refundRepository.findByIdForUpdate(refundId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "환불 요청을 찾을 수 없습니다.")
        val memo = request.normalizedMemo()
        if (refund.status == RefundStatus.SUCCEEDED) {
            return refund.toOperationResponse(message = "이미 완료된 환불입니다.", manualResolved = true)
        }
        if (refund.status !in setOf(RefundStatus.REQUESTED, RefundStatus.PENDING, RefundStatus.FAILED)) {
            throw ApiException(ErrorCode.CONFLICT, "현재 환불 상태는 수동 해결 처리할 수 없습니다.")
        }

        val before = refund.auditSnapshot()
        refund.status = RefundStatus.SUCCEEDED
        refund.succeededAt = Instant.now(clock)
        refund.pgRefundId = refund.pgRefundId ?: "manual-refund-${refund.id}"
        refund.failureCode = null
        refund.failureMessage = null
        applySuccessfulRefund(refund)
        auditRefund(
            action = "REFUND_MANUAL_RESOLVED",
            refund = refund,
            before = before,
            actorRole = principal.role.name,
            metadata = metadata,
            extra = mapOf("memo" to memo),
        )
        return refund.toOperationResponse(message = "수동 환불 해결로 처리했습니다.", manualResolved = true)
    }

    private fun requestRefund(
        reservation: ReservationEntity,
        reason: RefundReason,
        requesterRole: RefundRequesterRole,
    ): RefundOperationResponse {
        val calculation = calculateRefund(reservation, reason)
        if (!calculation.refundRequired) {
            return calculation.toOperationResponse(reservation)
        }
        val payment = calculation.payment ?: error("Refund calculation requires payment when refundRequired is true.")
        val idempotencyKey = "refund-${reservation.id}-${payment.id}-${reason.name.lowercase(Locale.ROOT)}"
        refundRepository.findByIdempotencyKey(idempotencyKey)?.let {
            return it.toOperationResponse()
        }

        val refund = refundRepository.saveAndFlush(
            RefundEntity(
                payment = payment,
                reservation = reservation,
                restaurant = reservation.restaurant,
                status = RefundStatus.REQUESTED,
                refundAmount = calculation.refundableAmount,
                nonRefundableAmount = calculation.nonRefundableAmount,
                reason = reason,
                policySnapshotJson = calculation.policySnapshotJson,
                policyRuleId = calculation.policyRuleId,
                idempotencyKey = idempotencyKey,
                requestedByRole = requesterRole,
            ),
        )
        auditRefund(
            action = "REFUND_REQUESTED",
            refund = refund,
            actorRole = requesterRole.name,
        )
        return executeGatewayRefund(
            refund = refund,
            gatewayIdempotencyKey = idempotencyKey,
            actorRole = requesterRole.name,
        )
    }

    private fun executeGatewayRefund(
        refund: RefundEntity,
        gatewayIdempotencyKey: String,
        actorRole: String,
        metadata: RefundRequestMetadata? = null,
    ): RefundOperationResponse {
        if (refund.status == RefundStatus.SUCCEEDED) {
            return refund.toOperationResponse(message = "이미 완료된 환불입니다.")
        }

        val before = refund.auditSnapshot()
        val result = refundGateway.refundPayment(
            RefundGatewayRequest(
                refundId = refund.id,
                paymentId = refund.payment.id,
                providerKey = refund.payment.pgProviderKey,
                providerPaymentId = refund.payment.pgPaymentId,
                amount = refund.refundAmount,
                currency = refund.payment.currency,
                idempotencyKey = gatewayIdempotencyKey,
                reason = refund.reason,
            ),
        )
        refund.pgRefundId = result.providerRefundId ?: refund.pgRefundId
        refund.failureCode = result.failureCode
        refund.failureMessage = result.failureMessage

        val action = when (result.status) {
            RefundGatewayResultStatus.SUCCEEDED -> {
                refund.status = RefundStatus.SUCCEEDED
                refund.succeededAt = Instant.now(clock)
                refund.failureCode = null
                refund.failureMessage = null
                applySuccessfulRefund(refund)
                "REFUND_SUCCEEDED"
            }
            RefundGatewayResultStatus.FAILED -> {
                refund.status = RefundStatus.FAILED
                refund.payment.status = PaymentStatus.REFUND_FAILED
                refund.reservation.paymentStatus = PaymentStatus.REFUND_FAILED
                refund.reservation.paymentRequired = false
                "REFUND_FAILED"
            }
            RefundGatewayResultStatus.PENDING -> {
                refund.status = RefundStatus.PENDING
                "REFUND_PENDING"
            }
        }
        auditRefund(
            action = action,
            refund = refund,
            before = before,
            actorRole = actorRole,
            metadata = metadata,
        )
        return refund.toOperationResponse()
    }

    private fun applySuccessfulRefund(refund: RefundEntity) {
        val payment = refund.payment
        payment.refundedAmount = (payment.refundedAmount + refund.refundAmount).coerceAtMost(payment.amount)
        payment.status = if (payment.refundedAmount >= payment.amount) {
            PaymentStatus.REFUNDED
        } else {
            PaymentStatus.PARTIALLY_REFUNDED
        }
        payment.failureCode = null
        payment.failureMessage = null
        refund.reservation.paymentStatus = payment.status
        refund.reservation.paymentRequired = false
    }

    private fun calculateRefund(
        reservation: ReservationEntity,
        reason: RefundReason,
    ): RefundCalculation {
        val payment = refundablePayment(reservation)
            ?: return RefundCalculation.noRefund(reason, "환불이 필요한 온라인 결제가 없습니다.")
        val remainingAmount = payment.amount - payment.refundedAmount
        if (remainingAmount <= 0) {
            return RefundCalculation.noRefund(reason, "이미 환불 가능한 금액이 모두 처리됐습니다.", payment)
        }

        val policy = refundPolicy(reservation)
        val rule = if (reason == RefundReason.RESTAURANT_CANCEL) {
            RefundPolicyRule(
                id = "restaurant_cancel_${policy.restaurantCancelRefundRate}",
                beforeVisitHours = 0,
                refundRate = policy.restaurantCancelRefundRate,
            )
        } else {
            policy.customerRuleFor(hoursBeforeVisit(reservation))
        }
        val refundAmount = remainingAmount * rule.refundRate / 100
        val nonRefundableAmount = remainingAmount - refundAmount

        return RefundCalculation(
            payment = payment,
            reason = reason,
            refundableAmount = refundAmount,
            nonRefundableAmount = nonRefundableAmount,
            policyRuleId = rule.id,
            policySnapshotJson = policy.snapshotJson,
            message = refundMessage(reason, refundAmount, nonRefundableAmount, rule.refundRate),
        )
    }

    private fun refundablePayment(reservation: ReservationEntity): PaymentEntity? =
        paymentRepository.findByReservationIdOrderByCreatedAtAsc(reservation.id)
            .lastOrNull {
                it.paymentType in REFUNDABLE_PAYMENT_TYPES &&
                    it.status in REFUNDABLE_PAYMENT_STATUSES &&
                    it.amount > it.refundedAmount
            }

    private fun refundPolicy(reservation: ReservationEntity): RefundPolicy {
        reservation.cancellationPolicySnapshotJson
            ?.takeIf { it.isNotBlank() }
            ?.let { return parseRefundPolicySnapshot(it) }

        val activePolicy = cancellationPolicyRepository
            .findByReservationProductIdAndActiveOrderByEffectiveFromDesc(reservation.reservationProduct.id, true)
            .firstOrNull()
        if (activePolicy != null) {
            val snapshot = objectMapper.createObjectNode()
            snapshot.put("policyId", activePolicy.id)
            snapshot.set<JsonNode>("rules", objectMapper.readTree(activePolicy.rulesJson))
            snapshot.put("restaurantCancelRefundRate", activePolicy.restaurantCancelRefundRate)
            return RefundPolicy(
                rules = parseRules(snapshot.get("rules")),
                restaurantCancelRefundRate = activePolicy.restaurantCancelRefundRate.coerceIn(0, 100),
                snapshotJson = objectMapper.writeValueAsString(snapshot),
            )
        }

        return RefundPolicy(
            rules = DEFAULT_REFUND_RULES,
            restaurantCancelRefundRate = 100,
            snapshotJson = DEFAULT_REFUND_POLICY_JSON,
        )
    }

    private fun parseRefundPolicySnapshot(snapshotJson: String): RefundPolicy =
        try {
            val root = objectMapper.readTree(snapshotJson)
            val rulesNode = if (root.isArray) root else root.get("rules")
            val restaurantCancelRefundRate = if (root.isObject) {
                root.get("restaurantCancelRefundRate")?.asInt(100) ?: 100
            } else {
                100
            }
            RefundPolicy(
                rules = parseRules(rulesNode),
                restaurantCancelRefundRate = restaurantCancelRefundRate.coerceIn(0, 100),
                snapshotJson = snapshotJson,
            )
        } catch (exception: RuntimeException) {
            throw ApiException(ErrorCode.CONFLICT, "취소 정책을 해석할 수 없습니다.", exception)
        }

    private fun parseRules(rulesNode: JsonNode?): List<RefundPolicyRule> {
        if (rulesNode == null || !rulesNode.isArray || rulesNode.size() == 0) {
            return DEFAULT_REFUND_RULES
        }
        return rulesNode.map { node ->
            val beforeVisitHours = node.get("beforeVisitHours")?.asLong()
                ?: throw ApiException(ErrorCode.CONFLICT, "취소 정책 기준 시간이 필요합니다.")
            val refundRate = node.get("refundRate")?.asInt()
                ?: throw ApiException(ErrorCode.CONFLICT, "취소 정책 환불률이 필요합니다.")
            RefundPolicyRule(
                id = node.get("id")?.asText()?.takeIf { it.isNotBlank() }
                    ?: "rule_${beforeVisitHours}h_${refundRate}",
                beforeVisitHours = beforeVisitHours.coerceAtLeast(0),
                refundRate = refundRate.coerceIn(0, 100),
            )
        }.sortedByDescending { it.beforeVisitHours }
    }

    private fun RefundPolicy.customerRuleFor(hoursBeforeVisit: Long): RefundPolicyRule =
        rules.firstOrNull { hoursBeforeVisit >= it.beforeVisitHours }
            ?: RefundPolicyRule(
                id = "rule_under_minimum_0",
                beforeVisitHours = 0,
                refundRate = 0,
            )

    private fun hoursBeforeVisit(reservation: ReservationEntity): Long {
        val seconds = Duration.between(Instant.now(clock), reservation.reservedInstant()).seconds
        return (seconds / 3600).coerceAtLeast(0)
    }

    private fun refundMessage(
        reason: RefundReason,
        refundableAmount: Long,
        nonRefundableAmount: Long,
        refundRate: Int,
    ): String =
        when {
            refundableAmount > 0 && nonRefundableAmount == 0L && reason == RefundReason.RESTAURANT_CANCEL ->
                "매장 취소로 전액 환불 요청 대상입니다."
            refundableAmount > 0 && nonRefundableAmount == 0L ->
                "취소 정책에 따라 전액 환불 요청 대상입니다."
            refundableAmount > 0 ->
                "취소 정책 환불률 ${refundRate}%가 적용됩니다."
            else ->
                "취소 정책에 따라 환불 가능한 금액이 없습니다."
        }

    private fun accessibleReservation(
        reservationId: Long,
        lookupToken: String?,
    ): ReservationEntity {
        val reservation = reservationRepository.findBusinessReservationById(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        val token = lookupToken?.trim().orEmpty()
        if (token.isBlank()) {
            throw ApiException(ErrorCode.AUTHENTICATION_REQUIRED, "예약 조회 토큰이 필요합니다.")
        }
        if (!lookupTokenService.hasLookupAccess(reservation.reservationNumber, token)) {
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약 조회 권한이 없습니다.")
        }
        return reservation
    }

    private fun ReservationEntity.requireCustomerCancellationPreviewable() {
        if (status !in ACTIVE_RESERVATION_STATUSES) {
            throw ApiException(ErrorCode.CONFLICT, "취소할 수 없는 예약입니다.")
        }
        if (!Instant.now(clock).isBefore(reservedInstant())) {
            throw ApiException(ErrorCode.CONFLICT, "방문 시작 이후에는 고객 취소를 할 수 없습니다.")
        }
    }

    private fun ReservationEntity.reservedInstant(): Instant =
        ZonedDateTime.of(visitDate, startTime, ZoneId.of(restaurant.timezone)).toInstant()

    private fun AdminRefundManualResolveRequest?.normalizedMemo(): String? {
        val memo = this?.memo?.trim()?.takeIf { it.isNotBlank() }
        if ((memo?.length ?: 0) > MAX_MANUAL_RESOLVE_MEMO_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "수동 해결 메모는 1000자 이하여야 합니다.")
        }
        return memo
    }

    private fun RefundCalculation.toPreviewResponse(reservation: ReservationEntity): RefundPreviewResponse =
        RefundPreviewResponse(
            reservationId = reservation.id,
            paymentId = payment?.id,
            paymentStatus = payment?.status ?: reservation.paymentStatus,
            refundRequired = refundRequired,
            refundableAmount = refundableAmount,
            nonRefundableAmount = nonRefundableAmount,
            alreadyRefundedAmount = payment?.refundedAmount ?: 0,
            paidAmount = payment?.amount ?: 0,
            currency = payment?.currency ?: DEFAULT_REFUND_CURRENCY,
            policyRuleId = policyRuleId,
            reason = reason,
            message = message,
        )

    private fun RefundCalculation.toOperationResponse(reservation: ReservationEntity): RefundOperationResponse =
        RefundOperationResponse(
            refundId = null,
            paymentId = payment?.id,
            status = null,
            paymentStatus = payment?.status ?: reservation.paymentStatus,
            refundRequired = refundRequired,
            refundAmount = refundableAmount,
            nonRefundableAmount = nonRefundableAmount,
            alreadyRefundedAmount = payment?.refundedAmount ?: 0,
            currency = payment?.currency ?: DEFAULT_REFUND_CURRENCY,
            policyRuleId = policyRuleId,
            reason = reason,
            message = message,
        )

    private fun RefundEntity.toOperationResponse(
        message: String? = null,
        manualResolved: Boolean = false,
    ): RefundOperationResponse =
        RefundOperationResponse(
            refundId = id,
            paymentId = payment.id,
            status = status,
            paymentStatus = payment.status,
            refundRequired = refundAmount > 0,
            refundAmount = refundAmount,
            nonRefundableAmount = nonRefundableAmount,
            alreadyRefundedAmount = payment.refundedAmount,
            currency = payment.currency,
            policyRuleId = policyRuleId,
            reason = reason,
            message = message ?: status.defaultMessage(),
            failureCode = failureCode,
            failureMessage = failureMessage,
            manualResolved = manualResolved,
        )

    private fun RefundStatus.defaultMessage(): String =
        when (this) {
            RefundStatus.REQUESTED -> "환불 요청이 기록됐습니다."
            RefundStatus.PENDING -> "PG 환불 처리를 기다리고 있습니다."
            RefundStatus.SUCCEEDED -> "환불이 완료됐습니다."
            RefundStatus.FAILED -> "환불 요청이 실패해 운영자 확인이 필요합니다."
            RefundStatus.CANCELLED -> "환불 요청이 취소됐습니다."
        }

    private fun RefundEntity.auditSnapshot(): Map<String, Any?> =
        mapOf(
            "refundId" to id,
            "paymentId" to payment.id,
            "reservationId" to reservation.id,
            "status" to status.name,
            "refundAmount" to refundAmount,
            "nonRefundableAmount" to nonRefundableAmount,
            "reason" to reason.name,
            "policyRuleId" to policyRuleId,
            "pgRefundId" to pgRefundId,
            "failureCode" to failureCode,
            "failureMessage" to failureMessage,
            "paymentStatus" to payment.status.name,
            "paymentRefundedAmount" to payment.refundedAmount,
            "reservationPaymentStatus" to reservation.paymentStatus.name,
        )

    private fun auditRefund(
        action: String,
        refund: RefundEntity,
        before: Map<String, Any?>? = null,
        actorRole: String,
        metadata: RefundRequestMetadata? = null,
        extra: Map<String, Any?> = emptyMap(),
    ) {
        auditLogService.record(
            actorUser = null,
            actorRole = actorRole,
            action = action,
            targetType = "refund",
            targetId = refund.id,
            beforeValue = before?.let { objectMapper.writeValueAsString(it) },
            afterValue = objectMapper.writeValueAsString(refund.auditSnapshot() + extra),
            ipAddress = metadata?.ipAddress,
            userAgent = metadata?.userAgent,
        )
    }

    private companion object {
        val ACTIVE_RESERVATION_STATUSES = setOf(ReservationStatus.CONFIRMED, ReservationStatus.MODIFIED)
        val REFUNDABLE_PAYMENT_STATUSES = setOf(
            PaymentStatus.PAID,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUND_FAILED,
        )
        val REFUNDABLE_PAYMENT_TYPES = setOf(
            PaymentType.DEPOSIT,
            PaymentType.PREPAID,
            PaymentType.GUARANTEE_CHARGE,
        )
        val DEFAULT_REFUND_RULES = listOf(
            RefundPolicyRule(id = "rule_48h_100", beforeVisitHours = 48, refundRate = 100),
            RefundPolicyRule(id = "rule_24h_50", beforeVisitHours = 24, refundRate = 50),
            RefundPolicyRule(id = "rule_0h_0", beforeVisitHours = 0, refundRate = 0),
        )
        val DEFAULT_REFUND_POLICY_JSON =
            """{"rules":[{"id":"rule_48h_100","beforeVisitHours":48,"refundRate":100},{"id":"rule_24h_50","beforeVisitHours":24,"refundRate":50},{"id":"rule_0h_0","beforeVisitHours":0,"refundRate":0}],"restaurantCancelRefundRate":100}"""
    }
}

data class RefundRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)

private data class RefundPolicy(
    val rules: List<RefundPolicyRule>,
    val restaurantCancelRefundRate: Int,
    val snapshotJson: String?,
)

private data class RefundPolicyRule(
    val id: String,
    val beforeVisitHours: Long,
    val refundRate: Int,
)

private data class RefundCalculation(
    val payment: PaymentEntity?,
    val reason: RefundReason,
    val refundableAmount: Long,
    val nonRefundableAmount: Long,
    val policyRuleId: String?,
    val policySnapshotJson: String?,
    val message: String,
) {
    val refundRequired: Boolean
        get() = refundableAmount > 0

    companion object {
        fun noRefund(
            reason: RefundReason,
            message: String,
            payment: PaymentEntity? = null,
        ): RefundCalculation =
            RefundCalculation(
                payment = payment,
                reason = reason,
                refundableAmount = 0,
                nonRefundableAmount = payment?.let { it.amount - it.refundedAmount } ?: 0,
                policyRuleId = null,
                policySnapshotJson = null,
                message = message,
            )
    }
}
