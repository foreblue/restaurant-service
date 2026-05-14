package com.example.restaurant.restaurant

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/restaurants")
class PublicRestaurantController(
    private val restaurantSettingsService: RestaurantSettingsService,
) {
    @GetMapping("/{slug}")
    fun publicRestaurant(
        @PathVariable slug: String,
    ): PublicRestaurantResponse =
        restaurantSettingsService.publicRestaurant(slug)
}
