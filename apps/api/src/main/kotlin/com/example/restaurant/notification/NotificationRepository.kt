package com.example.restaurant.notification

import org.springframework.data.jpa.repository.JpaRepository

interface NotificationRepository : JpaRepository<NotificationEntity, Long> {
    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<NotificationEntity>

    fun countByReservationIdAndTemplateKey(
        reservationId: Long,
        templateKey: String,
    ): Long
}
