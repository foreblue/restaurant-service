package com.example.restaurant.restaurant

import org.springframework.data.jpa.repository.JpaRepository

interface ReservationPageRepository : JpaRepository<ReservationPageEntity, Long> {
    fun findByRestaurantId(restaurantId: Long): ReservationPageEntity?

    fun findBySlug(slug: String): ReservationPageEntity?
}
