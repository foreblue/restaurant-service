package com.example.restaurant.reservationproduct

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface ReservationProductRepository : JpaRepository<ReservationProductEntity, Long> {
    fun findByRestaurantIdAndStatusOrderByCreatedAtDescIdDesc(
        restaurantId: Long,
        status: ReservationProductStatus,
    ): List<ReservationProductEntity>

    fun findByRestaurantIdAndStatusAndVisibleTrueOrderByCreatedAtAscIdAsc(
        restaurantId: Long,
        status: ReservationProductStatus,
    ): List<ReservationProductEntity>

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ReservationProductEntity p where p.id = :id")
    fun findByIdForUpdate(
        @Param("id") id: Long,
    ): ReservationProductEntity?
}
