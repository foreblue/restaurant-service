package com.example.restaurant.audit

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/audit-logs")
class BusinessAuditLogController(
    private val businessAuditLogService: BusinessAuditLogService,
) {
    @GetMapping
    fun list(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) targetType: String?,
        @RequestParam(required = false) targetId: Long?,
    ): BusinessAuditLogListResponse =
        businessAuditLogService.list(
            principal = BusinessAuthContext.principal(servletRequest),
            query = BusinessAuditLogQuery(
                targetType = targetType,
                targetId = targetId,
            ),
        )
}
