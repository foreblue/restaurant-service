package com.example.restaurant.availability

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/restaurants/{restaurantId}/availability")
class PublicAvailabilityController(
    private val availabilityService: AvailabilityService,
) {
    @GetMapping("/dates")
    fun availableDates(
        @PathVariable restaurantId: Long,
        @RequestParam productId: Long,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
        @RequestParam(required = false) partySize: Int?,
    ): AvailabilityDatesResponse =
        availabilityService.availableDates(
            restaurantId = restaurantId,
            productId = productId,
            fromValue = from,
            toValue = to,
            partySizeValue = partySize,
        )

    @GetMapping("/times")
    fun availableTimes(
        @PathVariable restaurantId: Long,
        @RequestParam productId: Long,
        @RequestParam date: String,
        @RequestParam(required = false) partySize: Int?,
    ): AvailabilityTimesResponse =
        availabilityService.availableTimes(
            restaurantId = restaurantId,
            productId = productId,
            dateValue = date,
            partySizeValue = partySize,
        )
}
