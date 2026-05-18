package com.example.restaurant.availability

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/time-slots")
class BusinessTimeSlotController(
    private val businessTimeSlotService: BusinessTimeSlotService,
) {
    @GetMapping
    fun list(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) productId: Long?,
        @RequestParam date: String,
        @RequestParam(required = false) seatType: String?,
    ): BusinessTimeSlotListResponse =
        businessTimeSlotService.list(
            principal = BusinessAuthContext.principal(servletRequest),
            productId = productId,
            dateValue = date,
            seatTypeValue = seatType,
        )

    @PostMapping
    fun generate(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: BusinessTimeSlotGenerateRequest,
    ): BusinessTimeSlotGenerationResponse =
        businessTimeSlotService.generate(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PostMapping("/close")
    fun close(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: BusinessTimeSlotStatusChangeRequest,
    ): BusinessTimeSlotResponse =
        businessTimeSlotService.close(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PostMapping("/reopen")
    fun reopen(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: BusinessTimeSlotStatusChangeRequest,
    ): BusinessTimeSlotResponse =
        businessTimeSlotService.reopen(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    private fun HttpServletRequest.toMetadata(): BusinessTimeSlotRequestMetadata =
        BusinessTimeSlotRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()?.takeIf { it.isNotBlank() }
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
