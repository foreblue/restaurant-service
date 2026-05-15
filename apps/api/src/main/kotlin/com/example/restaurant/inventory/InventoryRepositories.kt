package com.example.restaurant.inventory

import com.example.restaurant.reservation.ReservationStatus
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.time.LocalTime

interface RestaurantTableRepository : JpaRepository<RestaurantTableEntity, Long> {
    fun findByRestaurantIdOrderBySortOrderAscIdAsc(restaurantId: Long): List<RestaurantTableEntity>

    fun findByRestaurantIdAndIdIn(
        restaurantId: Long,
        ids: Collection<Long>,
    ): List<RestaurantTableEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select table from RestaurantTableEntity table
        where table.restaurant.id = :restaurantId
          and table.id in :ids
        order by table.id asc
        """,
    )
    fun findByRestaurantIdAndIdInForUpdate(
        @Param("restaurantId") restaurantId: Long,
        @Param("ids") ids: Collection<Long>,
    ): List<RestaurantTableEntity>
}

interface TableCombinationRepository : JpaRepository<TableCombinationEntity, Long> {
    fun findByRestaurantIdOrderByIdAsc(restaurantId: Long): List<TableCombinationEntity>
}

interface ReservationProductSeatRuleRepository : JpaRepository<ReservationProductSeatRuleEntity, Long> {
    fun findByReservationProductId(reservationProductId: Long): ReservationProductSeatRuleEntity?
}

interface ReservationTableAssignmentRepository : JpaRepository<ReservationTableAssignmentEntity, Long> {
    fun findByReservationIdOrderByRestaurantTableIdAsc(reservationId: Long): List<ReservationTableAssignmentEntity>

    fun deleteByReservationId(reservationId: Long)

    @Query(
        """
        select assignment from ReservationTableAssignmentEntity assignment
        join fetch assignment.reservation reservation
        join fetch assignment.restaurantTable table
        where assignment.restaurant.id = :restaurantId
          and table.id in :tableIds
          and reservation.visitDate = :visitDate
          and reservation.status in :statuses
          and (:excludedReservationId is null or reservation.id <> :excludedReservationId)
          and reservation.startTime < :endTime
          and :startTime < reservation.endTime
        """,
    )
    fun findOverlappingAssignments(
        @Param("restaurantId") restaurantId: Long,
        @Param("tableIds") tableIds: Collection<Long>,
        @Param("visitDate") visitDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime,
        @Param("statuses") statuses: Collection<ReservationStatus>,
        @Param("excludedReservationId") excludedReservationId: Long?,
    ): List<ReservationTableAssignmentEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select assignment from ReservationTableAssignmentEntity assignment
        join fetch assignment.reservation reservation
        join fetch assignment.restaurantTable table
        where assignment.restaurant.id = :restaurantId
          and table.id in :tableIds
          and reservation.visitDate = :visitDate
          and reservation.status in :statuses
          and (:excludedReservationId is null or reservation.id <> :excludedReservationId)
          and reservation.startTime < :endTime
          and :startTime < reservation.endTime
        """,
    )
    fun findOverlappingAssignmentsForUpdate(
        @Param("restaurantId") restaurantId: Long,
        @Param("tableIds") tableIds: Collection<Long>,
        @Param("visitDate") visitDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime,
        @Param("statuses") statuses: Collection<ReservationStatus>,
        @Param("excludedReservationId") excludedReservationId: Long?,
    ): List<ReservationTableAssignmentEntity>
}
