package com.example.restaurant.payment

data class PgWebhookRequest(
    val providerKey: String? = null,
    val eventId: String? = null,
    val eventType: String? = null,
    val pgPaymentId: String? = null,
    val pgRefundId: String? = null,
    val amount: Long? = null,
    val currency: String? = null,
    val occurredAt: String? = null,
    val signature: String? = null,
)

data class PgWebhookResponse(
    val eventId: String,
    val status: PgWebhookEventStatus,
    val paymentId: Long?,
    val paymentStatus: PaymentStatus?,
    val reservationId: Long?,
    val reservationPaymentStatus: PaymentStatus?,
    val failureCode: String?,
    val failureMessage: String?,
)
