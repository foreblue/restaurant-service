package com.example.restaurant.reservation

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/reservations")
class BusinessReservationController(
    private val businessReservationService: BusinessReservationService,
) {
    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    fun createManual(
        servletRequest: HttpServletRequest,
        @RequestBody request: BusinessManualReservationCreateRequest,
    ): BusinessReservationDetailResponse =
        businessReservationService.createManual(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @GetMapping
    fun list(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) date: String?,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) productId: Long?,
        @RequestParam(required = false) startTime: String?,
        @RequestParam(required = false) endTime: String?,
        @RequestParam(required = false) query: String?,
        @RequestParam(required = false) includeCancelled: Boolean?,
    ): BusinessReservationListResponse =
        businessReservationService.list(
            principal = BusinessAuthContext.principal(servletRequest),
            query = BusinessReservationListQuery(
                date = date,
                from = from,
                to = to,
                status = status,
                productId = productId,
                startTime = startTime,
                endTime = endTime,
                query = query,
                includeCancelled = includeCancelled,
            ),
        )

    @GetMapping("/calendar")
    fun calendar(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) productId: Long?,
        @RequestParam(required = false) startTime: String?,
        @RequestParam(required = false) endTime: String?,
    ): BusinessReservationCalendarResponse =
        businessReservationService.calendar(
            principal = BusinessAuthContext.principal(servletRequest),
            query = BusinessReservationCalendarQuery(
                from = from,
                to = to,
                status = status,
                productId = productId,
                startTime = startTime,
                endTime = endTime,
            ),
        )

    @GetMapping("/{reservationId}")
    fun detail(
        servletRequest: HttpServletRequest,
        @PathVariable reservationId: Long,
    ): BusinessReservationDetailResponse =
        businessReservationService.detail(
            principal = BusinessAuthContext.principal(servletRequest),
            reservationId = reservationId,
        )

    private fun HttpServletRequest.toMetadata(): BusinessReservationRequestMetadata =
        BusinessReservationRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
