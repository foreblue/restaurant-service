package com.example.restaurant.customer

import org.springframework.data.jpa.repository.JpaRepository

interface CustomerNoteRepository : JpaRepository<CustomerNoteEntity, Long> {
    fun findByCustomerIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(customerId: Long): List<CustomerNoteEntity>

    fun findByRestaurantIdAndIdAndDeletedAtIsNull(
        restaurantId: Long,
        id: Long,
    ): CustomerNoteEntity?
}
