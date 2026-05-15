package com.example.restaurant.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PaymentRepository : JpaRepository<PaymentEntity, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): PaymentEntity?

    fun findByPgProviderKeyAndPgPaymentId(
        pgProviderKey: String,
        pgPaymentId: String,
    ): PaymentEntity?

    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<PaymentEntity>

    fun findByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): List<PaymentEntity>
}
