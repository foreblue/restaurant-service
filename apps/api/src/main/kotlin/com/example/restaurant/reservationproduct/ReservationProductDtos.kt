package com.example.restaurant.reservationproduct

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalTime

data class ReservationProductSaveRequest(
    @field:Size(max = 80)
    val name: String? = null,

    @field:Size(max = 500)
    val description: String? = null,

    @field:Min(0)
    val priceAmount: Long? = null,

    val visible: Boolean? = null,

    @field:Min(1)
    val minPartySize: Int? = null,

    @field:Min(1)
    val maxPartySize: Int? = null,

    val availableDays: List<String>? = null,

    val availableStartTime: String? = null,

    val availableEndTime: String? = null,

    @field:Min(1)
    val slotCapacity: Int? = null,
)

data class ReservationProductResponse(
    val id: Long,
    val restaurantId: Long,
    val name: String,
    val description: String?,
    val priceAmount: Long,
    val visible: Boolean,
    val status: ReservationProductStatus,
    val minPartySize: Int,
    val maxPartySize: Int,
    val availableDays: List<DayOfWeek>,
    val availableStartTime: LocalTime?,
    val availableEndTime: LocalTime?,
    val slotCapacity: Int,
    val paymentPolicyType: ReservationProductPaymentPolicyType,
    val paymentAmount: Long?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class PublicReservationProductListResponse(
    val products: List<PublicReservationProductResponse>,
)

data class PublicReservationProductResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val displayPrice: Long,
    val minPartySize: Int,
    val maxPartySize: Int,
    val availableDays: List<DayOfWeek>,
    val availableStartTime: LocalTime?,
    val availableEndTime: LocalTime?,
    val requiresPayment: Boolean,
    val depositAmount: Long,
)

data class ReservationProductRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
