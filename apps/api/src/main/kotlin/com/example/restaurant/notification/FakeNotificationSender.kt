package com.example.restaurant.notification

import org.springframework.stereotype.Component

@Component
class FakeNotificationSender : NotificationSender {
    override fun send(request: NotificationSendRequest): NotificationSendResult =
        if ("notification-fail" in request.recipientContact || "NOTIFICATION_FAIL" in request.templateKey) {
            NotificationSendResult(
                status = NotificationSendResultStatus.FAILED,
                providerKey = PROVIDER_KEY,
                failureMessage = "테스트 알림 발송 실패",
            )
        } else {
            NotificationSendResult(
                status = NotificationSendResultStatus.SENT,
                providerKey = PROVIDER_KEY,
                providerMessageId = "fake-notification-${request.notificationId}",
            )
        }

    private companion object {
        const val PROVIDER_KEY = "fake"
    }
}
