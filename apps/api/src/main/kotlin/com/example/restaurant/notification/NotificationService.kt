package com.example.restaurant.notification

import com.example.restaurant.reservation.ReservationEntity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

const val RESERVATION_CONFIRMED_TEMPLATE = "RESERVATION_CONFIRMED"
const val RESERVATION_CANCELLED_TEMPLATE = "RESERVATION_CANCELLED"

@Service
class NotificationService(
    private val notificationRepository: NotificationRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun recordReservationConfirmed(reservation: ReservationEntity): NotificationEntity =
        recordReservationEvent(reservation, RESERVATION_CONFIRMED_TEMPLATE)

    @Transactional
    fun recordReservationCancelled(reservation: ReservationEntity): NotificationEntity =
        recordReservationEvent(reservation, RESERVATION_CANCELLED_TEMPLATE)

    private fun recordReservationEvent(
        reservation: ReservationEntity,
        templateKey: String,
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
                payloadJson = objectMapper.writeValueAsString(reservation.notificationPayload(templateKey)),
            ),
        )

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
}
