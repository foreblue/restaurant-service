package com.example.restaurant.restaurant

import org.springframework.data.jpa.repository.JpaRepository

interface HolidayRuleRepository : JpaRepository<HolidayRuleEntity, Long> {
    fun findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(restaurantId: Long): List<HolidayRuleEntity>

    fun deleteByRestaurantId(restaurantId: Long)
}
