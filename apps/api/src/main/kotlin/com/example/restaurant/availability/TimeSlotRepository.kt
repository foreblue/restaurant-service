package com.example.restaurant.availability

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.time.LocalTime

interface TimeSlotRepository : JpaRepository<TimeSlotEntity, Long> {
    fun findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
        reservationProductId: Long,
        slotDate: LocalDate,
    ): List<TimeSlotEntity>

    fun findByRestaurantIdAndReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
        restaurantId: Long,
        reservationProductId: Long,
        slotDate: LocalDate,
    ): List<TimeSlotEntity>

    fun findByRestaurantIdAndReservationProductIdAndSlotDateBetweenOrderBySlotDateAscStartTimeAscIdAsc(
        restaurantId: Long,
        reservationProductId: Long,
        from: LocalDate,
        to: LocalDate,
    ): List<TimeSlotEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select slot from TimeSlotEntity slot
        join fetch slot.restaurant
        join fetch slot.reservationProduct
        where slot.id = :slotId
        """,
    )
    fun findByIdForUpdate(
        @Param("slotId") slotId: Long,
    ): TimeSlotEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select slot from TimeSlotEntity slot
        join fetch slot.restaurant
        join fetch slot.reservationProduct
        where slot.restaurant.id = :restaurantId
          and slot.reservationProduct.id = :productId
          and slot.slotDate = :slotDate
          and slot.startTime = :startTime
        """,
    )
    fun findOwnedSlotForUpdate(
        @Param("restaurantId") restaurantId: Long,
        @Param("productId") productId: Long,
        @Param("slotDate") slotDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
    ): TimeSlotEntity?
}
