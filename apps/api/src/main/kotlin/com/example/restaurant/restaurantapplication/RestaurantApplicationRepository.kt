package com.example.restaurant.restaurantapplication

import org.springframework.data.jpa.repository.JpaRepository

interface RestaurantApplicationRepository : JpaRepository<RestaurantApplicationEntity, Long> {
    fun findTopByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): RestaurantApplicationEntity?

    fun existsByRestaurantIdAndStatus(
        restaurantId: Long,
        status: RestaurantApplicationStatus,
    ): Boolean
}
