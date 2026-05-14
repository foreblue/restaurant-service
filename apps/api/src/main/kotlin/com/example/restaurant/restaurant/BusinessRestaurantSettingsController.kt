package com.example.restaurant.restaurant

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/restaurants")
class BusinessRestaurantSettingsController(
    private val restaurantSettingsService: RestaurantSettingsService,
) {
    @GetMapping("/current")
    fun current(servletRequest: HttpServletRequest): RestaurantSettingsResponse =
        restaurantSettingsService.current(BusinessAuthContext.principal(servletRequest))

    @PutMapping("/{restaurantId}")
    fun updateRestaurant(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @Valid @RequestBody request: RestaurantUpdateRequest,
    ): RestaurantSettingsResponse =
        restaurantSettingsService.updateRestaurant(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/{restaurantId}/business-hours")
    fun saveBusinessHours(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @Valid @RequestBody request: BusinessHoursSaveRequest,
    ): List<BusinessHourResponse> =
        restaurantSettingsService.saveBusinessHours(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/{restaurantId}/holiday-rules")
    fun saveHolidayRules(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @Valid @RequestBody request: HolidayRulesSaveRequest,
    ): List<HolidayRuleResponse> =
        restaurantSettingsService.saveHolidayRules(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/{restaurantId}/reservation-page")
    fun updateReservationPage(
        servletRequest: HttpServletRequest,
        @PathVariable restaurantId: Long,
        @Valid @RequestBody request: ReservationPageSaveRequest,
    ): ReservationPageSettingsResponse =
        restaurantSettingsService.updateReservationPage(
            principal = BusinessAuthContext.principal(servletRequest),
            restaurantId = restaurantId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    private fun HttpServletRequest.toMetadata(): RestaurantSettingsRequestMetadata =
        RestaurantSettingsRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
