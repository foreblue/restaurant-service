package com.example.restaurant.restaurant

import com.example.restaurant.auth.BusinessUserEntity
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
@Table(name = "restaurants")
class RestaurantEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    val owner: BusinessUserEntity,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(unique = true, length = 60)
    var slug: String? = null,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(nullable = false, length = 32)
    var phone: String,

    @Column(name = "address_line1", nullable = false)
    var addressLine1: String,

    @Column(name = "address_line2")
    var addressLine2: String? = null,

    @Column(name = "postal_code", length = 20)
    var postalCode: String? = null,

    @Column(name = "cuisine_types", nullable = false, columnDefinition = "json")
    var cuisineTypesJson: String = "[]",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cover_image_file_id")
    var coverImageFile: StoredFileEntity? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: RestaurantStatus = RestaurantStatus.DRAFT,

    @Column(nullable = false, length = 50)
    var timezone: String = "Asia/Seoul",

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @Column(name = "suspended_at")
    var suspendedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
