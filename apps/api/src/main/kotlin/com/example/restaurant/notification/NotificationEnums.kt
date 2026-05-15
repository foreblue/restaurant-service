package com.example.restaurant.notification

enum class NotificationRecipientType {
    CUSTOMER,
}

enum class NotificationChannel {
    SMS,
}

enum class NotificationStatus {
    QUEUED,
    SENDING,
    SENT,
    FAILED,
    CANCELLED,
}
