package com.example.restaurant.reservation

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.time.LocalTime

interface ReservationRepository : JpaRepository<ReservationEntity, Long> {
    fun findByIdempotencyKey(idempotencyKey: String): ReservationEntity?

    fun findByReservationNumber(reservationNumber: String): ReservationEntity?

    fun countByRestaurantId(restaurantId: Long): Long

    fun countByCustomerId(customerId: Long): Long

    fun countByCustomerIdAndStatus(customerId: Long, status: ReservationStatus): Long

    fun countByCustomerIdAndStatusIn(
        customerId: Long,
        statuses: Collection<ReservationStatus>,
    ): Long

    fun findByCustomerIdOrderByVisitDateDescStartTimeDescIdDesc(customerId: Long): List<ReservationEntity>

    @Query(
        """
        select r from ReservationEntity r
        join fetch r.restaurant
        join fetch r.reservationProduct
        join fetch r.customer
        where r.restaurant.id = :restaurantId
          and r.visitDate between :fromDate and :toDate
        order by r.visitDate asc, r.startTime asc, r.id asc
        """,
    )
    fun findBusinessReservations(
        @Param("restaurantId") restaurantId: Long,
        @Param("fromDate") fromDate: LocalDate,
        @Param("toDate") toDate: LocalDate,
    ): List<ReservationEntity>

    @Query(
        """
        select r from ReservationEntity r
        join fetch r.restaurant
        join fetch r.reservationProduct
        join fetch r.customer
        where r.id = :id
        """,
    )
    fun findBusinessReservationById(
        @Param("id") id: Long,
    ): ReservationEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ReservationEntity r where r.id = :id")
    fun findByIdForUpdate(
        @Param("id") id: Long,
    ): ReservationEntity?

    @Query(
        """
        select coalesce(sum(r.partySize), 0)
        from ReservationEntity r
        where r.reservationProduct.id = :productId
          and r.visitDate = :visitDate
          and r.startTime = :startTime
          and r.status in :statuses
        """,
    )
    fun sumPartySizeBySlot(
        @Param("productId") productId: Long,
        @Param("visitDate") visitDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("statuses") statuses: Collection<ReservationStatus>,
    ): Long

    @Query(
        """
        select coalesce(sum(r.partySize), 0)
        from ReservationEntity r
        where r.reservationProduct.id = :productId
          and r.visitDate = :visitDate
          and r.status in :statuses
          and (:excludedReservationId is null or r.id <> :excludedReservationId)
          and r.startTime < :endTime
          and :startTime < r.endTime
        """,
    )
    fun sumPartySizeByOverlappingRange(
        @Param("productId") productId: Long,
        @Param("visitDate") visitDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime,
        @Param("statuses") statuses: Collection<ReservationStatus>,
        @Param("excludedReservationId") excludedReservationId: Long?,
    ): Long
}
