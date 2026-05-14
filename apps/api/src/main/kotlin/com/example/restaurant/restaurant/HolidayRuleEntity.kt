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
import java.time.LocalDate
import java.time.LocalTime

@Entity
@Table(name = "holiday_rules")
class HolidayRuleEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val type: HolidayRuleType,

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", length = 20)
    val dayOfWeek: DayOfWeek? = null,

    @Column(name = "day_of_month")
    val dayOfMonth: Int? = null,

    @Column(name = "week_of_month")
    val weekOfMonth: Int? = null,

    @Column(name = "holiday_date")
    val date: LocalDate? = null,

    @Column(name = "start_time")
    val startTime: LocalTime? = null,

    @Column(name = "end_time")
    val endTime: LocalTime? = null,

    @Column(length = 255)
    val reason: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
