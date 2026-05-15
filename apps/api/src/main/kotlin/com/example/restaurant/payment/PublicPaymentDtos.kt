package com.example.restaurant.payment

import com.example.restaurant.reservation.ReservationPaymentMode
import java.time.Instant

data class PublicPaymentStartRequest(
    val paymentMode: String? = null,
    val returnUrl: String? = null,
    val idempotencyKey: String? = null,
)

data class PublicGuaranteeStartRequest(
    val returnUrl: String? = null,
    val idempotencyKey: String? = null,
)

data class PublicPaymentSummaryResponse(
    val reservationId: Long,
    val paymentMode: ReservationPaymentMode,
    val paymentStatus: PaymentStatus,
    val paymentRequired: Boolean,
    val amount: Long,
    val currency: String,
    val paymentDueAt: Instant?,
    val cancellationPolicySummary: String?,
)

data class PublicPaymentStartResponse(
    val paymentId: Long,
    val status: PaymentStatus,
    val amount: Long,
    val currency: String,
    val paymentAction: PublicPaymentActionResponse?,
    val expiresAt: Instant?,
)

data class PublicGuaranteeStartResponse(
    val paymentId: Long,
    val status: PaymentStatus,
    val guaranteeAction: PublicPaymentActionResponse?,
    val expiresAt: Instant?,
)

data class PublicPaymentActionResponse(
    val type: String,
    val url: String,
)
