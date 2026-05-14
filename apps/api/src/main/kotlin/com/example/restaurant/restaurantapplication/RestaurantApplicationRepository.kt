package com.example.restaurant.restaurantapplication

import org.springframework.data.jpa.repository.JpaRepository

interface RestaurantApplicationRepository : JpaRepository<RestaurantApplicationEntity, Long> {
    fun findAllByOrderBySubmittedAtDescIdDesc(): List<RestaurantApplicationEntity>

    fun findByStatusOrderBySubmittedAtDescIdDesc(status: RestaurantApplicationStatus): List<RestaurantApplicationEntity>

    fun findTopByRestaurantIdOrderByCreatedAtDesc(restaurantId: Long): RestaurantApplicationEntity?

    fun existsByRestaurantIdAndStatus(
        restaurantId: Long,
        status: RestaurantApplicationStatus,
    ): Boolean

    fun existsByBusinessRegistrationNoAndStatus(
        businessRegistrationNo: String,
        status: RestaurantApplicationStatus,
    ): Boolean
}
