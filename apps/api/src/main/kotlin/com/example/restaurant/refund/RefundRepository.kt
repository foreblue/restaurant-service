package com.example.restaurant.refund

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface RefundRepository : JpaRepository<RefundEntity, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): RefundEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RefundEntity r where r.id = :id")
    fun findByIdForUpdate(
        @Param("id") id: Long,
    ): RefundEntity?

    fun findByPaymentIdOrderByCreatedAtAsc(paymentId: Long): List<RefundEntity>

    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<RefundEntity>

    fun findByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): List<RefundEntity>
}
