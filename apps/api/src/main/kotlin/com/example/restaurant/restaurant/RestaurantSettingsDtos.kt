package com.example.restaurant.restaurant

import jakarta.validation.Valid
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class RestaurantUpdateRequest(
    @field:Size(max = 80)
    val name: String? = null,

    @field:Size(max = 500)
    val description: String? = null,

    @field:Size(max = 32)
    val phone: String? = null,

    @field:Size(max = 255)
    val addressLine1: String? = null,

    @field:Size(max = 255)
    val addressLine2: String? = null,

    @field:Size(max = 20)
    val postalCode: String? = null,

    val cuisineTypes: List<String>? = null,

    val coverImageFileId: Long? = null,
)

data class BusinessHoursSaveRequest(
    @field:Valid
    val hours: List<BusinessHourSaveItem> = emptyList(),
)

data class BusinessHourSaveItem(
    val dayOfWeek: String,
    val opensAt: String? = null,
    val closesAt: String? = null,
    val closed: Boolean? = null,
)

data class HolidayRulesSaveRequest(
    @field:Valid
    val rules: List<HolidayRuleSaveItem> = emptyList(),
)

data class HolidayRuleSaveItem(
    val type: String,
    val dayOfWeek: String? = null,
    val dayOfMonth: Int? = null,
    val weekOfMonth: Int? = null,
    val date: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,

    @field:Size(max = 255)
    val reason: String? = null,
)

data class ReservationPageSaveRequest(
    @field:Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$")
    @field:Size(max = 60)
    val slug: String? = null,

    val status: ReservationPageStatus,
)

data class RestaurantSettingsResponse(
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
    val approvedAt: Instant?,
    val reservationPage: ReservationPageSettingsResponse?,
    val businessHours: List<BusinessHourResponse>,
    val holidayRules: List<HolidayRuleResponse>,
)

data class ReservationPageSettingsResponse(
    val id: Long,
    val slug: String?,
    val status: ReservationPageStatus,
    val publishedAt: Instant?,
    val unpublishedAt: Instant?,
    val publicUrl: String?,
    val publishable: Boolean,
    val publishBlockers: List<String>,
)

data class BusinessHourResponse(
    val id: Long,
    val dayOfWeek: DayOfWeek,
    val sequence: Int,
    val opensAt: LocalTime?,
    val closesAt: LocalTime?,
    val closed: Boolean,
)

data class HolidayRuleResponse(
    val id: Long,
    val type: HolidayRuleType,
    val dayOfWeek: DayOfWeek?,
    val dayOfMonth: Int?,
    val weekOfMonth: Int?,
    val date: LocalDate?,
    val startTime: LocalTime?,
    val endTime: LocalTime?,
    val reason: String?,
)

data class PublicRestaurantResponse(
    val id: Long,
    val name: String,
    val slug: String,
    val description: String?,
    val phone: String,
    val addressLine1: String,
    val addressLine2: String?,
    val postalCode: String?,
    val cuisineTypes: List<String>,
    val coverImageFileId: Long?,
    val timezone: String,
    val businessHours: List<BusinessHourResponse>,
    val holidayRules: List<HolidayRuleResponse>,
    val reservationPage: PublicReservationPageResponse,
)

data class PublicReservationPageResponse(
    val status: ReservationPageStatus,
    val publishedAt: Instant?,
)
