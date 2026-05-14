package com.example.restaurant.audit

import com.example.restaurant.auth.BusinessUserEntity
import org.springframework.stereotype.Service

@Service
class AuditLogService(
    private val auditLogRepository: AuditLogRepository,
) {
    fun record(
        actorUser: BusinessUserEntity?,
        actorRole: String,
        action: String,
        targetType: String,
        targetId: Long,
        beforeValue: String? = null,
        afterValue: String? = null,
        ipAddress: String? = null,
        userAgent: String? = null,
    ): AuditLogEntity =
        auditLogRepository.save(
            AuditLogEntity(
                actorUser = actorUser,
                actorRole = actorRole,
                action = action,
                targetType = targetType,
                targetId = targetId,
                beforeValue = beforeValue,
                afterValue = afterValue,
                ipAddress = ipAddress,
                userAgent = userAgent,
            ),
        )
}
