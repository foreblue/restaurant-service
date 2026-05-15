package com.example.restaurant.reservation

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class PublicReservationCreateRequest(
    val restaurantId: Long? = null,
    val productId: Long? = null,
    val visitDate: String? = null,
    val startTime: String? = null,
    val partySize: Int? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerRequest: String? = null,
    val idempotencyKey: String? = null,
)

data class PublicReservationResponse(
    val id: Long,
    val reservationNumber: String,
    val status: ReservationStatus,
    val restaurantId: Long,
    val productId: Long,
    val customerId: Long,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val customerName: String,
    val customerPhoneLast4: String,
    val lookupToken: String,
    val lookupTokenExpiresAt: Instant,
)
