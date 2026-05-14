package com.example.restaurant.auth

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

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
