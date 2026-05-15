package com.example.restaurant.availability

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class BusinessTimeSlotGenerateRequest(
    @field:Min(1)
    val productId: Long? = null,

    val from: String? = null,

    val to: String? = null,
)

data class BusinessTimeSlotStatusChangeRequest(
    @field:Min(1)
    val timeSlotId: Long? = null,

    @field:Min(1)
    val productId: Long? = null,

    val date: String? = null,

    val startTime: String? = null,

    @field:Size(max = 255)
    val reason: String? = null,
)

data class BusinessTimeSlotListResponse(
    val restaurantId: Long,
    val productId: Long,
    val date: LocalDate,
    val slots: List<BusinessTimeSlotResponse>,
)

data class BusinessTimeSlotGenerationResponse(
    val restaurantId: Long,
    val productId: Long,
    val from: LocalDate,
    val to: LocalDate,
    val createdCount: Int,
    val updatedCount: Int,
    val skippedCount: Int,
    val slots: List<BusinessTimeSlotResponse>,
)

data class BusinessTimeSlotResponse(
    val id: Long,
    val restaurantId: Long,
    val productId: Long,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val capacity: Int,
    val status: TimeSlotStatus,
    val available: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessTimeSlotRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
