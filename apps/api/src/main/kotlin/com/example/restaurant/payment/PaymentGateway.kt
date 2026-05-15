package com.example.restaurant.payment

import java.time.Instant

interface PaymentGateway {
    fun createPayment(request: PaymentGatewayRequest): PaymentGatewayResult

    fun registerGuarantee(request: PaymentGatewayRequest): PaymentGatewayResult
}

data class PaymentGatewayRequest(
    val paymentId: Long,
    val reservationNumber: String,
    val amount: Long,
    val currency: String,
    val returnUrl: String,
    val idempotencyKey: String,
)

data class PaymentGatewayResult(
    val status: PaymentGatewayResultStatus,
    val providerKey: String,
    val providerPaymentId: String?,
    val providerOrderId: String?,
    val action: PaymentGatewayAction?,
    val expiresAt: Instant?,
    val failureCode: String? = null,
    val failureMessage: String? = null,
)

data class PaymentGatewayAction(
    val type: String,
    val url: String,
)

enum class PaymentGatewayResultStatus {
    PENDING,
    FAILED,
    EXPIRED,
}
