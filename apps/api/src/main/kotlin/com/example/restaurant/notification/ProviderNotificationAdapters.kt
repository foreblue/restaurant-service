package com.example.restaurant.notification

class SmsNotificationProviderAdapter : NotificationSender {
    override fun send(request: NotificationSendRequest): NotificationSendResult =
        unsupported("SMS")
}

class KakaoNotificationProviderAdapter : NotificationSender {
    override fun send(request: NotificationSendRequest): NotificationSendResult =
        unsupported("KAKAO")
}

class EmailNotificationProviderAdapter : NotificationSender {
    override fun send(request: NotificationSendRequest): NotificationSendResult =
        unsupported("EMAIL")
}

private fun unsupported(provider: String): NotificationSendResult =
    NotificationSendResult(
        status = NotificationSendResultStatus.FAILED,
        providerKey = provider.lowercase(),
        failureMessage = "$provider provider adapter is not configured.",
    )
