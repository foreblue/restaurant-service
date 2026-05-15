package com.example.restaurant.refund

import com.example.restaurant.payment.PaymentStatus

data class RefundPreviewResponse(
    val reservationId: Long,
    val paymentId: Long?,
    val paymentStatus: PaymentStatus,
    val refundRequired: Boolean,
    val refundableAmount: Long,
    val nonRefundableAmount: Long,
    val alreadyRefundedAmount: Long,
    val paidAmount: Long,
    val currency: String,
    val policyRuleId: String?,
    val reason: RefundReason,
    val message: String,
)

data class RefundOperationResponse(
    val refundId: Long?,
    val paymentId: Long?,
    val status: RefundStatus?,
    val paymentStatus: PaymentStatus,
    val refundRequired: Boolean,
    val refundAmount: Long,
    val nonRefundableAmount: Long,
    val alreadyRefundedAmount: Long,
    val currency: String,
    val policyRuleId: String?,
    val reason: RefundReason,
    val message: String,
    val failureCode: String? = null,
    val failureMessage: String? = null,
    val manualResolved: Boolean = false,
)

data class AdminRefundManualResolveRequest(
    val memo: String? = null,
)
