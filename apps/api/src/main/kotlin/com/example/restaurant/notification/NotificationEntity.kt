package com.example.restaurant.notification

import com.example.restaurant.reservation.CustomerEntity
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.restaurant.RestaurantEntity
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
@Table(name = "notifications")
class NotificationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    val reservation: ReservationEntity,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    val customer: CustomerEntity? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false, length = 50)
    val recipientType: NotificationRecipientType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val channel: NotificationChannel,

    @Column(name = "recipient_contact", nullable = false, length = 120)
    val recipientContact: String,

    @Column(name = "template_key", nullable = false, length = 100)
    val templateKey: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: NotificationStatus = NotificationStatus.QUEUED,

    @Column(name = "payload", nullable = false, columnDefinition = "json")
    val payloadJson: String,

    @Column(name = "scheduled_at")
    var scheduledAt: Instant? = null,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "next_retry_at")
    var nextRetryAt: Instant? = null,

    @Column(name = "provider_key", length = 80)
    var providerKey: String? = null,

    @Column(name = "provider_message_id", length = 128)
    var providerMessageId: String? = null,

    @Column(name = "last_error", columnDefinition = "text")
    var lastError: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
