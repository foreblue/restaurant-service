package com.example.restaurant.reservationproduct

import com.example.restaurant.inventory.SeatType
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Size
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalTime

data class ReservationProductSaveRequest(
    @field:Size(max = 80)
    val name: String? = null,

    @field:Size(max = 500)
    val description: String? = null,

    @field:Min(0)
    val priceAmount: Long? = null,

    val visible: Boolean? = null,

    @field:Min(1)
    val minPartySize: Int? = null,

    @field:Min(1)
    val maxPartySize: Int? = null,

    val availableDays: List<String>? = null,

    val availableStartTime: String? = null,

    val availableEndTime: String? = null,

    @field:Min(1)
    val slotCapacity: Int? = null,
)

data class ReservationProductResponse(
    val id: Long,
    val restaurantId: Long,
    val name: String,
    val description: String?,
    val priceAmount: Long,
    val visible: Boolean,
    val status: ReservationProductStatus,
    val minPartySize: Int,
    val maxPartySize: Int,
    val availableDays: List<DayOfWeek>,
    val availableStartTime: LocalTime?,
    val availableEndTime: LocalTime?,
    val slotCapacity: Int,
    val paymentPolicyType: ReservationProductPaymentPolicyType,
    val paymentAmount: Long?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class ReservationProductPaymentPolicyRequest(
    val paymentPolicyType: ReservationProductPaymentPolicyType? = null,

    @field:Min(0)
    val paymentAmount: Long? = null,
)

data class ReservationProductPaymentPolicyResponse(
    val productId: Long,
    val paymentPolicyType: ReservationProductPaymentPolicyType,
    val paymentAmount: Long?,
    val updatedAt: Instant?,
)

data class ReservationProductCancellationPolicyRequest(
    @field:Size(max = 120)
    val name: String? = null,

    val rules: List<CancellationPolicyRuleRequest>? = null,

    val noShowRule: CancellationPolicyNoShowRuleRequest? = null,

    @field:Min(0)
    @field:Max(100)
    val restaurantCancelRefundRate: Int? = null,

    val effectiveFrom: Instant? = null,
)

data class CancellationPolicyRuleRequest(
    @field:Min(0)
    val beforeVisitHours: Long? = null,

    @field:Min(0)
    @field:Max(100)
    val refundRate: Int? = null,
)

data class CancellationPolicyNoShowRuleRequest(
    @field:Min(0)
    @field:Max(100)
    val refundRate: Int? = null,

    @field:Min(0)
    val feeAmount: Long? = null,
)

data class ReservationProductCancellationPolicyResponse(
    val policyId: Long,
    val productId: Long,
    val active: Boolean,
    val name: String,
    val rules: List<CancellationPolicyRuleResponse>,
    val noShowRule: CancellationPolicyNoShowRuleResponse?,
    val restaurantCancelRefundRate: Int,
    val effectiveFrom: Instant,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class CancellationPolicyRuleResponse(
    val id: String,
    val beforeVisitHours: Long,
    val refundRate: Int,
)

data class CancellationPolicyNoShowRuleResponse(
    val refundRate: Int,
    val feeAmount: Long?,
)

data class PublicReservationProductListResponse(
    val products: List<PublicReservationProductResponse>,
)

data class PublicReservationProductResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val displayPrice: Long,
    val minPartySize: Int,
    val maxPartySize: Int,
    val availableDays: List<DayOfWeek>,
    val availableStartTime: LocalTime?,
    val availableEndTime: LocalTime?,
    val requiresPayment: Boolean,
    val depositAmount: Long,
    val paymentPolicyType: ReservationProductPaymentPolicyType,
    val paymentAmount: Long?,
    val seatTypes: List<PublicReservationProductSeatTypeResponse> = emptyList(),
)

data class PublicReservationProductSeatTypeResponse(
    val code: SeatType,
    val label: String,
)

data class ReservationProductRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
