package com.example.restaurant.payment

import com.example.restaurant.refund.RefundEntity
import com.example.restaurant.reservation.ReservationEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "pg_webhook_events")
class PgWebhookEventEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "provider_key", nullable = false, length = 80)
    val providerKey: String,

    @Column(name = "event_id", nullable = false, length = 128)
    val eventId: String,

    @Column(name = "event_type", nullable = false, length = 100)
    val eventType: String,

    @Column(name = "pg_payment_id", length = 128)
    val pgPaymentId: String? = null,

    @Column(name = "pg_refund_id", length = 128)
    val pgRefundId: String? = null,

    @Column(name = "amount")
    val amount: Long? = null,

    @Column(nullable = false, length = 3)
    val currency: String = "KRW",

    @Column(length = 255)
    val signature: String? = null,

    @Column(nullable = false, columnDefinition = "json")
    val payload: String,

    @Column(nullable = false)
    var verified: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: PgWebhookEventStatus = PgWebhookEventStatus.RECEIVED,

    @Column(name = "failure_code", length = 100)
    var failureCode: String? = null,

    @Column(name = "failure_message", length = 500)
    var failureMessage: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    var payment: PaymentEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_id")
    var refund: RefundEntity? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    var reservation: ReservationEntity? = null,

    @Column(name = "occurred_at")
    val occurredAt: Instant? = null,

    @Column(name = "processed_at")
    var processedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
