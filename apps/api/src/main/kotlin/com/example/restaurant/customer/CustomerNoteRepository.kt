package com.example.restaurant.customer

import com.example.restaurant.reservation.CustomerEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface CustomerNoteRepository : JpaRepository<CustomerNoteEntity, Long> {
    fun findByCustomerIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(customerId: Long): List<CustomerNoteEntity>

    fun findByRestaurantIdAndCustomerIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(
        restaurantId: Long,
        customerId: Long,
    ): List<CustomerNoteEntity>

    fun countByCustomerIdAndDeletedAtIsNull(customerId: Long): Long

    @Modifying
    @Query(
        """
        update CustomerNoteEntity n
        set n.customer = :targetCustomer
        where n.restaurant.id = :restaurantId
          and n.customer.id = :sourceCustomerId
        """,
    )
    fun reassignCustomer(
        @Param("restaurantId") restaurantId: Long,
        @Param("sourceCustomerId") sourceCustomerId: Long,
        @Param("targetCustomer") targetCustomer: CustomerEntity,
    ): Int

    fun findByRestaurantIdAndIdAndDeletedAtIsNull(
        restaurantId: Long,
        id: Long,
    ): CustomerNoteEntity?
}
