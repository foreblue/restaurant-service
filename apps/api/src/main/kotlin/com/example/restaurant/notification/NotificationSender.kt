package com.example.restaurant.notification

data class NotificationSendRequest(
    val notificationId: Long,
    val channel: NotificationChannel,
    val recipientType: NotificationRecipientType,
    val recipientContact: String,
    val templateKey: String,
    val payloadJson: String,
)

data class NotificationSendResult(
    val status: NotificationSendResultStatus,
    val providerKey: String,
    val providerMessageId: String? = null,
    val failureMessage: String? = null,
)

enum class NotificationSendResultStatus {
    SENT,
    FAILED,
}

interface NotificationSender {
    fun send(request: NotificationSendRequest): NotificationSendResult
}
