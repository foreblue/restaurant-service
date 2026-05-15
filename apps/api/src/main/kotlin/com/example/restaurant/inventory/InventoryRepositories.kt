package com.example.restaurant.inventory

import org.springframework.data.jpa.repository.JpaRepository

interface RestaurantTableRepository : JpaRepository<RestaurantTableEntity, Long> {
    fun findByRestaurantIdOrderBySortOrderAscIdAsc(restaurantId: Long): List<RestaurantTableEntity>

    fun findByRestaurantIdAndIdIn(
        restaurantId: Long,
        ids: Collection<Long>,
    ): List<RestaurantTableEntity>
}

interface TableCombinationRepository : JpaRepository<TableCombinationEntity, Long> {
    fun findByRestaurantIdOrderByIdAsc(restaurantId: Long): List<TableCombinationEntity>
}

interface ReservationProductSeatRuleRepository : JpaRepository<ReservationProductSeatRuleEntity, Long> {
    fun findByReservationProductId(reservationProductId: Long): ReservationProductSeatRuleEntity?
}
