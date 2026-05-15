package com.example.restaurant.reservationproduct

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/restaurants/{restaurantId}/reservation-products")
class PublicReservationProductController(
    private val reservationProductService: ReservationProductService,
) {
    @GetMapping
    fun list(
        @PathVariable restaurantId: Long,
    ): PublicReservationProductListResponse =
        reservationProductService.publicProducts(restaurantId)
}
