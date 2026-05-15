package com.example.restaurant.reservation

import com.example.restaurant.reservationproduct.ReservationProductEntity
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
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "reservations")
class ReservationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_product_id", nullable = false)
    var reservationProduct: ReservationProductEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    val customer: CustomerEntity,

    @Column(name = "reservation_number", nullable = false, length = 64)
    val reservationNumber: String,

    @Column(name = "visit_date", nullable = false)
    var visitDate: LocalDate,

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Column(name = "party_size", nullable = false)
    var partySize: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: ReservationStatus = ReservationStatus.CONFIRMED,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val source: ReservationSource = ReservationSource.ONLINE,

    @Column(name = "customer_request", length = 500)
    val customerRequest: String? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancel_reason", length = 255)
    var cancelReason: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "no_show_at")
    var noShowAt: Instant? = null,

    @Column(name = "idempotency_key", nullable = false, length = 128)
    val idempotencyKey: String,

    @Column(name = "idempotency_request_hash", nullable = false, length = 64)
    val idempotencyRequestHash: String,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
