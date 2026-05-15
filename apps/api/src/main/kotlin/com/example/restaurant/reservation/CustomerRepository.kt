package com.example.restaurant.reservation

import org.springframework.data.jpa.repository.JpaRepository

interface CustomerRepository : JpaRepository<CustomerEntity, Long> {
    fun findByRestaurantIdAndPhoneNumber(
        restaurantId: Long,
        phoneNumber: String,
    ): CustomerEntity?

    fun countByRestaurantId(restaurantId: Long): Long
}
