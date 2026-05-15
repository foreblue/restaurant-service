package com.example.restaurant.customer

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class BusinessCustomerListResponse(
    val items: List<BusinessCustomerListItemResponse>,
    val totalCount: Int,
)

data class BusinessCustomerListItemResponse(
    val id: Long,
    val name: String,
    val phoneMasked: String,
    val email: String?,
    val allergyNote: String?,
    val preferenceNote: String?,
    val reservationCount: Long,
    val completedCount: Long,
    val noShowCount: Long,
    val vip: Boolean,
    val caution: Boolean,
    val blocked: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessCustomerDetailResponse(
    val id: Long,
    val name: String,
    val phoneNumber: String,
    val phoneMasked: String,
    val email: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val preferenceNote: String?,
    val internalNote: String?,
    val vip: Boolean,
    val caution: Boolean,
    val cautionReason: String?,
    val blocked: Boolean,
    val blockedReason: String?,
    val stats: BusinessCustomerStatsResponse,
    val notes: List<BusinessCustomerNoteResponse>,
    val recentReservations: List<BusinessCustomerReservationSummaryResponse>,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessCustomerStatsResponse(
    val reservationCount: Long,
    val completedCount: Long,
    val cancelledCount: Long,
    val noShowCount: Long,
)

data class BusinessCustomerReservationsResponse(
    val customer: BusinessCustomerHistoryCustomerResponse,
    val stats: BusinessCustomerStatsResponse,
    val items: List<BusinessCustomerReservationSummaryResponse>,
)

data class BusinessCustomerHistoryCustomerResponse(
    val id: Long,
    val name: String,
    val phoneMasked: String,
    val email: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val preferenceNote: String?,
    val vip: Boolean,
    val caution: Boolean,
    val cautionReason: String?,
    val blocked: Boolean,
    val blockedReason: String?,
)

data class BusinessCustomerReservationSummaryResponse(
    val id: Long,
    val reservationNumber: String,
    val productId: Long,
    val productName: String,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val status: String,
    val source: String,
    val customerRequest: String?,
    val completedAt: Instant?,
    val noShowAt: Instant?,
    val cancelledAt: Instant?,
    val cancelReason: String?,
)

data class BusinessCustomerSaveRequest(
    val name: String? = null,
    val phoneNumber: String? = null,
    val email: String? = null,
    val allergyNote: String? = null,
    val anniversaryType: String? = null,
    val anniversaryDate: String? = null,
    val preferenceNote: String? = null,
    val internalNote: String? = null,
)

data class BusinessCustomerFlagUpdateRequest(
    val vip: Boolean? = null,
    val caution: Boolean? = null,
    val cautionReason: String? = null,
    val blocked: Boolean? = null,
    val blockedReason: String? = null,
)

data class BusinessCustomerFlagsResponse(
    val customerId: Long,
    val vip: Boolean,
    val caution: Boolean,
    val cautionReason: String?,
    val blocked: Boolean,
    val blockedReason: String?,
    val updatedAt: Instant?,
)

data class BusinessCustomerNoteSaveRequest(
    val noteType: CustomerNoteType? = null,
    val content: String? = null,
)

data class BusinessCustomerNoteResponse(
    val id: Long,
    val customerId: Long,
    val noteType: CustomerNoteType,
    val visibility: CustomerNoteVisibility,
    val content: String,
    val authorUserId: Long,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessCustomerRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
