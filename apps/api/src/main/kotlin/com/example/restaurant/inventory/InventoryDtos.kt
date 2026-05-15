package com.example.restaurant.inventory

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Size
import java.time.Instant

data class RestaurantTableSaveRequest(
    @field:Size(max = 80)
    val name: String? = null,

    val seatType: SeatType? = null,

    @field:Size(max = 80)
    val seatTypeLabel: String? = null,

    @field:Min(1)
    val minPartySize: Int? = null,

    @field:Min(1)
    @field:Max(8)
    val maxPartySize: Int? = null,

    val active: Boolean? = null,

    val sortOrder: Int? = null,

    @field:Size(max = 1000)
    val internalNote: String? = null,
)

data class RestaurantTableResponse(
    val id: Long,
    val restaurantId: Long,
    val name: String,
    val seatType: SeatType,
    val seatTypeLabel: String,
    val minPartySize: Int,
    val maxPartySize: Int,
    val active: Boolean,
    val sortOrder: Int,
    val internalNote: String?,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class TableCombinationSaveRequest(
    @field:Size(max = 80)
    val name: String? = null,

    val tableIds: List<Long>? = null,

    @field:Min(1)
    val minPartySize: Int? = null,

    @field:Min(1)
    @field:Max(8)
    val maxPartySize: Int? = null,

    val active: Boolean? = null,
)

data class TableCombinationResponse(
    val id: Long,
    val restaurantId: Long,
    val name: String,
    val tableIds: List<Long>,
    val minPartySize: Int,
    val maxPartySize: Int,
    val active: Boolean,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)

data class ReservationProductSeatRuleSaveRequest(
    val allowedSeatTypes: List<SeatType>? = null,
    val allowedTableIds: List<Long>? = null,

    @field:Min(30)
    @field:Max(240)
    val defaultDurationMinutes: Int? = null,

    val slotIntervalMinutes: Int? = null,

    val inventoryPolicy: InventoryPolicy? = null,
)

data class ReservationProductSeatRuleResponse(
    val productId: Long,
    val restaurantId: Long,
    val allowedSeatTypes: List<SeatType>,
    val allowedTableIds: List<Long>,
    val defaultDurationMinutes: Int?,
    val slotIntervalMinutes: Int?,
    val inventoryPolicy: InventoryPolicy,
    val createdAt: Instant?,
    val updatedAt: Instant?,
)
