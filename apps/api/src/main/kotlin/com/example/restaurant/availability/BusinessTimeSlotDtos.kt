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

    val seatType: String? = null,

    @field:Size(max = 255)
    val reason: String? = null,
)

data class BusinessTimeSlotListResponse(
    val restaurantId: Long,
    val productId: Long?,
    val date: LocalDate,
    val summary: BusinessTimeSlotSummaryResponse,
    val items: List<BusinessTimeSlotResponse>,
    val slots: List<BusinessTimeSlotResponse>,
)

data class BusinessTimeSlotSummaryResponse(
    val totalCount: Int,
    val availableCount: Int,
    val closedCount: Int,
    val tempClosedCount: Int,
    val duplicateGuardedCount: Int,
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
    val id: String,
    val timeSlotId: Long,
    val restaurantId: Long,
    val productId: Long,
    val productName: String,
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val seatType: String,
    val seatTypeLabel: String,
    val capacity: Int,
    val reservedCount: Int,
    val availableCount: Int,
    val status: String,
    val rawStatus: TimeSlotStatus,
    val statusLabel: String,
    val statusTone: String,
    val available: Boolean,
    val duplicateGuarded: Boolean,
    val customerAvailabilityAffected: Boolean,
    val lastUpdatedAt: Instant?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessTimeSlotRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
