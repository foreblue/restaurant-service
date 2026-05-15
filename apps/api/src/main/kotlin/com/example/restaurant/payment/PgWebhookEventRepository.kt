package com.example.restaurant.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PgWebhookEventRepository : JpaRepository<PgWebhookEventEntity, Long> {
    fun findByProviderKeyAndEventId(
        providerKey: String,
        eventId: String,
    ): PgWebhookEventEntity?

    fun findByPaymentIdOrderByCreatedAtAsc(paymentId: Long): List<PgWebhookEventEntity>
}
