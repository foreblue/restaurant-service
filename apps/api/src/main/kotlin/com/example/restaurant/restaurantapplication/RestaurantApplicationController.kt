package com.example.restaurant.restaurantapplication

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/restaurant-applications")
class RestaurantApplicationController(
    private val restaurantApplicationService: RestaurantApplicationService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: RestaurantApplicationSaveRequest,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.create(BusinessAuthContext.principal(servletRequest), request)

    @GetMapping("/current")
    fun current(servletRequest: HttpServletRequest): RestaurantApplicationResponse =
        restaurantApplicationService.current(BusinessAuthContext.principal(servletRequest))

    @PutMapping("/{applicationId}")
    fun update(
        servletRequest: HttpServletRequest,
        @PathVariable applicationId: Long,
        @Valid @RequestBody request: RestaurantApplicationSaveRequest,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.update(BusinessAuthContext.principal(servletRequest), applicationId, request)

    @PostMapping("/{applicationId}/submit")
    fun submit(
        servletRequest: HttpServletRequest,
        @PathVariable applicationId: Long,
    ): RestaurantApplicationResponse =
        restaurantApplicationService.submit(
            principal = BusinessAuthContext.principal(servletRequest),
            applicationId = applicationId,
            metadata = servletRequest.toMetadata(),
        )

    private fun HttpServletRequest.toMetadata(): BusinessRequestMetadata =
        BusinessRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
