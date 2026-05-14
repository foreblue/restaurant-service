package com.example.restaurant.auth

import org.springframework.data.jpa.repository.JpaRepository

interface ReservationLookupTokenRepository : JpaRepository<ReservationLookupTokenEntity, Long> {
    fun findByTokenHashAndRevokedAtIsNull(tokenHash: String): ReservationLookupTokenEntity?
}
