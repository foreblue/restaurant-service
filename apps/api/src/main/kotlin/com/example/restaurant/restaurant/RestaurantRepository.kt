package com.example.restaurant.restaurant

import org.springframework.data.jpa.repository.JpaRepository

interface RestaurantRepository : JpaRepository<RestaurantEntity, Long> {
    fun findByOwnerId(ownerId: Long): RestaurantEntity?

    fun findBySlug(slug: String): RestaurantEntity?

    fun findAllByOrderByIdAsc(): List<RestaurantEntity>
}
