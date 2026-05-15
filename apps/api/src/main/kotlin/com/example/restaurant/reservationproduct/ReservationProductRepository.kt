package com.example.restaurant.reservationproduct

import org.springframework.data.jpa.repository.JpaRepository

interface ReservationProductRepository : JpaRepository<ReservationProductEntity, Long> {
    fun findByRestaurantIdAndStatusOrderByCreatedAtDescIdDesc(
        restaurantId: Long,
        status: ReservationProductStatus,
    ): List<ReservationProductEntity>

    fun findByRestaurantIdAndStatusAndVisibleTrueOrderByCreatedAtAscIdAsc(
        restaurantId: Long,
        status: ReservationProductStatus,
    ): List<ReservationProductEntity>
}
