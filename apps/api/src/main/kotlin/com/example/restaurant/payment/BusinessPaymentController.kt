package com.example.restaurant.payment

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business")
class BusinessPaymentController(
    private val businessPaymentService: BusinessPaymentService,
) {
    @GetMapping("/payments")
    fun payments(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) query: String?,
        @RequestParam(required = false) limit: Int?,
    ): BusinessPaymentListResponse =
        businessPaymentService.payments(
            principal = BusinessAuthContext.principal(servletRequest),
            query = BusinessPaymentListQuery(
                status = status,
                from = from,
                to = to,
                query = query,
                limit = limit,
            ),
        )

    @GetMapping("/refunds")
    fun refunds(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) query: String?,
        @RequestParam(required = false) limit: Int?,
    ): BusinessRefundListResponse =
        businessPaymentService.refunds(
            principal = BusinessAuthContext.principal(servletRequest),
            query = BusinessRefundListQuery(
                status = status,
                from = from,
                to = to,
                query = query,
                limit = limit,
            ),
        )
}
