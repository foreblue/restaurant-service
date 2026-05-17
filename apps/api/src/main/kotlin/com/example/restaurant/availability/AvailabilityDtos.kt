package com.example.restaurant.availability

import java.time.LocalDate
import java.time.LocalTime

data class AvailabilityDatesResponse(
    val restaurantId: Long,
    val productId: Long,
    val from: LocalDate,
    val to: LocalDate,
    val dates: List<AvailableDateResponse>,
)

data class AvailableDateResponse(
    val date: LocalDate,
    val available: Boolean = true,
)

data class AvailabilityTimesResponse(
    val restaurantId: Long,
    val productId: Long,
    val date: LocalDate,
    val times: List<AvailableTimeSlotResponse>,
)

data class AvailableTimeSlotResponse(
    val timeSlotId: String,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val remainingCapacity: Int,
    val available: Boolean = true,
    val unavailableReason: String? = null,
)
