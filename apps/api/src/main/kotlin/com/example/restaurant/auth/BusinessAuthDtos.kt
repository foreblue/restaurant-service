package com.example.restaurant.auth

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class BusinessLoginRequest(
    @field:Email
    @field:NotBlank
    val email: String,

    @field:NotBlank
    val password: String,
)

data class BusinessLoginResponse(
    val user: BusinessMeResponse,
)

data class PasswordResetRequestRequest(
    @field:Email
    @field:NotBlank
    val email: String,
)

data class PasswordResetRequestResponse(
    val accepted: Boolean,
    val resetToken: String? = null,
    val expiresAt: Instant? = null,
)

data class PasswordResetConfirmationRequest(
    @field:NotBlank
    val token: String,

    @field:NotBlank
    @field:Size(min = 8, max = 100)
    val newPassword: String,
)

data class PasswordResetConfirmationResponse(
    val passwordChanged: Boolean,
)

data class BusinessMeResponse(
    val id: Long,
    val email: String,
    val displayName: String,
    val role: String,
    val status: String,
    val restaurant: LinkedRestaurantResponse,
)

data class LinkedRestaurantResponse(
    val id: Long?,
    val status: String,
)
