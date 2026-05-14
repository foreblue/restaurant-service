package com.example.restaurant.auth

import org.springframework.data.jpa.repository.JpaRepository

interface BusinessSessionRepository : JpaRepository<BusinessSessionEntity, Long> {
    fun findByTokenHashAndRevokedAtIsNull(tokenHash: String): BusinessSessionEntity?
}
