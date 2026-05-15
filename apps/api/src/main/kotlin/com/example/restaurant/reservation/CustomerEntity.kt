package com.example.restaurant.reservation

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
@Table(name = "customers")
class CustomerEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(name = "phone_number", nullable = false, length = 32)
    var phoneNumber: String,

    @Column(length = 255)
    var email: String? = null,

    @Column(name = "allergy_note", columnDefinition = "text")
    var allergyNote: String? = null,

    @Column(name = "anniversary_type", length = 40)
    var anniversaryType: String? = null,

    @Column(name = "anniversary_date", length = 10)
    var anniversaryDate: String? = null,

    @Column(name = "preference_note", columnDefinition = "text")
    var preferenceNote: String? = null,

    @Column(name = "internal_note", columnDefinition = "text")
    var internalNote: String? = null,

    @Column(name = "is_vip", nullable = false)
    var vip: Boolean = false,

    @Column(name = "is_caution", nullable = false)
    var caution: Boolean = false,

    @Column(name = "caution_reason", columnDefinition = "text")
    var cautionReason: String? = null,

    @Column(name = "is_blocked", nullable = false)
    var blocked: Boolean = false,

    @Column(name = "blocked_reason", columnDefinition = "text")
    var blockedReason: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
