package com.example.restaurant.auth

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class ReservationLookupTokenRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val reservationNumber: String,

    @field:NotBlank
    @field:Size(max = 32)
    val phoneNumber: String,
)

data class ReservationLookupTokenResponse(
    val reservationId: Long,
    val lookupToken: String,
    val expiresAt: Instant,
)
