package com.example.restaurant.common.api

data class ApiErrorResponse(
    val code: String,
    val message: String,
    val traceId: String,
)
