package com.example.restaurant.restaurantapplication

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/restaurant-applications")
class AdminRestaurantApplicationController(
    private val restaurantApplicationService: RestaurantApplicationService,
) {
    @GetMapping
    fun list(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) status: RestaurantApplicationStatus?,
    ): List<RestaurantApplicationResponse> =
        restaurantApplicationService.listForAdmin(BusinessAuthContext.principal(servletRequest), status)

    @GetMapping("/{applicationId}")
    fun detail(
        servletRequest: HttpServletRequest,
        @PathVariable applicationId: Long,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.getForAdmin(BusinessAuthContext.principal(servletRequest), applicationId)

    @PostMapping("/{applicationId}/approve")
    fun approve(
        servletRequest: HttpServletRequest,
        @PathVariable applicationId: Long,
        @Valid @RequestBody request: RestaurantApplicationReviewRequest,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.approveForAdmin(
            principal = BusinessAuthContext.principal(servletRequest),
            applicationId = applicationId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PostMapping("/{applicationId}/reject")
    fun reject(
        servletRequest: HttpServletRequest,
        @PathVariable applicationId: Long,
        @Valid @RequestBody request: RestaurantApplicationRejectRequest,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.rejectForAdmin(
            principal = BusinessAuthContext.principal(servletRequest),
            applicationId = applicationId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    private fun HttpServletRequest.toMetadata(): BusinessRequestMetadata =
        BusinessRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
