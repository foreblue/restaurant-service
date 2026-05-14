package com.example.restaurant.auth

data class BusinessPrincipal(
    val userId: Long,
    val email: String,
    val displayName: String,
    val role: BusinessUserRole,
)
