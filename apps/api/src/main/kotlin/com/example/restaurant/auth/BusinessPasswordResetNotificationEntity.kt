package com.example.restaurant.auth

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
@Table(name = "business_password_reset_notifications")
class BusinessPasswordResetNotificationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reset_token_id", nullable = false)
    val resetToken: BusinessPasswordResetTokenEntity,

    @Column(name = "recipient_email", nullable = false)
    val recipientEmail: String,

    @Column(nullable = false, length = 50)
    val channel: String = "EMAIL",

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val status: PasswordResetNotificationStatus = PasswordResetNotificationStatus.RECORDED,

    @Column(name = "delivery_payload", columnDefinition = "json")
    val deliveryPayload: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,
)

enum class PasswordResetNotificationStatus {
    RECORDED,
    SENT,
    FAILED,
}
