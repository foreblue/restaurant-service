package com.example.restaurant.notification

import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/notifications")
class AdminNotificationController(
    private val notificationDispatchService: NotificationDispatchService,
) {
    @PostMapping("/dispatch")
    fun dispatch(
        @RequestBody(required = false) request: NotificationDispatchRequest?,
    ): NotificationDispatchResponse =
        notificationDispatchService.dispatch(request)

    @PostMapping("/{notificationId}/retry")
    fun retry(
        @PathVariable notificationId: Long,
    ): NotificationDispatchItemResponse =
        notificationDispatchService.retry(notificationId)
}
