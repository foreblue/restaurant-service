package com.example.restaurant.reservation

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CustomerEntity c where c.restaurant.id = :restaurantId and c.id = :id")
    fun findByRestaurantIdAndIdForUpdate(
        @Param("restaurantId") restaurantId: Long,
        @Param("id") id: Long,
    ): CustomerEntity?

    fun countByRestaurantId(restaurantId: Long): Long
}
