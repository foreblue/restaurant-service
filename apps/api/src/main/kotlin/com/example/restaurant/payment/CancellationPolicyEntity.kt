package com.example.restaurant.payment

import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.restaurant.RestaurantEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "cancellation_policies")
class CancellationPolicyEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_product_id", nullable = false)
    val reservationProduct: ReservationProductEntity,

    @Column(nullable = false, length = 120)
    var name: String,

    @Column(name = "rules", nullable = false, columnDefinition = "json")
    var rulesJson: String,

    @Column(name = "no_show_rule", columnDefinition = "json")
    var noShowRuleJson: String? = null,

    @Column(name = "restaurant_cancel_refund_rate", nullable = false)
    var restaurantCancelRefundRate: Int = 100,

    @Column(name = "is_active", nullable = false)
    var active: Boolean = true,

    @Column(name = "effective_from", nullable = false)
    var effectiveFrom: Instant,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
