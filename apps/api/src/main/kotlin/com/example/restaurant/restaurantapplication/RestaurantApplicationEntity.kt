package com.example.restaurant.restaurantapplication

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.StoredFileEntity
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
@Table(name = "restaurant_applications")
class RestaurantApplicationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @Column(name = "business_registration_no", length = 10)
    var businessRegistrationNo: String? = null,

    @Column(name = "business_name", length = 120)
    var businessName: String? = null,

    @Column(name = "representative_name", length = 100)
    var representativeName: String? = null,

    @Column(name = "business_address")
    var businessAddress: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_license_file_id")
    var businessLicenseFile: StoredFileEntity? = null,

    @Column(name = "manager_name", length = 100)
    var managerName: String? = null,

    @Column(name = "manager_phone", length = 32)
    var managerPhone: String? = null,

    @Column(name = "manager_email")
    var managerEmail: String? = null,

    @Column(name = "contact_verified_at")
    var contactVerifiedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: RestaurantApplicationStatus = RestaurantApplicationStatus.DRAFT,

    @Column(name = "submitted_at")
    var submittedAt: Instant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_user_id")
    var reviewedBy: BusinessUserEntity? = null,

    @Column(name = "reviewed_at")
    var reviewedAt: Instant? = null,

    @Column(name = "review_note", columnDefinition = "text")
    var reviewNote: String? = null,

    @Column(name = "rejection_reason", columnDefinition = "text")
    var rejectionReason: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)
