package com.example.restaurant.customer

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.reservation.CustomerEntity
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
@Table(name = "customer_notes")
class CustomerNoteEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    val customer: CustomerEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    val authorUser: BusinessUserEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 50)
    var noteType: CustomerNoteType = CustomerNoteType.GENERAL,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var visibility: CustomerNoteVisibility = CustomerNoteVisibility.OWNER_ONLY,

    @Column(nullable = false, columnDefinition = "text")
    var content: String,

    @Column(name = "deleted_at")
    var deletedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)

enum class CustomerNoteType {
    GENERAL,
    CAUTION,
    PRIVACY_REQUEST,
    MERGE,
}

enum class CustomerNoteVisibility {
    OWNER_ONLY,
}
