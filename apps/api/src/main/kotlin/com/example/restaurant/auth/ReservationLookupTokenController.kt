package com.example.restaurant.auth

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/reservation-lookup-tokens")
class ReservationLookupTokenController(
    private val tokenService: ReservationLookupTokenService,
) {
    @PostMapping
    fun issueToken(
        @Valid @RequestBody request: ReservationLookupTokenRequest,
    ): ReservationLookupTokenResponse = tokenService.issueToken(request)
}
