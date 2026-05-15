package com.example.restaurant.payment

import org.springframework.data.jpa.repository.JpaRepository

interface CancellationPolicyRepository : JpaRepository<CancellationPolicyEntity, Long> {
    fun findByReservationProductIdAndActiveOrderByEffectiveFromDesc(
        reservationProductId: Long,
        active: Boolean,
    ): List<CancellationPolicyEntity>

    fun findByRestaurantIdAndActiveOrderByEffectiveFromDesc(
        restaurantId: Long,
        active: Boolean,
    ): List<CancellationPolicyEntity>
}
