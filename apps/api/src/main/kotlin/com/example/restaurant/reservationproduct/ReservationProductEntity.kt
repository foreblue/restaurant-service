package com.example.restaurant.reservationproduct

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
import java.time.LocalTime

@Entity
@Table(name = "reservation_products")
class ReservationProductEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(length = 500)
    var description: String? = null,

    @Column(name = "price_amount", nullable = false)
    var priceAmount: Long = 0,

    @Column(nullable = false)
    var visible: Boolean = true,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: ReservationProductStatus = ReservationProductStatus.ACTIVE,

    @Column(name = "min_party_size", nullable = false)
    var minPartySize: Int = 1,

    @Column(name = "max_party_size", nullable = false)
    var maxPartySize: Int = 1,

    @Column(name = "available_days", columnDefinition = "json")
    var availableDaysJson: String,

    @Column(name = "available_start_time")
    var availableStartTime: LocalTime? = null,

    @Column(name = "available_end_time")
    var availableEndTime: LocalTime? = null,

    @Column(name = "slot_capacity", nullable = false)
    var slotCapacity: Int = 1,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_policy_type", nullable = false, length = 50)
    var paymentPolicyType: ReservationProductPaymentPolicyType = ReservationProductPaymentPolicyType.NONE,

    @Column(name = "payment_amount")
    var paymentAmount: Long? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
