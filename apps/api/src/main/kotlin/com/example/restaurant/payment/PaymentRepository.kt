package com.example.restaurant.payment

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface PaymentRepository : JpaRepository<PaymentEntity, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): PaymentEntity?

    fun findByPgProviderKeyAndPgPaymentId(
        pgProviderKey: String,
        pgPaymentId: String,
    ): PaymentEntity?

    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<PaymentEntity>

    fun findByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): List<PaymentEntity>

    @Query(
        """
        select p from PaymentEntity p
        join fetch p.reservation r
        join fetch r.reservationProduct rp
        join fetch p.customer c
        where p.restaurant.id = :restaurantId
          and (:fromCreatedAt is null or p.createdAt >= :fromCreatedAt)
          and (:toCreatedAtExclusive is null or p.createdAt < :toCreatedAtExclusive)
        order by p.createdAt desc, p.id desc
        """,
    )
    fun findBusinessPayments(
        @Param("restaurantId") restaurantId: Long,
        @Param("fromCreatedAt") fromCreatedAt: Instant?,
        @Param("toCreatedAtExclusive") toCreatedAtExclusive: Instant?,
    ): List<PaymentEntity>

    @Query(
        """
        select p from PaymentEntity p
        join fetch p.reservation r
        join fetch r.reservationProduct
        where p.restaurant.id = :restaurantId
          and p.paidAt is not null
          and p.paidAt >= :fromPaidAt
          and p.paidAt < :toPaidAtExclusive
        order by p.paidAt asc, p.id asc
        """,
    )
    fun findAnalyticsPaidPayments(
        @Param("restaurantId") restaurantId: Long,
        @Param("fromPaidAt") fromPaidAt: Instant,
        @Param("toPaidAtExclusive") toPaidAtExclusive: Instant,
    ): List<PaymentEntity>
}
