package com.example.restaurant.notification

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.Instant

private const val DEFAULT_NOTIFICATION_DISPATCH_LIMIT = 50
private const val MAX_NOTIFICATION_DISPATCH_LIMIT = 100

@Service
class NotificationDispatchService(
    private val notificationRepository: NotificationRepository,
    private val notificationSender: NotificationSender,
    private val clock: Clock,
) {
    @Transactional
    fun dispatch(request: NotificationDispatchRequest?): NotificationDispatchResponse {
        val limit = request.normalizedLimit()
        val now = Instant.now(clock)
        val notifications = notificationRepository.findDispatchable(
            statuses = listOf(NotificationStatus.QUEUED, NotificationStatus.FAILED),
            now = now,
            pageable = PageRequest.of(0, limit),
        )
        val items = notifications.map { dispatchOne(it, now) }
        return NotificationDispatchResponse(
            requested = notifications.size,
            sent = items.count { it.status == NotificationStatus.SENT },
            failed = items.count { it.status == NotificationStatus.FAILED },
            items = items,
        )
    }

    @Transactional
    fun retry(notificationId: Long): NotificationDispatchItemResponse {
        val notification = notificationRepository.findByIdForUpdate(notificationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "알림 요청을 찾을 수 없습니다.")
        if (notification.status != NotificationStatus.FAILED) {
            throw ApiException(ErrorCode.CONFLICT, "실패 상태의 알림만 재시도할 수 있습니다.")
        }
        notification.status = NotificationStatus.QUEUED
        notification.nextRetryAt = null
        notification.lastError = null
        return dispatchOne(notification, Instant.now(clock))
    }

    private fun dispatchOne(
        notification: NotificationEntity,
        now: Instant,
    ): NotificationDispatchItemResponse {
        notification.status = NotificationStatus.SENDING
        notification.attemptCount += 1
        val result = notificationSender.send(notification.toSendRequest())
        notification.providerKey = result.providerKey
        notification.providerMessageId = result.providerMessageId
        return when (result.status) {
            NotificationSendResultStatus.SENT -> {
                notification.status = NotificationStatus.SENT
                notification.sentAt = now
                notification.nextRetryAt = null
                notification.lastError = null
                notification.toDispatchItem()
            }
            NotificationSendResultStatus.FAILED -> {
                notification.status = NotificationStatus.FAILED
                notification.sentAt = null
                notification.nextRetryAt = now.plus(retryDelay(notification.attemptCount))
                notification.lastError = result.failureMessage ?: "알림 발송에 실패했습니다."
                notification.toDispatchItem()
            }
        }
    }

    private fun NotificationEntity.toSendRequest(): NotificationSendRequest =
        NotificationSendRequest(
            notificationId = id,
            channel = channel,
            recipientType = recipientType,
            recipientContact = recipientContact,
            templateKey = templateKey,
            payloadJson = payloadJson,
        )

    private fun NotificationEntity.toDispatchItem(): NotificationDispatchItemResponse =
        NotificationDispatchItemResponse(
            notificationId = id,
            status = status,
            attemptCount = attemptCount,
            providerKey = providerKey,
            providerMessageId = providerMessageId,
            nextRetryAt = nextRetryAt,
            lastError = lastError,
        )

    private fun retryDelay(attemptCount: Int): Duration =
        Duration.ofMinutes((attemptCount * 5L).coerceAtMost(60))

    private fun NotificationDispatchRequest?.normalizedLimit(): Int {
        val limit = this?.limit ?: DEFAULT_NOTIFICATION_DISPATCH_LIMIT
        if (limit !in 1..MAX_NOTIFICATION_DISPATCH_LIMIT) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "limit은 1 이상 100 이하여야 합니다.")
        }
        return limit
    }
}
