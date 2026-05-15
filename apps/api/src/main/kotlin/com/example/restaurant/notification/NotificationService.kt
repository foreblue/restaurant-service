package com.example.restaurant.notification

import com.example.restaurant.payment.PaymentEntity
import com.example.restaurant.refund.RefundEntity
import com.example.restaurant.reservation.ReservationEntity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

const val RESERVATION_CONFIRMED_TEMPLATE = "RESERVATION_CONFIRMED"
const val RESERVATION_UPDATED_TEMPLATE = "RESERVATION_UPDATED"
const val RESERVATION_CANCELLED_TEMPLATE = "RESERVATION_CANCELLED"
const val PAYMENT_COMPLETED_TEMPLATE = "PAYMENT_COMPLETED"
const val REFUND_COMPLETED_TEMPLATE = "REFUND_COMPLETED"
const val VISIT_REMINDER_TEMPLATE = "VISIT_REMINDER"

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun recordReservationConfirmed(reservation: ReservationEntity): NotificationEntity {
        val notification = recordReservationEvent(reservation, RESERVATION_CONFIRMED_TEMPLATE)
        recordVisitReminder(reservation)
        return notification
    }

    @Transactional
    fun recordReservationUpdated(reservation: ReservationEntity): NotificationEntity {
        cancelQueuedVisitReminders(reservation)
        val notification = recordReservationEvent(reservation, RESERVATION_UPDATED_TEMPLATE)
        recordVisitReminder(reservation)
        return notification
    }

    @Transactional
    fun recordReservationCancelled(reservation: ReservationEntity): NotificationEntity {
        cancelQueuedVisitReminders(reservation)
        return recordReservationEvent(reservation, RESERVATION_CANCELLED_TEMPLATE)
    }

    @Transactional
    fun recordPaymentCompleted(payment: PaymentEntity): List<NotificationEntity> =
        listOf(
            recordReservationEvent(
                reservation = payment.reservation,
                templateKey = PAYMENT_COMPLETED_TEMPLATE,
                extraPayload = payment.notificationPayload(),
            ),
            recordOwnerEvent(
                reservation = payment.reservation,
                templateKey = PAYMENT_COMPLETED_TEMPLATE,
                extraPayload = payment.notificationPayload(),
            ),
        )

    @Transactional
    fun recordRefundCompleted(refund: RefundEntity): List<NotificationEntity> =
        listOf(
            recordReservationEvent(
                reservation = refund.reservation,
                templateKey = REFUND_COMPLETED_TEMPLATE,
                extraPayload = refund.notificationPayload(),
            ),
            recordOwnerEvent(
                reservation = refund.reservation,
                templateKey = REFUND_COMPLETED_TEMPLATE,
                extraPayload = refund.notificationPayload(),
            ),
        )

    private fun recordReservationEvent(
        reservation: ReservationEntity,
        templateKey: String,
        extraPayload: Map<String, Any?> = emptyMap(),
        scheduledAt: Instant? = null,
    ): NotificationEntity =
        notificationRepository.saveAndFlush(
            NotificationEntity(
                restaurant = reservation.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                recipientType = NotificationRecipientType.CUSTOMER,
                channel = NotificationChannel.SMS,
                recipientContact = reservation.customer.phoneNumber,
                templateKey = templateKey,
                status = NotificationStatus.QUEUED,
                payloadJson = objectMapper.writeValueAsString(
                    reservation.notificationPayload(templateKey) + extraPayload,
                ),
                scheduledAt = scheduledAt,
            ),
        )

    private fun recordOwnerEvent(
        reservation: ReservationEntity,
        templateKey: String,
        extraPayload: Map<String, Any?>,
    ): NotificationEntity =
        notificationRepository.saveAndFlush(
            NotificationEntity(
                restaurant = reservation.restaurant,
                reservation = reservation,
                customer = null,
                recipientType = NotificationRecipientType.OWNER,
                channel = NotificationChannel.EMAIL,
                recipientContact = reservation.restaurant.owner.email,
                templateKey = templateKey,
                status = NotificationStatus.QUEUED,
                payloadJson = objectMapper.writeValueAsString(
                    reservation.notificationPayload(templateKey) + extraPayload,
                ),
            ),
        )

    private fun recordVisitReminder(reservation: ReservationEntity): NotificationEntity =
        recordReservationEvent(
            reservation = reservation,
            templateKey = VISIT_REMINDER_TEMPLATE,
            scheduledAt = reservation.visitReminderAt(),
        )

    private fun cancelQueuedVisitReminders(reservation: ReservationEntity) {
        notificationRepository.findByReservationIdAndTemplateKeyAndStatusIn(
            reservationId = reservation.id,
            templateKey = VISIT_REMINDER_TEMPLATE,
            statuses = listOf(NotificationStatus.QUEUED, NotificationStatus.FAILED),
        ).forEach {
            it.status = NotificationStatus.CANCELLED
            it.nextRetryAt = null
            it.lastError = "예약 상태 변경으로 방문 전 리마인드를 취소했습니다."
        }
    }

    private fun ReservationEntity.notificationPayload(templateKey: String): Map<String, Any?> =
        mapOf(
            "templateKey" to templateKey,
            "reservationId" to id,
            "reservationNumber" to reservationNumber,
            "restaurantId" to restaurant.id,
            "restaurantName" to restaurant.name,
            "productId" to reservationProduct.id,
            "productName" to reservationProduct.name,
            "visitDate" to visitDate.toString(),
            "startTime" to startTime.toString(),
            "endTime" to endTime.toString(),
            "partySize" to partySize,
            "status" to status.name,
        )

    private fun ReservationEntity.visitReminderAt(): Instant {
        val visitAt = ZonedDateTime.of(visitDate, startTime, ZoneId.of(restaurant.timezone)).toInstant()
        val reminderAt = visitAt.minus(24, ChronoUnit.HOURS)
        val now = Instant.now(clock)
        return if (reminderAt.isAfter(now)) reminderAt else now
    }

    private fun PaymentEntity.notificationPayload(): Map<String, Any?> =
        mapOf(
            "paymentId" to id,
            "paymentType" to paymentType.name,
            "paymentStatus" to status.name,
            "amount" to amount,
            "currency" to currency,
            "paidAt" to paidAt?.toString(),
        )

    private fun RefundEntity.notificationPayload(): Map<String, Any?> =
        mapOf(
            "refundId" to id,
            "refundStatus" to status.name,
            "refundAmount" to refundAmount,
            "nonRefundableAmount" to nonRefundableAmount,
            "reason" to reason.name,
            "succeededAt" to succeededAt?.toString(),
        )
}
