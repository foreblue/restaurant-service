package com.example.restaurant.payment

interface PgWebhookSignatureVerifier {
    fun verify(request: PgWebhookVerificationRequest): Boolean
}

data class PgWebhookVerificationRequest(
    val providerKey: String,
    val eventId: String,
    val signature: String?,
    val payload: String,
)
