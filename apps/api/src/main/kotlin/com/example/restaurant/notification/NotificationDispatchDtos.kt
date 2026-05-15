package com.example.restaurant.notification

data class NotificationDispatchRequest(
    val limit: Int? = null,
)

data class NotificationDispatchResponse(
    val requested: Int,
    val sent: Int,
    val failed: Int,
    val items: List<NotificationDispatchItemResponse>,
)

data class NotificationDispatchItemResponse(
    val notificationId: Long,
    val status: NotificationStatus,
    val attemptCount: Int,
    val providerKey: String?,
    val providerMessageId: String?,
    val nextRetryAt: java.time.Instant?,
    val lastError: String?,
)
