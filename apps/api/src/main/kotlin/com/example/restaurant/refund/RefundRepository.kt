package com.example.restaurant.refund

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

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

    @Query(
        """
        select r from RefundEntity r
        join fetch r.payment p
        join fetch r.reservation rv
        join fetch rv.reservationProduct rp
        join fetch rv.customer c
        where r.restaurant.id = :restaurantId
          and (:fromCreatedAt is null or r.createdAt >= :fromCreatedAt)
          and (:toCreatedAtExclusive is null or r.createdAt < :toCreatedAtExclusive)
        order by r.createdAt desc, r.id desc
        """,
    )
    fun findBusinessRefunds(
        @Param("restaurantId") restaurantId: Long,
        @Param("fromCreatedAt") fromCreatedAt: Instant?,
        @Param("toCreatedAtExclusive") toCreatedAtExclusive: Instant?,
    ): List<RefundEntity>
}
