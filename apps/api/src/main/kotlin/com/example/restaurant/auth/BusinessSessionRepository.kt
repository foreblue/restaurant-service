package com.example.restaurant.auth

import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface BusinessSessionRepository : JpaRepository<BusinessSessionEntity, Long> {
    fun findByTokenHashAndRevokedAtIsNull(tokenHash: String): BusinessSessionEntity?

    @Modifying
    @Query(
        """
        update BusinessSessionEntity session
           set session.revokedAt = :revokedAt
         where session.user.id = :userId
           and session.revokedAt is null
        """,
    )
    fun revokeActiveSessionsForUser(
        @Param("userId") userId: Long,
        @Param("revokedAt") revokedAt: Instant,
    ): Int
}
