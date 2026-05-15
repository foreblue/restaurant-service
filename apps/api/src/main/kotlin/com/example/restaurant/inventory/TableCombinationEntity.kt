package com.example.restaurant.inventory

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
@Table(name = "table_combinations")
class TableCombinationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(name = "table_ids", nullable = false, columnDefinition = "json")
    var tableIdsJson: String,

    @Column(name = "min_party_size", nullable = false)
    var minPartySize: Int,

    @Column(name = "max_party_size", nullable = false)
    var maxPartySize: Int,

    @Column(name = "is_active", nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
