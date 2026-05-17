package com.example.restaurant.availability

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.inventory.SeatInventoryService
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.BusinessHourEntity
import com.example.restaurant.restaurant.BusinessHourRepository
import com.example.restaurant.restaurant.HolidayRuleEntity
import com.example.restaurant.restaurant.HolidayRuleRepository
import com.example.restaurant.restaurant.HolidayRuleType
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.example.restaurant.restaurant.RestaurantStatus
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeParseException

private const val OPEN_DAYS_AHEAD = 30L
private val RESERVATION_CUTOFF = Duration.ofMinutes(120)
private val SLOT_INTERVAL = Duration.ofMinutes(30)

@Service
class AvailabilityService(
    private val restaurantRepository: RestaurantRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val holidayRuleRepository: HolidayRuleRepository,
    private val timeSlotRepository: TimeSlotRepository,
    private val seatInventoryService: SeatInventoryService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun availableDates(
        restaurantId: Long,
        productId: Long,
        fromValue: String?,
        toValue: String?,
        partySizeValue: Int?,
    ): AvailabilityDatesResponse {
        val context = publicAvailabilityContext(restaurantId, productId, partySizeValue)
        val today = today(context.restaurant)
        val maxOpenDate = today.plusDays(OPEN_DAYS_AHEAD)
        val from = fromValue.parseDate("from") ?: today
        val requestedTo = toValue.parseDate("to") ?: from.plusDays(OPEN_DAYS_AHEAD)
        if (requestedTo.isBefore(from)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "조회 종료일은 시작일보다 빠를 수 없습니다.")
        }
        val to = minOf(requestedTo, maxOpenDate)
        val dates = generateSequence(from) { it.plusDays(1) }
            .takeWhile { !it.isAfter(to) }
            .filter { it >= today }
            .filter { date -> availableTimeSlots(context, date).any { it.available } }
            .map { AvailableDateResponse(date = it) }
            .toList()

        return AvailabilityDatesResponse(
            restaurantId = restaurantId,
            productId = productId,
            from = from,
            to = to,
            dates = dates,
        )
    }

    @Transactional(readOnly = true)
    fun availableTimes(
        restaurantId: Long,
        productId: Long,
        dateValue: String,
        partySizeValue: Int?,
        applyInventory: Boolean = true,
    ): AvailabilityTimesResponse {
        val context = publicAvailabilityContext(restaurantId, productId, partySizeValue)
        val date = dateValue.parseDate("date")
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "date가 필요합니다.")
        val today = today(context.restaurant)
        if (date.isBefore(today) || date.isAfter(today.plusDays(OPEN_DAYS_AHEAD))) {
            return AvailabilityTimesResponse(restaurantId, productId, date, emptyList())
        }

        return AvailabilityTimesResponse(
            restaurantId = restaurantId,
            productId = productId,
            date = date,
            times = availableTimeSlots(context, date, applyInventory = applyInventory),
        )
    }

    @Transactional(readOnly = true)
    fun businessAvailableTimes(
        restaurantId: Long,
        productId: Long,
        dateValue: String,
        partySizeValue: Int?,
        excludedReservationId: Long? = null,
        applyInventory: Boolean = true,
    ): AvailabilityTimesResponse {
        val context = businessAvailabilityContext(restaurantId, productId, partySizeValue)
        val date = dateValue.parseDate("date")
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "date가 필요합니다.")
        val today = today(context.restaurant)
        if (date.isBefore(today) || date.isAfter(today.plusDays(OPEN_DAYS_AHEAD))) {
            return AvailabilityTimesResponse(restaurantId, productId, date, emptyList())
        }

        return AvailabilityTimesResponse(
            restaurantId = restaurantId,
            productId = productId,
            date = date,
            times = availableTimeSlots(context, date, excludedReservationId, applyInventory),
        )
    }

    private fun publicAvailabilityContext(
        restaurantId: Long,
        productId: Long,
        partySizeValue: Int?,
    ): AvailabilityContext {
        val restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.") }
        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.")
        val product = reservationProductRepository.findById(productId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.") }
        if (
            restaurant.status != RestaurantStatus.APPROVED ||
            page.status != ReservationPageStatus.PUBLIC ||
            product.restaurant.id != restaurant.id ||
            product.status != ReservationProductStatus.ACTIVE ||
            !product.visible
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.")
        }
        val partySize = partySizeValue ?: product.minPartySize
        if (partySize < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize는 1 이상이어야 합니다.")
        }

        return AvailabilityContext(
            restaurant = restaurant,
            product = product,
            partySize = partySize,
            businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurant.id),
            holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(
                restaurant.id,
            ),
        )
    }

    private fun businessAvailabilityContext(
        restaurantId: Long,
        productId: Long,
        partySizeValue: Int?,
    ): AvailabilityContext {
        val restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.") }
        val product = reservationProductRepository.findById(productId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.") }
        if (
            restaurant.status != RestaurantStatus.APPROVED ||
            product.restaurant.id != restaurant.id ||
            product.status != ReservationProductStatus.ACTIVE
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 가능 정보를 찾을 수 없습니다.")
        }
        val partySize = partySizeValue ?: product.minPartySize
        if (partySize < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize는 1 이상이어야 합니다.")
        }

        return AvailabilityContext(
            restaurant = restaurant,
            product = product,
            partySize = partySize,
            businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurant.id),
            holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(
                restaurant.id,
            ),
        )
    }

    private fun availableTimeSlots(
        context: AvailabilityContext,
        date: LocalDate,
        excludedReservationId: Long? = null,
        applyInventory: Boolean = true,
    ): List<AvailableTimeSlotResponse> {
        if (!context.product.acceptsPartySize(context.partySize)) {
            return emptyList()
        }
        if (isFullDayHoliday(date, context.holidayRules)) {
            return emptyList()
        }
        val productDays = context.product.availableDays()
        if (date.dayOfWeek !in productDays) {
            return emptyList()
        }
        val manualSlots = timeSlotRepository.findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
            context.product.id,
            date,
        )
        if (manualSlots.isNotEmpty()) {
            return manualSlots
                .filter { it.inProductTimeRange(context.product) }
                .filter { !isTemporaryHolidayOverlap(date, it.startTime, it.endTime, context.holidayRules) }
                .filter { passesCutoff(context.restaurant, date, it.startTime) }
                .map {
                    if (it.status != TimeSlotStatus.OPEN) {
                        return@map AvailableTimeSlotResponse(
                            timeSlotId = "slot-${it.id}",
                            startTime = it.startTime,
                            endTime = it.endTime,
                            remainingCapacity = 0,
                            available = false,
                            unavailableReason = "BLOCKED",
                        )
                    }
                    val remainingCapacity = if (applyInventory) {
                        val inventory = seatInventoryService.availability(
                            product = context.product,
                            visitDate = date,
                            startTime = it.startTime,
                            endTime = it.endTime,
                            partySize = context.partySize,
                            baseCapacity = it.capacity,
                            excludedReservationId = excludedReservationId,
                        )
                        if (!inventory.available) {
                            return@map AvailableTimeSlotResponse(
                                timeSlotId = "slot-${it.id}",
                                startTime = it.startTime,
                                endTime = it.endTime,
                                remainingCapacity = inventory.remainingCapacity,
                                available = false,
                                unavailableReason = "FULL",
                            )
                        }
                        inventory.remainingCapacity
                    } else {
                        it.capacity
                    }
                    AvailableTimeSlotResponse(
                        timeSlotId = "slot-${it.id}",
                        startTime = it.startTime,
                        endTime = it.endTime,
                        remainingCapacity = remainingCapacity,
                    )
                }
        }

        val hours = context.businessHours
            .filter { it.dayOfWeek == date.dayOfWeek }
            .sortedBy { it.sequence }
        if (hours.isEmpty() || hours.any { it.closed }) {
            return emptyList()
        }

        return hours.flatMap { hour ->
            val opensAt = hour.opensAt ?: return@flatMap emptyList()
            val closesAt = hour.closesAt ?: return@flatMap emptyList()
            val windowStart = maxOf(opensAt, context.product.availableStartTime ?: opensAt)
            val windowEnd = minOf(closesAt, context.product.availableEndTime ?: closesAt)
            buildSlotsForWindow(context, date, windowStart, windowEnd, excludedReservationId, applyInventory)
        }
    }

    private fun buildSlotsForWindow(
        context: AvailabilityContext,
        date: LocalDate,
        windowStart: LocalTime,
        windowEnd: LocalTime,
        excludedReservationId: Long?,
        applyInventory: Boolean,
    ): List<AvailableTimeSlotResponse> {
        if (!windowStart.isBefore(windowEnd)) {
            return emptyList()
        }
        val slots = mutableListOf<AvailableTimeSlotResponse>()
        var current = windowStart
        while (!current.plus(SLOT_INTERVAL).isAfter(windowEnd)) {
            val endTime = current.plus(SLOT_INTERVAL)
            if (
                passesCutoff(context.restaurant, date, current) &&
                !isTemporaryHolidayOverlap(date, current, endTime, context.holidayRules)
            ) {
                val slot = if (applyInventory) {
                    val inventory = seatInventoryService.availability(
                        product = context.product,
                        visitDate = date,
                        startTime = current,
                        endTime = endTime,
                        partySize = context.partySize,
                        baseCapacity = context.product.slotCapacity,
                        excludedReservationId = excludedReservationId,
                    )
                    AvailableTimeSlotResponse(
                        timeSlotId = "dyn-${context.product.id}-${date}-${current.toSecondOfDay()}",
                        startTime = current,
                        endTime = endTime,
                        remainingCapacity = inventory.remainingCapacity,
                        available = inventory.available,
                        unavailableReason = if (inventory.available) null else "FULL",
                    )
                } else {
                    AvailableTimeSlotResponse(
                        timeSlotId = "dyn-${context.product.id}-${date}-${current.toSecondOfDay()}",
                        startTime = current,
                        endTime = endTime,
                        remainingCapacity = context.product.slotCapacity,
                    )
                }
                slots += slot
            }
            current = current.plus(SLOT_INTERVAL)
        }
        return slots
    }

    private fun TimeSlotEntity.inProductTimeRange(product: ReservationProductEntity): Boolean {
        val start = product.availableStartTime
        val end = product.availableEndTime
        if (start == null || end == null) {
            return true
        }
        return !startTime.isBefore(start) && !endTime.isAfter(end)
    }

    private fun passesCutoff(
        restaurant: RestaurantEntity,
        date: LocalDate,
        startTime: LocalTime,
    ): Boolean {
        val zone = ZoneId.of(restaurant.timezone)
        val cutoffDateTime = LocalDateTime.now(clock.withZone(zone)).plus(RESERVATION_CUTOFF)
        return !date.atTime(startTime).isBefore(cutoffDateTime)
    }

    private fun isFullDayHoliday(
        date: LocalDate,
        rules: List<HolidayRuleEntity>,
    ): Boolean =
        rules.any { rule ->
            when (rule.type) {
                HolidayRuleType.WEEKLY -> rule.dayOfWeek == date.dayOfWeek
                HolidayRuleType.MONTHLY_DATE -> rule.dayOfMonth == date.dayOfMonth
                HolidayRuleType.MONTHLY_NTH_WEEKDAY ->
                    rule.dayOfWeek == date.dayOfWeek && rule.weekOfMonth == nthWeekOfMonth(date)
                HolidayRuleType.TEMPORARY_DATE -> rule.date == date
                HolidayRuleType.TEMPORARY_TIME -> false
            }
        }

    private fun isTemporaryHolidayOverlap(
        date: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime,
        rules: List<HolidayRuleEntity>,
    ): Boolean =
        rules.any { rule ->
            rule.type == HolidayRuleType.TEMPORARY_TIME &&
                rule.date == date &&
                rule.startTime != null &&
                rule.endTime != null &&
                startTime.isBefore(rule.endTime) &&
                rule.startTime.isBefore(endTime)
        }

    private fun nthWeekOfMonth(date: LocalDate): Int =
        ((date.dayOfMonth - 1) / 7) + 1

    private fun today(restaurant: RestaurantEntity): LocalDate =
        LocalDate.now(clock.withZone(ZoneId.of(restaurant.timezone)))

    private fun String?.parseDate(fieldName: String): LocalDate? {
        if (this.isNullOrBlank()) {
            return null
        }
        return try {
            LocalDate.parse(this)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun ReservationProductEntity.availableDays(): List<DayOfWeek> =
        objectMapper.readValue<List<String>>(availableDaysJson)
            .map { DayOfWeek.valueOf(it) }

    private fun ReservationProductEntity.acceptsPartySize(partySize: Int): Boolean =
        partySize in minPartySize..maxPartySize
}

private data class AvailabilityContext(
    val restaurant: RestaurantEntity,
    val product: ReservationProductEntity,
    val partySize: Int,
    val businessHours: List<BusinessHourEntity>,
    val holidayRules: List<HolidayRuleEntity>,
)
