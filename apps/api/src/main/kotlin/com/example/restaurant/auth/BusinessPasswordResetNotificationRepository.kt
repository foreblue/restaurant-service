package com.example.restaurant.auth

import org.springframework.data.jpa.repository.JpaRepository

interface BusinessPasswordResetNotificationRepository : JpaRepository<BusinessPasswordResetNotificationEntity, Long> {
    fun findByResetTokenId(resetTokenId: Long): List<BusinessPasswordResetNotificationEntity>
}
