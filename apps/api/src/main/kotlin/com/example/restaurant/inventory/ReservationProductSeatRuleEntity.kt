package com.example.restaurant.inventory

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

@Entity
@Table(name = "reservation_product_seat_rules")
class ReservationProductSeatRuleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_product_id", nullable = false)
    val reservationProduct: ReservationProductEntity,

    @Column(name = "allowed_seat_types", columnDefinition = "json")
    var allowedSeatTypesJson: String? = null,

    @Column(name = "allowed_table_ids", columnDefinition = "json")
    var allowedTableIdsJson: String? = null,

    @Column(name = "default_duration_minutes")
    var defaultDurationMinutes: Int? = null,

    @Column(name = "slot_interval_minutes")
    var slotIntervalMinutes: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "inventory_policy", nullable = false, length = 50)
    var inventoryPolicy: InventoryPolicy = InventoryPolicy.TABLE,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
