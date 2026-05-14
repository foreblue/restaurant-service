package com.example.restaurant.restaurantapplication

import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantStatus
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class RestaurantApplicationSaveRequest(
    @field:Size(max = 80)
    val restaurantName: String? = null,

    @field:Size(max = 500)
    val restaurantDescription: String? = null,

    @field:Size(max = 32)
    val restaurantPhone: String? = null,

    @field:Size(max = 255)
    val addressLine1: String? = null,

    @field:Size(max = 255)
    val addressLine2: String? = null,

    @field:Size(max = 20)
    val postalCode: String? = null,

    val cuisineTypes: List<String>? = null,

    val coverImageFileId: Long? = null,

    @field:Pattern(regexp = "^$|\\d{10}")
    val businessRegistrationNo: String? = null,

    @field:Size(max = 120)
    val businessName: String? = null,

    @field:Size(max = 100)
    val representativeName: String? = null,

    @field:Size(max = 255)
    val businessAddress: String? = null,

    val businessLicenseFileId: Long? = null,

    @field:Size(max = 100)
    val managerName: String? = null,

    @field:Size(max = 32)
    val managerPhone: String? = null,

    @field:Email
    @field:Size(max = 255)
    val managerEmail: String? = null,

    val contactVerified: Boolean? = null,
)

data class RestaurantApplicationReviewRequest(
    @field:Size(max = 1000)
    val reviewNote: String? = null,
)

data class RestaurantApplicationRejectRequest(
    @field:NotBlank
    @field:Size(max = 1000)
    val rejectionReason: String,

    @field:Size(max = 1000)
    val reviewNote: String? = null,
)

data class RestaurantApplicationResponse(
    val id: Long,
    val status: RestaurantApplicationStatus,
    val restaurant: RestaurantApplicationRestaurantResponse,
    val businessRegistrationNo: String?,
    val businessName: String?,
    val representativeName: String?,
    val businessAddress: String?,
    val businessLicenseFileId: Long?,
    val managerName: String?,
    val managerPhone: String?,
    val managerEmail: String?,
    val contactVerified: Boolean,
    val submittedAt: Instant?,
    val reviewedAt: Instant?,
    val reviewNote: String?,
    val rejectionReason: String?,
)

data class RestaurantApplicationRestaurantResponse(
    val id: Long,
    val status: RestaurantStatus,
    val name: String?,
    val slug: String?,
    val description: String?,
    val phone: String?,
    val addressLine1: String?,
    val addressLine2: String?,
    val postalCode: String?,
    val cuisineTypes: List<String>,
    val coverImageFileId: Long?,
    val timezone: String,
    val reservationPage: RestaurantApplicationReservationPageResponse?,
)

data class RestaurantApplicationReservationPageResponse(
    val id: Long,
    val slug: String?,
    val status: ReservationPageStatus,
)

data class BusinessRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
