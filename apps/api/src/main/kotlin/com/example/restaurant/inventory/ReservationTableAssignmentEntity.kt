package com.example.restaurant.inventory

import com.example.restaurant.reservation.ReservationEntity
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
@Table(name = "reservation_table_assignments")
class ReservationTableAssignmentEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    val reservation: ReservationEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_table_id", nullable = false)
    val restaurantTable: RestaurantTableEntity,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,
)
