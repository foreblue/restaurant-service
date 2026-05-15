package com.example.restaurant.reservation

import com.example.restaurant.refund.RefundOperationResponse
import com.example.restaurant.payment.PaymentStatus
import com.example.restaurant.payment.PaymentType
import com.example.restaurant.refund.RefundStatus
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class BusinessReservationListResponse(
    val date: LocalDate?,
    val from: LocalDate,
    val to: LocalDate,
    val summary: BusinessReservationSummaryResponse,
    val items: List<BusinessReservationListItemResponse>,
)

data class BusinessReservationSummaryResponse(
    val totalReservations: Int,
    val totalPartySize: Int,
    val confirmedCount: Int,
    val modifiedCount: Int,
    val completedCount: Int,
    val cancelledCount: Int,
    val noShowCount: Int,
)

data class BusinessReservationListItemResponse(
    val id: Long,
    val reservationNumber: String,
    val status: ReservationStatus,
    val statusLabel: String,
    val statusTone: String,
    val source: String,
    val reservedStartAt: Instant,
    val reservedEndAt: Instant,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val productId: Long,
    val productName: String,
    val customer: BusinessReservationCustomerSummaryResponse,
    val hasCustomerRequest: Boolean,
    val hasOwnerNote: Boolean,
    val paymentStatus: String,
    val paymentActionRequired: Boolean,
)

data class BusinessReservationCustomerSummaryResponse(
    val id: Long,
    val name: String,
    val phoneMasked: String,
)

data class BusinessReservationCalendarResponse(
    val from: LocalDate,
    val to: LocalDate,
    val days: List<BusinessReservationCalendarDayResponse>,
)

data class BusinessReservationCalendarDayResponse(
    val date: LocalDate,
    @get:JsonProperty("isOpen")
    val isOpen: Boolean,
    val reservationCount: Int,
    val partySizeTotal: Int,
    val confirmedCount: Int,
    val modifiedCount: Int,
    val completedCount: Int,
    val cancelledCount: Int,
    val noShowCount: Int,
)

data class BusinessReservationDetailResponse(
    val id: Long,
    val reservationNumber: String,
    val status: ReservationStatus,
    val statusLabel: String,
    val statusTone: String,
    val source: String,
    val reservedStartAt: Instant,
    val reservedEndAt: Instant,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val partySize: Int,
    val product: BusinessReservationProductSummaryResponse,
    val customer: BusinessReservationCustomerDetailResponse,
    val customerRequest: String?,
    val ownerNote: String?,
    val paymentStatus: String,
    val paymentActionRequired: Boolean,
    val paymentSummary: BusinessReservationPaymentSummaryResponse,
    val cancelledAt: Instant?,
    val cancelReason: String?,
    val refund: RefundOperationResponse? = null,
    val completedAt: Instant?,
    val noShowAt: Instant?,
    val auditLogs: List<BusinessReservationAuditLogResponse>,
)

data class BusinessReservationProductSummaryResponse(
    val id: Long,
    val name: String,
)

data class BusinessReservationCustomerDetailResponse(
    val id: Long,
    val name: String,
    val phoneNumber: String,
    val visitCount: Long,
    val noShowCount: Long,
)

data class BusinessReservationPaymentSummaryResponse(
    val paymentRequired: Boolean,
    val paymentMode: ReservationPaymentMode,
    val reservationPaymentStatus: PaymentStatus,
    val paymentDueAt: Instant?,
    val latestPaymentId: Long?,
    val latestPaymentType: PaymentType?,
    val latestPaymentStatus: PaymentStatus?,
    val latestPaymentAmount: Long?,
    val refundedAmount: Long,
    val latestRefundId: Long?,
    val latestRefundStatus: RefundStatus?,
    val latestRefundAmount: Long?,
)

data class BusinessReservationAuditLogResponse(
    val id: Long,
    val action: String,
    val createdAt: Instant?,
)
