package com.example.restaurant.inventory

import com.example.restaurant.availability.TimeSlotRepository
import com.example.restaurant.availability.TimeSlotStatus
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationStatus
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalTime

@Service
class SeatInventoryService(
    private val restaurantTableRepository: RestaurantTableRepository,
    private val tableCombinationRepository: TableCombinationRepository,
    private val seatRuleRepository: ReservationProductSeatRuleRepository,
    private val assignmentRepository: ReservationTableAssignmentRepository,
    private val reservationRepository: ReservationRepository,
    private val timeSlotRepository: TimeSlotRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun availability(
        product: ReservationProductEntity,
        visitDate: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime,
        partySize: Int,
        baseCapacity: Int,
        excludedReservationId: Long? = null,
    ): SeatInventoryAvailability {
        val candidates = tableCandidates(product, partySize)
        if (candidates.tableInventoryEnabled) {
            if (candidates.plans.isEmpty()) {
                return SeatInventoryAvailability(available = false, remainingCapacity = 0)
            }
            val tableIds = candidates.plans.flatMap { it.tableIds }.toSet()
            val occupiedTableIds = assignmentRepository.findOverlappingAssignments(
                restaurantId = product.restaurant.id,
                tableIds = tableIds,
                visitDate = visitDate,
                startTime = startTime,
                endTime = endTime,
                statuses = activeReservationStatuses(),
                excludedReservationId = excludedReservationId,
            ).map { it.restaurantTable.id }.toSet()
            val availablePlans = candidates.plans.filter { plan -> plan.tableIds.none { it in occupiedTableIds } }
            return SeatInventoryAvailability(
                available = availablePlans.isNotEmpty(),
                remainingCapacity = availablePlans.maxOfOrNull { it.capacity } ?: 0,
            )
        }

        val reservedPartySize = reservationRepository.sumPartySizeByOverlappingRange(
            productId = product.id,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            statuses = activeReservationStatuses(),
            excludedReservationId = excludedReservationId,
        )
        val remainingCapacity = (baseCapacity - reservedPartySize).coerceAtLeast(0).toInt()
        return SeatInventoryAvailability(
            available = remainingCapacity >= partySize,
            remainingCapacity = remainingCapacity,
        )
    }

    @Transactional
    fun assignReservation(reservation: ReservationEntity) {
        if (reservation.status !in activeReservationStatuses()) {
            return
        }
        ensureTimeSlotOpen(reservation)
        val candidates = tableCandidates(reservation.reservationProduct, reservation.partySize)
        if (!candidates.tableInventoryEnabled) {
            ensureQuantityCapacity(reservation)
            assignmentRepository.deleteByReservationId(reservation.id)
            assignmentRepository.flush()
            return
        }
        candidates.plans.forEach { plan ->
            lockTables(reservation.restaurant.id, plan.tableIds)
            val overlapping = assignmentRepository.findOverlappingAssignmentsForUpdate(
                restaurantId = reservation.restaurant.id,
                tableIds = plan.tableIds,
                visitDate = reservation.visitDate,
                startTime = reservation.startTime,
                endTime = reservation.endTime,
                statuses = activeReservationStatuses(),
                excludedReservationId = reservation.id,
            )
            if (overlapping.isEmpty()) {
                replaceAssignments(reservation, plan.tableIds)
                return
            }
        }
        throw ApiException(ErrorCode.CONFLICT, "예약 가능한 좌석이 없습니다.")
    }

    private fun ensureQuantityCapacity(reservation: ReservationEntity) {
        val baseCapacity = baseCapacity(reservation)
        val reservedPartySize = reservationRepository.sumPartySizeByOverlappingRange(
            productId = reservation.reservationProduct.id,
            visitDate = reservation.visitDate,
            startTime = reservation.startTime,
            endTime = reservation.endTime,
            statuses = activeReservationStatuses(),
            excludedReservationId = reservation.id,
        )
        if (reservedPartySize + reservation.partySize > baseCapacity) {
            throw ApiException(ErrorCode.CONFLICT, "예약 가능한 재고가 없습니다.")
        }
    }

    private fun replaceAssignments(
        reservation: ReservationEntity,
        tableIds: List<Long>,
    ) {
        assignmentRepository.deleteByReservationId(reservation.id)
        assignmentRepository.flush()
        val tables = restaurantTableRepository.findByRestaurantIdAndIdIn(reservation.restaurant.id, tableIds)
            .associateBy { it.id }
        assignmentRepository.saveAll(
            tableIds.map { tableId ->
                ReservationTableAssignmentEntity(
                    restaurant = reservation.restaurant,
                    reservation = reservation,
                    restaurantTable = tables[tableId]
                        ?: throw ApiException(ErrorCode.NOT_FOUND, "배정할 테이블을 찾을 수 없습니다."),
                )
            },
        )
    }

    private fun ensureTimeSlotOpen(reservation: ReservationEntity) {
        val slot = timeSlotRepository
            .findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
                reservation.reservationProduct.id,
                reservation.visitDate,
            )
            .firstOrNull { it.startTime == reservation.startTime }
            ?: return
        if (slot.status != TimeSlotStatus.OPEN) {
            throw ApiException(ErrorCode.CONFLICT, "예약 가능한 시간이 아닙니다.")
        }
    }

    private fun baseCapacity(reservation: ReservationEntity): Long {
        val slot = timeSlotRepository
            .findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
                reservation.reservationProduct.id,
                reservation.visitDate,
            )
            .firstOrNull { it.startTime == reservation.startTime }
        return (slot?.capacity ?: reservation.reservationProduct.slotCapacity).toLong()
    }

    private fun lockTables(
        restaurantId: Long,
        tableIds: List<Long>,
    ) {
        val locked = restaurantTableRepository.findByRestaurantIdAndIdInForUpdate(restaurantId, tableIds)
        if (locked.size != tableIds.toSet().size) {
            throw ApiException(ErrorCode.NOT_FOUND, "배정할 테이블을 찾을 수 없습니다.")
        }
    }

    private fun tableCandidates(
        product: ReservationProductEntity,
        partySize: Int,
    ): SeatInventoryCandidates {
        val rule = seatRuleRepository.findByReservationProductId(product.id)
        if (rule?.inventoryPolicy == InventoryPolicy.PRODUCT_QUANTITY) {
            return SeatInventoryCandidates(tableInventoryEnabled = false, plans = emptyList())
        }
        val activeTables = restaurantTableRepository
            .findByRestaurantIdOrderBySortOrderAscIdAsc(product.restaurant.id)
            .filter { it.active }
        if (activeTables.isEmpty()) {
            return SeatInventoryCandidates(tableInventoryEnabled = false, plans = emptyList())
        }
        val eligibleTables = activeTables.eligibleTables(rule)
        val eligibleTableIds = eligibleTables.map { it.id }.toSet()
        val singleTablePlans = eligibleTables
            .filter { partySize in it.minPartySize..it.maxPartySize }
            .map { SeatInventoryPlan(tableIds = listOf(it.id), capacity = it.maxPartySize) }
        val combinationPlans = tableCombinationRepository
            .findByRestaurantIdOrderByIdAsc(product.restaurant.id)
            .filter { it.active }
            .mapNotNull { combination ->
                val tableIds = combination.tableIds().sorted()
                if (!tableIds.all { it in eligibleTableIds }) {
                    return@mapNotNull null
                }
                SeatInventoryPlan(
                    tableIds = tableIds,
                    capacity = combination.maxPartySize,
                    minPartySize = combination.minPartySize,
                )
            }
            .filter { it.tableIds.size >= 2 }
            .filter { partySize in it.minPartySize..it.capacity }
        val plans = (singleTablePlans + combinationPlans)
            .distinctBy { it.tableIds }
            .sortedWith(
                compareBy<SeatInventoryPlan> { it.capacity }
                    .thenBy { it.tableIds.size }
                    .thenBy { it.tableIds.joinToString(",") },
            )
        return SeatInventoryCandidates(tableInventoryEnabled = true, plans = plans)
    }

    private fun List<RestaurantTableEntity>.eligibleTables(
        rule: ReservationProductSeatRuleEntity?,
    ): List<RestaurantTableEntity> {
        if (rule == null) {
            return this
        }
        val allowedTableIds = rule.allowedTableIds()
        if (allowedTableIds.isNotEmpty()) {
            return filter { it.id in allowedTableIds }
        }
        val allowedSeatTypes = rule.allowedSeatTypes()
        if (allowedSeatTypes.isNotEmpty()) {
            return filter { it.seatType in allowedSeatTypes }
        }
        return this
    }

    private fun TableCombinationEntity.tableIds(): List<Long> =
        objectMapper.readValue<List<Long>>(tableIdsJson)

    private fun ReservationProductSeatRuleEntity.allowedSeatTypes(): List<SeatType> =
        allowedSeatTypesJson
            ?.let { objectMapper.readValue<List<String>>(it).map { value -> SeatType.valueOf(value) } }
            .orEmpty()

    private fun ReservationProductSeatRuleEntity.allowedTableIds(): List<Long> =
        allowedTableIdsJson?.let { objectMapper.readValue<List<Long>>(it) }.orEmpty()

    private fun activeReservationStatuses(): List<ReservationStatus> =
        listOf(ReservationStatus.CONFIRMED, ReservationStatus.MODIFIED)
}

data class SeatInventoryAvailability(
    val available: Boolean,
    val remainingCapacity: Int,
)

private data class SeatInventoryCandidates(
    val tableInventoryEnabled: Boolean,
    val plans: List<SeatInventoryPlan>,
)

private data class SeatInventoryPlan(
    val tableIds: List<Long>,
    val capacity: Int,
    val minPartySize: Int = 1,
)
