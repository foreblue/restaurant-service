package com.example.restaurant.refund

data class RefundGatewayRequest(
    val refundId: Long,
    val paymentId: Long,
    val providerKey: String?,
    val providerPaymentId: String?,
    val amount: Long,
    val currency: String,
    val idempotencyKey: String,
    val reason: RefundReason,
)

data class RefundGatewayResult(
    val status: RefundGatewayResultStatus,
    val providerRefundId: String?,
    val failureCode: String? = null,
    val failureMessage: String? = null,
)

enum class RefundGatewayResultStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
}

interface RefundGateway {
    fun refundPayment(request: RefundGatewayRequest): RefundGatewayResult
}
