package com.example.restaurant.payment

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.notification.NotificationService
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationStatus
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.OffsetDateTime
import java.time.format.DateTimeParseException
import java.util.Locale

private const val MAX_WEBHOOK_ID_LENGTH = 128
private const val MAX_WEBHOOK_TYPE_LENGTH = 100
private const val DEFAULT_PG_PROVIDER_KEY = "fake"
private const val DEFAULT_WEBHOOK_CURRENCY = "KRW"

@Service
class PgWebhookService(
    private val pgWebhookEventRepository: PgWebhookEventRepository,
    private val paymentRepository: PaymentRepository,
    private val signatureVerifier: PgWebhookSignatureVerifier,
    private val auditLogService: AuditLogService,
    private val notificationService: NotificationService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun receive(
        request: PgWebhookRequest,
        headerSignature: String?,
    ): PgWebhookResponse {
        val normalized = request.normalized(headerSignature)
        pgWebhookEventRepository.findByProviderKeyAndEventId(normalized.providerKey, normalized.eventId)?.let {
            return it.toResponse(PgWebhookEventStatus.DUPLICATE)
        }

        val payload = objectMapper.writeValueAsString(request)
        val verified = signatureVerifier.verify(
            PgWebhookVerificationRequest(
                providerKey = normalized.providerKey,
                eventId = normalized.eventId,
                signature = normalized.signature,
                payload = payload,
            ),
        )
        val event = pgWebhookEventRepository.saveAndFlush(
            PgWebhookEventEntity(
                providerKey = normalized.providerKey,
                eventId = normalized.eventId,
                eventType = normalized.eventType,
                pgPaymentId = normalized.pgPaymentId,
                pgRefundId = normalized.pgRefundId,
                amount = normalized.amount,
                currency = normalized.currency,
                signature = normalized.signature,
                payload = payload,
                verified = verified,
                status = if (verified) PgWebhookEventStatus.RECEIVED else PgWebhookEventStatus.SIGNATURE_FAILED,
                occurredAt = normalized.occurredAt,
            ),
        )

        if (!verified) {
            event.processedAt = Instant.now(clock)
            event.failureCode = "SIGNATURE_INVALID"
            event.failureMessage = "PG webhook signature 검증에 실패했습니다."
            auditWebhookEvent("PG_WEBHOOK_SIGNATURE_FAILED", event)
            return event.toResponse()
        }

        return try {
            processVerifiedEvent(event)
            event.toResponse()
        } catch (exception: ApiException) {
            event.markFailed(exception.errorCode.code, exception.message ?: exception.errorCode.defaultMessage)
            auditWebhookEvent("PG_WEBHOOK_PROCESSING_FAILED", event)
            event.toResponse()
        } catch (exception: RuntimeException) {
            event.markFailed("WEBHOOK_PROCESSING_ERROR", exception.message ?: "PG webhook 처리 중 오류가 발생했습니다.")
            auditWebhookEvent("PG_WEBHOOK_PROCESSING_FAILED", event)
            event.toResponse()
        }
    }

    private fun processVerifiedEvent(event: PgWebhookEventEntity) {
        val payment = event.pgPaymentId
            ?.let { paymentRepository.findByPgProviderKeyAndPgPaymentId(event.providerKey, it) }
            ?: throw ApiException(ErrorCode.NOT_FOUND, "webhook 대상 결제를 찾을 수 없습니다.")
        event.payment = payment
        event.reservation = payment.reservation
        if (event.amount != null && event.amount != payment.amount) {
            throw ApiException(ErrorCode.CONFLICT, "webhook 결제 금액이 원장 금액과 일치하지 않습니다.")
        }

        val before = payment.auditSnapshot()
        val previousStatus = payment.status
        when (event.eventType) {
            "payment.succeeded" -> payment.applySucceeded(event)
            "payment.failed" -> payment.applyTerminalFailure(event, PaymentStatus.FAILED)
            "payment.cancelled" -> payment.applyTerminalFailure(event, PaymentStatus.CANCELLED)
            "payment.expired" -> payment.applyTerminalFailure(event, PaymentStatus.EXPIRED)
            else -> {
                event.status = PgWebhookEventStatus.IGNORED
                event.failureCode = "UNSUPPORTED_EVENT_TYPE"
                event.failureMessage = "지원하지 않는 PG webhook eventType입니다."
                event.processedAt = Instant.now(clock)
                auditWebhookEvent("PG_WEBHOOK_IGNORED", event)
                return
            }
        }
        event.status = PgWebhookEventStatus.PROCESSED
        event.processedAt = Instant.now(clock)
        auditPaymentChange(event, before, payment.auditSnapshot())
        if (event.eventType == "payment.succeeded" && previousStatus != PaymentStatus.PAID && payment.status == PaymentStatus.PAID) {
            notificationService.recordPaymentCompleted(payment)
        }
    }

    private fun PaymentEntity.applySucceeded(event: PgWebhookEventEntity) {
        val nextStatus = if (paymentType == PaymentType.CARD_GUARANTEE) {
            PaymentStatus.GUARANTEE_REGISTERED
        } else {
            PaymentStatus.PAID
        }
        if (status == nextStatus) {
            reservation.applyPaymentStatus(nextStatus)
            return
        }
        if (status != PaymentStatus.PENDING) {
            throw ApiException(ErrorCode.CONFLICT, "현재 결제 상태에서는 성공 webhook을 적용할 수 없습니다.")
        }
        status = nextStatus
        paidAt = event.occurredAt ?: Instant.now(clock)
        failureCode = null
        failureMessage = null
        reservation.applyPaymentStatus(nextStatus)
    }

    private fun PaymentEntity.applyTerminalFailure(
        event: PgWebhookEventEntity,
        nextStatus: PaymentStatus,
    ) {
        status = nextStatus
        failureCode = event.eventType.uppercase(Locale.ROOT)
        failureMessage = "PG webhook으로 $nextStatus 상태가 수신되었습니다."
        reservation.applyPaymentStatus(nextStatus)
    }

    private fun ReservationEntity.applyPaymentStatus(status: PaymentStatus) {
        paymentStatus = status
        paymentRequired = status == PaymentStatus.FAILED
        paymentDueAt = null
        if (status in setOf(PaymentStatus.PAID, PaymentStatus.GUARANTEE_REGISTERED) && this.status != ReservationStatus.CONFIRMED) {
            this.status = ReservationStatus.CONFIRMED
        }
    }

    private fun PgWebhookEventEntity.markFailed(
        code: String,
        message: String,
    ) {
        status = PgWebhookEventStatus.FAILED
        failureCode = code
        failureMessage = message
        processedAt = Instant.now(clock)
    }

    private fun PgWebhookRequest.normalized(headerSignature: String?): NormalizedPgWebhookRequest {
        val normalizedProviderKey = providerKey?.trim()?.takeIf { it.isNotBlank() } ?: DEFAULT_PG_PROVIDER_KEY
        val normalizedEventId = eventId?.trim().orEmpty()
        if (normalizedEventId.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "eventId가 필요합니다.")
        }
        if (normalizedEventId.length > MAX_WEBHOOK_ID_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "eventId는 128자 이하여야 합니다.")
        }
        val normalizedEventType = eventType?.trim()?.lowercase(Locale.ROOT).orEmpty()
        if (normalizedEventType.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "eventType이 필요합니다.")
        }
        if (normalizedEventType.length > MAX_WEBHOOK_TYPE_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "eventType은 100자 이하여야 합니다.")
        }
        val normalizedCurrency = currency?.trim()?.uppercase(Locale.ROOT)?.takeIf { it.isNotBlank() }
            ?: DEFAULT_WEBHOOK_CURRENCY
        if (normalizedCurrency.length != 3) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "currency는 ISO 4217 3자리 코드여야 합니다.")
        }
        if ((amount ?: 0) < 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "amount는 0 이상이어야 합니다.")
        }
        return NormalizedPgWebhookRequest(
            providerKey = normalizedProviderKey,
            eventId = normalizedEventId,
            eventType = normalizedEventType,
            pgPaymentId = pgPaymentId?.trim()?.takeIf { it.isNotBlank() },
            pgRefundId = pgRefundId?.trim()?.takeIf { it.isNotBlank() },
            amount = amount,
            currency = normalizedCurrency,
            occurredAt = occurredAt.parseWebhookInstant(),
            signature = headerSignature?.takeIf { it.isNotBlank() } ?: signature?.takeIf { it.isNotBlank() },
        )
    }

    private fun String?.parseWebhookInstant(): Instant? {
        if (this.isNullOrBlank()) {
            return null
        }
        return try {
            OffsetDateTime.parse(trim()).toInstant()
        } catch (_: DateTimeParseException) {
            try {
                Instant.parse(trim())
            } catch (exception: DateTimeParseException) {
                throw ApiException(ErrorCode.VALIDATION_ERROR, "occurredAt 형식이 올바르지 않습니다.", exception)
            }
        }
    }

    private fun PaymentEntity.auditSnapshot(): Map<String, Any?> =
        mapOf(
            "paymentId" to id,
            "reservationId" to reservation.id,
            "paymentType" to paymentType.name,
            "status" to status.name,
            "amount" to amount,
            "refundedAmount" to refundedAmount,
            "pgProviderKey" to pgProviderKey,
            "pgPaymentId" to pgPaymentId,
            "failureCode" to failureCode,
            "paidAt" to paidAt?.toString(),
            "reservationPaymentStatus" to reservation.paymentStatus.name,
            "reservationStatus" to reservation.status.name,
        )

    private fun auditPaymentChange(
        event: PgWebhookEventEntity,
        before: Map<String, Any?>,
        after: Map<String, Any?>,
    ) {
        auditLogService.record(
            actorUser = null,
            actorRole = "SYSTEM",
            action = "PG_WEBHOOK_${event.eventType.uppercase(Locale.ROOT).replace('.', '_')}",
            targetType = "payment",
            targetId = event.payment?.id ?: event.id,
            beforeValue = objectMapper.writeValueAsString(before),
            afterValue = objectMapper.writeValueAsString(after + ("webhookEventId" to event.eventId)),
        )
    }

    private fun auditWebhookEvent(
        action: String,
        event: PgWebhookEventEntity,
    ) {
        auditLogService.record(
            actorUser = null,
            actorRole = "SYSTEM",
            action = action,
            targetType = "pg_webhook_event",
            targetId = event.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "eventId" to event.eventId,
                    "eventType" to event.eventType,
                    "status" to event.status.name,
                    "failureCode" to event.failureCode,
                    "failureMessage" to event.failureMessage,
                ),
            ),
        )
    }

    private fun PgWebhookEventEntity.toResponse(
        overrideStatus: PgWebhookEventStatus? = null,
    ): PgWebhookResponse =
        PgWebhookResponse(
            eventId = eventId,
            status = overrideStatus ?: status,
            paymentId = payment?.id,
            paymentStatus = payment?.status,
            reservationId = reservation?.id,
            reservationPaymentStatus = reservation?.paymentStatus,
            failureCode = failureCode,
            failureMessage = failureMessage,
        )
}

private data class NormalizedPgWebhookRequest(
    val providerKey: String,
    val eventId: String,
    val eventType: String,
    val pgPaymentId: String?,
    val pgRefundId: String?,
    val amount: Long?,
    val currency: String,
    val occurredAt: Instant?,
    val signature: String?,
)
