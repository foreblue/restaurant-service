package com.example.restaurant.refund

import com.example.restaurant.payment.PaymentEntity
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
@Table(name = "refunds")
class RefundEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    val payment: PaymentEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    val reservation: ReservationEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: RefundStatus,

    @Column(name = "refund_amount", nullable = false)
    val refundAmount: Long,

    @Column(name = "non_refundable_amount", nullable = false)
    val nonRefundableAmount: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val reason: RefundReason,

    @Column(name = "policy_snapshot", columnDefinition = "json")
    val policySnapshotJson: String? = null,

    @Column(name = "policy_rule_id", length = 100)
    val policyRuleId: String? = null,

    @Column(name = "pg_refund_id", length = 128)
    var pgRefundId: String? = null,

    @Column(name = "idempotency_key", nullable = false, length = 128)
    val idempotencyKey: String,

    @Column(name = "failure_code", length = 100)
    var failureCode: String? = null,

    @Column(name = "failure_message", length = 500)
    var failureMessage: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_by_role", nullable = false, length = 50)
    val requestedByRole: RefundRequesterRole,

    @Column(name = "requested_at", nullable = false, insertable = false, updatable = false)
    val requestedAt: Instant? = null,

    @Column(name = "succeeded_at")
    var succeededAt: Instant? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
