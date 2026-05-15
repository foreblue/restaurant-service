package com.example.restaurant.payment

import org.springframework.stereotype.Component

@Component
class FakePgWebhookSignatureVerifier : PgWebhookSignatureVerifier {
    override fun verify(request: PgWebhookVerificationRequest): Boolean =
        request.providerKey == "fake" &&
            (request.signature == "fake-signature" || request.signature == "fake-${request.eventId}")
}
