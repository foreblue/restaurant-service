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
    val totalCount: Int,
    val items: List<BusinessPaymentListItemResponse>,
)

data class BusinessPaymentListItemResponse(
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
    val paymentType: PaymentType,
    val status: PaymentStatus,
    val amount: Long,
    val refundedAmount: Long,
    val currency: String,
    val pgProviderKey: String?,
    val pgPaymentId: String?,
    val failureCode: String?,
    val failureMessage: String?,
    val paidAt: Instant?,
    val expiresAt: Instant?,
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
    val totalCount: Int,
    val items: List<BusinessRefundListItemResponse>,
)

data class BusinessRefundListItemResponse(
    val refundId: Long,
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
    val createdAt: Instant?,
    val updatedAt: Instant?,
)
