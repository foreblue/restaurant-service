package com.example.restaurant.statistics

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.http.HttpStatus

@RestController
@RequestMapping("/api/business/restaurants/{restaurantId}/analytics")
class BusinessAnalyticsController(
    private val businessAnalyticsService: BusinessAnalyticsService,
    private val businessAnalyticsExportService: BusinessAnalyticsExportService,
) {
    @GetMapping("/summary")
    fun summary(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
    ): BusinessAnalyticsSummaryResponse =
        businessAnalyticsService.summary(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            query = BusinessAnalyticsPeriodQuery(from = from, to = to),
        )

    @GetMapping("/time-slots")
    fun timeSlots(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @RequestParam(required = false) date: String?,
    ): BusinessAnalyticsTimeSlotResponse =
        businessAnalyticsService.timeSlots(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            query = BusinessAnalyticsTimeSlotQuery(date = date),
        )

    @GetMapping("/products")
    fun products(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
    ): BusinessAnalyticsProductResponse =
        businessAnalyticsService.products(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            query = BusinessAnalyticsPeriodQuery(from = from, to = to),
        )

    @PostMapping("/exports")
    @ResponseStatus(HttpStatus.CREATED)
    fun export(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @RequestBody request: BusinessAnalyticsExportRequest,
    ): BusinessAnalyticsExportResponse =
        businessAnalyticsExportService.create(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    private fun HttpServletRequest.toMetadata(): BusinessAnalyticsExportRequestMetadata =
        BusinessAnalyticsExportRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()?.takeIf { it.isNotBlank() }
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
