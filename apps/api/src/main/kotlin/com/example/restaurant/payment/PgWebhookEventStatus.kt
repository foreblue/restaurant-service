package com.example.restaurant.payment

enum class PgWebhookEventStatus {
    RECEIVED,
    PROCESSED,
    DUPLICATE,
    SIGNATURE_FAILED,
    FAILED,
    IGNORED,
}
