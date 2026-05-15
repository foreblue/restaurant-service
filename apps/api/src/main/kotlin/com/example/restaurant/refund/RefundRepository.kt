package com.example.restaurant.refund

import org.springframework.data.jpa.repository.JpaRepository

interface RefundRepository : JpaRepository<RefundEntity, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): RefundEntity?

    fun findByPaymentIdOrderByCreatedAtAsc(paymentId: Long): List<RefundEntity>

    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<RefundEntity>

    fun findByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): List<RefundEntity>
}
