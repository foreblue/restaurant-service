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
}
