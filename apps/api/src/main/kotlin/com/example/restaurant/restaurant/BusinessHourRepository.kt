package com.example.restaurant.restaurant

import org.springframework.data.jpa.repository.JpaRepository

interface BusinessHourRepository : JpaRepository<BusinessHourEntity, Long> {
    fun findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurantId: Long): List<BusinessHourEntity>

    fun existsByRestaurantId(restaurantId: Long): Boolean

    fun deleteByRestaurantId(restaurantId: Long)
}
