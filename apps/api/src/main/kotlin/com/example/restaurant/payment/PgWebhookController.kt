package com.example.restaurant.payment

import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/pg/webhooks")
class PgWebhookController(
    private val pgWebhookService: PgWebhookService,
) {
    @PostMapping
    fun receive(
        @RequestHeader("X-PG-Signature", required = false) headerSignature: String?,
        @RequestBody request: PgWebhookRequest,
    ): PgWebhookResponse =
        pgWebhookService.receive(request, headerSignature)
}
