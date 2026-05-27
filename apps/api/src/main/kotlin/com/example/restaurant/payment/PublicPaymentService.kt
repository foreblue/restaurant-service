package com.example.restaurant.payment

import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.member.CustomerMemberStatus
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationPaymentMode
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.Locale

private const val MAX_PAYMENT_IDEMPOTENCY_KEY_LENGTH = 128
private const val MAX_RETURN_URL_LENGTH = 500
private const val DEFAULT_CURRENCY = "KRW"

@Service
class PublicPaymentService(
    private val reservationRepository: ReservationRepository,
    private val paymentRepository: PaymentRepository,
    private val lookupTokenService: ReservationLookupTokenService,
    private val paymentPolicyResolver: ReservationPaymentPolicyResolver,
    private val paymentGateway: PaymentGateway,
) {
    @Transactional(readOnly = true)
    fun summary(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long? = null,
    ): PublicPaymentSummaryResponse {
        val reservation = accessibleReservation(reservationId, lookupToken, memberId)
        val policy = paymentPolicyResolver.resolve(reservation.reservationProduct, reservation.partySize)
        return PublicPaymentSummaryResponse(
            reservationId = reservation.id,
            paymentMode = reservation.paymentMode,
            paymentStatus = reservation.paymentStatus,
            paymentRequired = reservation.paymentRequired,
            amount = policy.amount,
            currency = DEFAULT_CURRENCY,
            paymentDueAt = reservation.paymentDueAt,
            cancellationPolicySummary = reservation.cancellationPolicySnapshotJson?.let {
                "예약 생성 시점 취소 정책이 적용됩니다."
            },
        )
    }

    @Transactional
    fun startPayment(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long? = null,
        headerIdempotencyKey: String?,
        request: PublicPaymentStartRequest,
    ): PublicPaymentStartResponse {
        val reservation = accessibleReservation(reservationId, lookupToken, memberId)
        reservation.requirePaymentStartable()
        val policy = paymentPolicyResolver.resolve(reservation.reservationProduct, reservation.partySize)
        if (policy.mode == ReservationPaymentMode.CARD_GUARANTEE) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "카드 보증 예약은 보증 등록 API를 사용해야 합니다.")
        }
        request.paymentMode?.parsePaymentMode()?.let { requestedMode ->
            if (requestedMode != policy.mode) {
                throw ApiException(ErrorCode.CONFLICT, "예약 상품 결제 정책과 요청 결제 방식이 일치하지 않습니다.")
            }
        }
        val idempotencyKey = normalizedIdempotencyKey(headerIdempotencyKey, request.idempotencyKey)
        existingPayment(idempotencyKey, reservation.id, policy.paymentType)?.let {
            return it.toPaymentResponse()
        }

        if (!policy.requiresGateway) {
            val payment = paymentRepository.saveAndFlush(
                PaymentEntity(
                    restaurant = reservation.restaurant,
                    reservation = reservation,
                    customer = reservation.customer,
                    paymentType = policy.paymentType,
                    status = policy.initialStatus,
                    amount = policy.amount,
                    idempotencyKey = idempotencyKey,
                ),
            )
            reservation.paymentRequired = false
            reservation.paymentMode = policy.mode
            reservation.paymentStatus = policy.initialStatus
            reservation.paymentDueAt = null
            return payment.toPaymentResponse()
        }

        val returnUrl = request.returnUrl.normalizedReturnUrl()
        val payment = paymentRepository.saveAndFlush(
            PaymentEntity(
                restaurant = reservation.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                paymentType = policy.paymentType,
                status = PaymentStatus.PENDING,
                amount = policy.amount,
                idempotencyKey = idempotencyKey,
            ),
        )
        val gatewayResult = paymentGateway.createPayment(
            PaymentGatewayRequest(
                paymentId = payment.id,
                reservationNumber = reservation.reservationNumber,
                amount = payment.amount,
                currency = payment.currency,
                returnUrl = returnUrl,
                idempotencyKey = idempotencyKey,
            ),
        )
        payment.applyGatewayResult(gatewayResult)
        reservation.applyPaymentResult(policy.mode, gatewayResult.toPaymentStatus(), gatewayResult.expiresAt)
        return payment.toPaymentResponse(gatewayResult.action)
    }

    @Transactional
    fun startGuarantee(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long? = null,
        headerIdempotencyKey: String?,
        request: PublicGuaranteeStartRequest,
    ): PublicGuaranteeStartResponse {
        val reservation = accessibleReservation(reservationId, lookupToken, memberId)
        reservation.requirePaymentStartable()
        val policy = paymentPolicyResolver.resolve(reservation.reservationProduct, reservation.partySize)
        if (policy.mode != ReservationPaymentMode.CARD_GUARANTEE) {
            throw ApiException(ErrorCode.CONFLICT, "카드 보증이 필요한 예약이 아닙니다.")
        }
        val idempotencyKey = normalizedIdempotencyKey(headerIdempotencyKey, request.idempotencyKey)
        existingPayment(idempotencyKey, reservation.id, PaymentType.CARD_GUARANTEE)?.let {
            return it.toGuaranteeResponse()
        }

        val payment = paymentRepository.saveAndFlush(
            PaymentEntity(
                restaurant = reservation.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                paymentType = PaymentType.CARD_GUARANTEE,
                status = PaymentStatus.PENDING,
                amount = 0,
                idempotencyKey = idempotencyKey,
            ),
        )
        val gatewayResult = paymentGateway.registerGuarantee(
            PaymentGatewayRequest(
                paymentId = payment.id,
                reservationNumber = reservation.reservationNumber,
                amount = 0,
                currency = payment.currency,
                returnUrl = request.returnUrl.normalizedReturnUrl(),
                idempotencyKey = idempotencyKey,
            ),
        )
        payment.applyGatewayResult(gatewayResult)
        reservation.applyPaymentResult(policy.mode, gatewayResult.toPaymentStatus(), gatewayResult.expiresAt)
        return payment.toGuaranteeResponse(gatewayResult.action)
    }

    private fun accessibleReservation(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long?,
    ): ReservationEntity {
        val reservation = reservationRepository.findBusinessReservationById(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        memberId?.let {
            if (it < 1) {
                throw ApiException(ErrorCode.VALIDATION_ERROR, "memberId가 올바르지 않습니다.")
            }
            if (
                reservation.member?.id == it &&
                reservation.member?.status == CustomerMemberStatus.ACTIVE
            ) {
                return reservation
            }
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약 조회 권한이 없습니다.")
        }
        val token = lookupToken?.trim().orEmpty()
        if (token.isBlank()) {
            throw ApiException(ErrorCode.AUTHENTICATION_REQUIRED, "예약 조회 토큰이 필요합니다.")
        }
        if (!lookupTokenService.hasLookupAccess(reservation.reservationNumber, token)) {
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약 조회 권한이 없습니다.")
        }
        return reservation
    }

    private fun ReservationEntity.requirePaymentStartable() {
        if (status !in setOf(ReservationStatus.CONFIRMED, ReservationStatus.MODIFIED)) {
            throw ApiException(ErrorCode.CONFLICT, "결제를 시작할 수 없는 예약 상태입니다.")
        }
    }

    private fun existingPayment(
        idempotencyKey: String,
        reservationId: Long,
        paymentType: PaymentType,
    ): PaymentEntity? =
        paymentRepository.findByIdempotencyKey(idempotencyKey)?.also {
            if (it.reservation.id != reservationId || it.paymentType != paymentType) {
                throw ApiException(ErrorCode.CONFLICT, "같은 Idempotency-Key로 다른 결제 요청을 처리할 수 없습니다.")
            }
        }

    private fun normalizedIdempotencyKey(
        headerIdempotencyKey: String?,
        bodyIdempotencyKey: String?,
    ): String {
        val key = (headerIdempotencyKey?.takeIf { it.isNotBlank() } ?: bodyIdempotencyKey)
            ?.trim()
            .orEmpty()
        if (key.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "Idempotency-Key가 필요합니다.")
        }
        if (key.length > MAX_PAYMENT_IDEMPOTENCY_KEY_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "Idempotency-Key는 128자 이하여야 합니다.")
        }
        return key
    }

    private fun String?.normalizedReturnUrl(): String {
        val normalized = this?.trim().orEmpty()
        if (normalized.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "returnUrl이 필요합니다.")
        }
        if (normalized.length > MAX_RETURN_URL_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "returnUrl은 500자 이하여야 합니다.")
        }
        val lower = normalized.lowercase(Locale.ROOT)
        if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "returnUrl은 http 또는 https URL이어야 합니다.")
        }
        return normalized
    }

    private fun String.parsePaymentMode(): ReservationPaymentMode =
        try {
            ReservationPaymentMode.valueOf(trim().uppercase(Locale.ROOT))
        } catch (exception: IllegalArgumentException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "paymentMode 값이 올바르지 않습니다.", exception)
        }

    private fun PaymentGatewayResult.toPaymentStatus(): PaymentStatus =
        when (status) {
            PaymentGatewayResultStatus.PENDING -> PaymentStatus.PENDING
            PaymentGatewayResultStatus.FAILED -> PaymentStatus.FAILED
            PaymentGatewayResultStatus.EXPIRED -> PaymentStatus.EXPIRED
        }

    private fun PaymentEntity.applyGatewayResult(result: PaymentGatewayResult) {
        status = result.toPaymentStatus()
        pgProviderKey = result.providerKey
        pgPaymentId = result.providerPaymentId
        pgOrderId = result.providerOrderId
        failureCode = result.failureCode
        failureMessage = result.failureMessage
        expiresAt = result.expiresAt
    }

    private fun ReservationEntity.applyPaymentResult(
        mode: ReservationPaymentMode,
        status: PaymentStatus,
        dueAt: java.time.Instant?,
    ) {
        paymentRequired = status in setOf(PaymentStatus.PENDING, PaymentStatus.REQUIRES_PAYMENT, PaymentStatus.FAILED)
        paymentMode = mode
        paymentStatus = status
        paymentDueAt = dueAt
    }

    private fun PaymentEntity.toPaymentResponse(
        action: PaymentGatewayAction? = reconstructedAction("payments"),
    ): PublicPaymentStartResponse =
        PublicPaymentStartResponse(
            paymentId = id,
            status = status,
            amount = amount,
            currency = currency,
            paymentAction = action?.toResponse(),
            expiresAt = expiresAt,
        )

    private fun PaymentEntity.toGuaranteeResponse(
        action: PaymentGatewayAction? = reconstructedAction("guarantees"),
    ): PublicGuaranteeStartResponse =
        PublicGuaranteeStartResponse(
            paymentId = id,
            status = status,
            guaranteeAction = action?.toResponse(),
            expiresAt = expiresAt,
        )

    private fun PaymentEntity.reconstructedAction(actionPath: String): PaymentGatewayAction? =
        pgPaymentId
            ?.takeIf { status == PaymentStatus.PENDING }
            ?.let {
                PaymentGatewayAction(
                    type = "REDIRECT",
                    url = "https://pg.example.test/$actionPath/$it",
                )
            }

    private fun PaymentGatewayAction.toResponse(): PublicPaymentActionResponse =
        PublicPaymentActionResponse(
            type = type,
            url = url,
        )
}
