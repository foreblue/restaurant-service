package com.example.restaurant.auth

import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface BusinessPasswordResetTokenRepository : JpaRepository<BusinessPasswordResetTokenEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select token from BusinessPasswordResetTokenEntity token where token.tokenHash = :tokenHash")
    fun findByTokenHashForUpdate(@Param("tokenHash") tokenHash: String): BusinessPasswordResetTokenEntity?

    fun findFirstByUserIdAndUsedAtIsNullOrderByRequestedAtDesc(userId: Long): BusinessPasswordResetTokenEntity?
}
