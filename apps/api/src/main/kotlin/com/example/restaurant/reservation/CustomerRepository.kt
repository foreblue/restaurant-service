package com.example.restaurant.reservation

import org.springframework.data.jpa.repository.JpaRepository

interface CustomerRepository : JpaRepository<CustomerEntity, Long> {
    fun findByRestaurantIdAndId(
        restaurantId: Long,
        id: Long,
    ): CustomerEntity?

    fun findByRestaurantIdAndPhoneNumber(
        restaurantId: Long,
        phoneNumber: String,
    ): CustomerEntity?

    fun existsByRestaurantIdAndPhoneNumberAndIdNot(
        restaurantId: Long,
        phoneNumber: String,
        id: Long,
    ): Boolean

    fun findByRestaurantIdOrderByCreatedAtDescIdDesc(restaurantId: Long): List<CustomerEntity>

    fun countByRestaurantId(restaurantId: Long): Long
}
