package com.example.restaurant.payment

import com.example.restaurant.refund.RefundReason
import com.example.restaurant.refund.RefundRequesterRole
import com.example.restaurant.refund.RefundStatus
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class BusinessPaymentListQuery(
    val status: String?,
    val from: String?,
    val to: String?,
    val query: String?,
    val limit: Int?,
)

data class BusinessPaymentListResponse(
    val summary: BusinessPaymentListSummaryResponse,
    val totalCount: Int,
    val items: List<BusinessPaymentListItemResponse>,
)

data class BusinessPaymentListSummaryResponse(
    val totalCount: Int,
    val paidAmount: Long,
    val cardGuaranteeCount: Int,
    val actionRequiredCount: Int,
)

data class BusinessPaymentListItemResponse(
    val id: Long,
    val paymentId: Long,
    val paymentNumber: String,
    val reservationId: Long,
    val reservationNumber: String,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val productId: Long,
    val productName: String,
    val customerId: Long,
    val customerName: String,
    val customerPhoneMasked: String,
    val paymentType: PaymentType,
    val status: PaymentStatus,
    val statusLabel: String,
    val statusTone: String,
    val amount: Long,
    val refundedAmount: Long,
    val currency: String,
    val pgProviderKey: String?,
    val pgPaymentId: String?,
    val failureCode: String?,
    val failureMessage: String?,
    val paidAt: Instant?,
    val expiresAt: Instant?,
    val dueAt: Instant?,
    val cardGuaranteeHeld: Boolean,
    val actionRequired: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class BusinessRefundListQuery(
    val status: String?,
    val from: String?,
    val to: String?,
    val query: String?,
    val limit: Int?,
)

data class BusinessRefundListResponse(
    val summary: BusinessRefundListSummaryResponse,
    val totalCount: Int,
    val items: List<BusinessRefundListItemResponse>,
)

data class BusinessRefundListSummaryResponse(
    val totalCount: Int,
    val refundAmount: Long,
    val failedCount: Int,
    val actionRequiredCount: Int,
)

data class BusinessRefundListItemResponse(
    val id: Long,
    val refundId: Long,
    val refundNumber: String,
    val paymentId: Long,
    val reservationId: Long,
    val reservationNumber: String,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val productId: Long,
    val productName: String,
    val customerId: Long,
    val customerName: String,
    val customerPhoneMasked: String,
    val status: RefundStatus,
    val statusLabel: String,
    val statusTone: String,
    val refundAmount: Long,
    val nonRefundableAmount: Long,
    val currency: String,
    val reason: RefundReason,
    val requestedByRole: RefundRequesterRole,
    val pgRefundId: String?,
    val failureCode: String?,
    val failureMessage: String?,
    val requestedAt: Instant?,
    val succeededAt: Instant?,
    val completedAt: Instant?,
    val actionRequired: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)
