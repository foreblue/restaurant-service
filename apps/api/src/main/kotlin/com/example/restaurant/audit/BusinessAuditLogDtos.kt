package com.example.restaurant.audit

import java.time.Instant

data class BusinessAuditLogListResponse(
    val items: List<BusinessAuditLogResponse>,
)

data class BusinessAuditLogResponse(
    val id: Long,
    val actorUserId: Long?,
    val actorRole: String,
    val action: String,
    val targetType: String,
    val targetId: Long,
    val beforeValue: Map<String, Any?>?,
    val afterValue: Map<String, Any?>?,
    val ipAddress: String?,
    val userAgent: String?,
    val createdAt: Instant?,
)

data class BusinessAuditLogQuery(
    val targetType: String?,
    val targetId: Long?,
)
