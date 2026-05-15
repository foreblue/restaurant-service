package com.example.restaurant.audit

import org.springframework.data.jpa.repository.JpaRepository

interface AuditLogRepository : JpaRepository<AuditLogEntity, Long> {
    fun findByTargetTypeAndTargetId(
        targetType: String,
        targetId: Long,
    ): List<AuditLogEntity>

    fun findByTargetTypeAndTargetIdOrderByCreatedAtAscIdAsc(
        targetType: String,
        targetId: Long,
    ): List<AuditLogEntity>
}
