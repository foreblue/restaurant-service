package com.example.restaurant.notification

enum class NotificationRecipientType {
    CUSTOMER,
    OWNER,
}

enum class NotificationChannel {
    SMS,
    KAKAO,
    EMAIL,
}

enum class NotificationStatus {
    QUEUED,
    SENDING,
    SENT,
    FAILED,
    CANCELLED,
}
