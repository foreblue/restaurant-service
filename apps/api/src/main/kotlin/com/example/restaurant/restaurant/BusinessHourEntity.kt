package com.example.restaurant.restaurant

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
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalTime

@Entity
@Table(name = "business_hours")
class BusinessHourEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 20)
    val dayOfWeek: DayOfWeek,

    @Column(nullable = false)
    val sequence: Int,

    @Column(name = "opens_at")
    val opensAt: LocalTime? = null,

    @Column(name = "closes_at")
    val closesAt: LocalTime? = null,

    @Column(name = "is_closed", nullable = false)
    val closed: Boolean = false,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
