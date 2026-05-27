package com.example.restaurant.reservation

import com.example.restaurant.refund.RefundOperationResponse
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class PublicReservationCreateRequest(
    val restaurantId: Long? = null,
    val productId: Long? = null,
    val visitDate: String? = null,
    val startTime: String? = null,
    val partySize: Int? = null,
    val memberId: Long? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerRequest: String? = null,
    val customerEmail: String? = null,
    val allergyNote: String? = null,
    val anniversaryType: String? = null,
    val anniversaryDate: String? = null,
    val requestTemplateValues: List<String>? = null,
    val marketingOptIn: Boolean? = null,
    val idempotencyKey: String? = null,
)

data class PublicReservationCancelRequest(
    val reason: String? = null,
    val confirmRefundAmount: Long? = null,
)

data class PublicReservationResponse(
    val id: Long,
    val reservationNumber: String,
    val status: ReservationStatus,
    val restaurantId: Long,
    val productId: Long,
    val customerId: Long,
    val memberId: Long?,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val customerName: String,
    val customerPhoneLast4: String,
    val customerEmail: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val requestTemplateValues: List<String>,
    val marketingOptIn: Boolean,
    val lookupToken: String,
    val lookupTokenExpiresAt: Instant,
)

data class PublicReservationDetailResponse(
    val id: Long,
    val reservationNumber: String,
    val status: ReservationStatus,
    val restaurantId: Long,
    val restaurantName: String?,
    val productId: Long,
    val productName: String,
    val customerId: Long,
    val memberId: Long?,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val customerName: String,
    val customerPhoneLast4: String,
    val customerRequest: String?,
    val customerEmail: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val requestTemplateValues: List<String>,
    val marketingOptIn: Boolean,
    val cancelable: Boolean,
    val cancelDeadline: Instant,
    val cancelledAt: Instant?,
    val cancelReason: String?,
    val refund: RefundOperationResponse? = null,
)
