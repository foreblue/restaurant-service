package com.example.restaurant.refund

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/refunds")
class AdminRefundController(
    private val refundService: RefundService,
) {
    @PostMapping("/{refundId}/retry")
    fun retry(
        servletRequest: HttpServletRequest,
        @PathVariable refundId: Long,
    ): RefundOperationResponse =
        refundService.retryFailedRefund(
            refundId = refundId,
            principal = BusinessAuthContext.principal(servletRequest),
            metadata = servletRequest.toRefundMetadata(),
        )

    @PostMapping("/{refundId}/mark-manual-resolved")
    fun markManualResolved(
        servletRequest: HttpServletRequest,
        @PathVariable refundId: Long,
        @RequestBody(required = false) request: AdminRefundManualResolveRequest?,
    ): RefundOperationResponse =
        refundService.markManualResolved(
            refundId = refundId,
            request = request,
            principal = BusinessAuthContext.principal(servletRequest),
            metadata = servletRequest.toRefundMetadata(),
        )

    private fun HttpServletRequest.toRefundMetadata(): RefundRequestMetadata =
        RefundRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
