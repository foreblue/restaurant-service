package com.example.restaurant.availability

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.inventory.InventoryPolicy
import com.example.restaurant.inventory.ReservationProductSeatRuleEntity
import com.example.restaurant.inventory.ReservationProductSeatRuleRepository
import com.example.restaurant.inventory.RestaurantTableEntity
import com.example.restaurant.inventory.RestaurantTableRepository
import com.example.restaurant.inventory.SeatType
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.BusinessHourEntity
import com.example.restaurant.restaurant.BusinessHourRepository
import com.example.restaurant.restaurant.HolidayRuleEntity
import com.example.restaurant.restaurant.HolidayRuleRepository
import com.example.restaurant.restaurant.HolidayRuleType
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeParseException

private const val DEFAULT_DURATION_MINUTES = 90
private const val DEFAULT_SLOT_INTERVAL_MINUTES = 30
private const val MAX_GENERATION_DAYS = 31L

@Service
class BusinessTimeSlotService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val holidayRuleRepository: HolidayRuleRepository,
    private val timeSlotRepository: TimeSlotRepository,
    private val seatRuleRepository: ReservationProductSeatRuleRepository,
    private val restaurantTableRepository: RestaurantTableRepository,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun list(
        principal: BusinessPrincipal,
        productId: Long?,
        dateValue: String,
        seatTypeValue: String?,
    ): BusinessTimeSlotListResponse {
        val restaurant = ownedRestaurant(principal)
        val seatType = seatTypeValue?.trim()?.takeIf { it.isNotBlank() }?.let {
            try {
                SeatType.valueOf(it)
            } catch (exception: IllegalArgumentException) {
                throw ApiException(ErrorCode.VALIDATION_ERROR, "seatType 값이 올바르지 않습니다.", exception)
            }
        }
        val date = dateValue.parseDate("date")
        val products = if (productId == null) {
            reservationProductRepository.findByRestaurantIdAndStatusOrderByCreatedAtDescIdDesc(
                restaurant.id,
                ReservationProductStatus.ACTIVE,
            )
        } else {
            listOf(ownedProduct(restaurant.id, productId))
        }
        val slots = products
            .flatMap { product ->
                timeSlotRepository
                    .findByRestaurantIdAndReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
                        restaurant.id,
                        product.id,
                        date,
                    )
            }
            .map { it.toResponse() }
            .filter { seatType == null || it.seatType == seatType.name }
            .sortedWith(compareBy<BusinessTimeSlotResponse> { it.startTime }.thenBy { it.productId }.thenBy { it.id })

        return BusinessTimeSlotListResponse(
            restaurantId = restaurant.id,
            productId = productId,
            date = date,
            summary = BusinessTimeSlotSummaryResponse(
                totalCount = slots.size,
                availableCount = slots.count { it.status == "AVAILABLE" },
                closedCount = slots.count { it.status == "CLOSED" },
                tempClosedCount = slots.count { it.status == "TEMP_CLOSED" },
                duplicateGuardedCount = slots.count { it.duplicateGuarded },
            ),
            items = slots,
            slots = slots,
        )
    }

    @Transactional
    fun generate(
        principal: BusinessPrincipal,
        request: BusinessTimeSlotGenerateRequest,
        metadata: BusinessTimeSlotRequestMetadata,
    ): BusinessTimeSlotGenerationResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val product = ownedProduct(restaurant.id, request.productId ?: throw ApiException(
            ErrorCode.VALIDATION_ERROR,
            "productId가 필요합니다.",
        ))
        val today = LocalDate.now(clock.withZone(ZoneId.of(restaurant.timezone)))
        val from = request.from.parseDateOrDefault("from", today)
        val to = request.to.parseDateOrDefault("to", from)
        if (to.isBefore(from)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "to는 from보다 빠를 수 없습니다.")
        }
        if (Duration.between(from.atStartOfDay(), to.plusDays(1).atStartOfDay()).toDays() > MAX_GENERATION_DAYS) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "타임슬롯은 한 번에 31일까지만 생성할 수 있습니다.")
        }

        val context = generationContext(restaurant, product)
        val existingByKey = timeSlotRepository
            .findByRestaurantIdAndReservationProductIdAndSlotDateBetweenOrderBySlotDateAscStartTimeAscIdAsc(
                restaurant.id,
                product.id,
                from,
                to,
            )
            .associateBy { SlotKey(it.slotDate, it.startTime) }
        var createdCount = 0
        var updatedCount = 0
        var skippedCount = 0

        val generatedKeys = mutableSetOf<SlotKey>()
        val currentDateSequence = generateSequence(from) { it.plusDays(1) }
            .takeWhile { !it.isAfter(to) }
        currentDateSequence.forEach { date ->
            val candidates = buildCandidates(context, date)
            if (candidates.isEmpty()) {
                skippedCount += 1
            }
            candidates.forEach { candidate ->
                val key = SlotKey(candidate.date, candidate.startTime)
                generatedKeys += key
                val existing = existingByKey[key]
                if (existing == null) {
                    timeSlotRepository.save(
                        TimeSlotEntity(
                            restaurant = restaurant,
                            reservationProduct = product,
                            slotDate = candidate.date,
                            startTime = candidate.startTime,
                            endTime = candidate.endTime,
                            capacity = candidate.capacity,
                            status = TimeSlotStatus.OPEN,
                        ),
                    )
                    createdCount += 1
                } else if (existing.endTime != candidate.endTime || existing.capacity != candidate.capacity) {
                    existing.endTime = candidate.endTime
                    existing.capacity = candidate.capacity
                    updatedCount += 1
                }
            }
        }
        auditLogService.record(
            actorUser = owner,
            actorRole = "OWNER",
            action = "TIME_SLOTS_GENERATED",
            targetType = "reservation_product",
            targetId = product.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "from" to from.toString(),
                    "to" to to.toString(),
                    "createdCount" to createdCount,
                    "updatedCount" to updatedCount,
                    "skippedCount" to skippedCount,
                    "generatedSlotCount" to generatedKeys.size,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
        timeSlotRepository.flush()

        val slots = timeSlotRepository
            .findByRestaurantIdAndReservationProductIdAndSlotDateBetweenOrderBySlotDateAscStartTimeAscIdAsc(
                restaurant.id,
                product.id,
                from,
                to,
            )
            .map { it.toResponse() }
        return BusinessTimeSlotGenerationResponse(
            restaurantId = restaurant.id,
            productId = product.id,
            from = from,
            to = to,
            createdCount = createdCount,
            updatedCount = updatedCount,
            skippedCount = skippedCount,
            slots = slots,
        )
    }

    @Transactional
    fun close(
        principal: BusinessPrincipal,
        request: BusinessTimeSlotStatusChangeRequest,
        metadata: BusinessTimeSlotRequestMetadata,
    ): BusinessTimeSlotResponse =
        updateStatus(principal, request, TimeSlotStatus.BLOCKED, "TIME_SLOT_TEMPORARILY_CLOSED", metadata)

    @Transactional
    fun reopen(
        principal: BusinessPrincipal,
        request: BusinessTimeSlotStatusChangeRequest,
        metadata: BusinessTimeSlotRequestMetadata,
    ): BusinessTimeSlotResponse =
        updateStatus(principal, request, TimeSlotStatus.OPEN, "TIME_SLOT_REOPENED", metadata)

    private fun updateStatus(
        principal: BusinessPrincipal,
        request: BusinessTimeSlotStatusChangeRequest,
        status: TimeSlotStatus,
        action: String,
        metadata: BusinessTimeSlotRequestMetadata,
    ): BusinessTimeSlotResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val slot = ownedSlotForUpdate(restaurant.id, request)
        val before = slot.snapshot()
        slot.status = status
        auditLogService.record(
            actorUser = owner,
            actorRole = "OWNER",
            action = action,
            targetType = "time_slot",
            targetId = slot.id,
            beforeValue = objectMapper.writeValueAsString(before),
            afterValue = objectMapper.writeValueAsString(
                slot.snapshot() + mapOf("reason" to request.reason?.trim()?.takeIf { it.isNotBlank() }),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
        return slot.toResponse()
    }

    private fun generationContext(
        restaurant: RestaurantEntity,
        product: ReservationProductEntity,
    ): TimeSlotGenerationContext {
        val rule = seatRuleRepository.findByReservationProductId(product.id)
        val duration = rule?.defaultDurationMinutes ?: DEFAULT_DURATION_MINUTES
        val interval = rule?.slotIntervalMinutes ?: DEFAULT_SLOT_INTERVAL_MINUTES
        if (duration !in 30..240 || interval !in setOf(30, 60)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "타임슬롯 생성 정책이 올바르지 않습니다.")
        }
        return TimeSlotGenerationContext(
            restaurant = restaurant,
            product = product,
            rule = rule,
            duration = Duration.ofMinutes(duration.toLong()),
            interval = Duration.ofMinutes(interval.toLong()),
            capacity = slotCapacity(restaurant.id, product, rule),
            businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurant.id),
            holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(
                restaurant.id,
            ),
        )
    }

    private fun buildCandidates(
        context: TimeSlotGenerationContext,
        date: LocalDate,
    ): List<TimeSlotCandidate> {
        if (context.capacity < 1 || isFullDayHoliday(date, context.holidayRules)) {
            return emptyList()
        }
        if (date.dayOfWeek !in context.product.availableDays()) {
            return emptyList()
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
            buildCandidatesForWindow(context, date, windowStart, windowEnd)
        }
    }

    private fun buildCandidatesForWindow(
        context: TimeSlotGenerationContext,
        date: LocalDate,
        windowStart: LocalTime,
        windowEnd: LocalTime,
    ): List<TimeSlotCandidate> {
        if (!windowStart.isBefore(windowEnd)) {
            return emptyList()
        }
        val candidates = mutableListOf<TimeSlotCandidate>()
        var current = windowStart
        while (!current.plus(context.duration).isAfter(windowEnd)) {
            val endTime = current.plus(context.duration)
            if (!isTemporaryHolidayOverlap(date, current, endTime, context.holidayRules)) {
                candidates += TimeSlotCandidate(
                    date = date,
                    startTime = current,
                    endTime = endTime,
                    capacity = context.capacity,
                )
            }
            current = current.plus(context.interval)
        }
        return candidates
    }

    private fun slotCapacity(
        restaurantId: Long,
        product: ReservationProductEntity,
        rule: ReservationProductSeatRuleEntity?,
    ): Int {
        if (rule == null || rule.inventoryPolicy == InventoryPolicy.PRODUCT_QUANTITY) {
            return product.slotCapacity
        }
        val activeTables = restaurantTableRepository
            .findByRestaurantIdOrderBySortOrderAscIdAsc(restaurantId)
            .filter { it.active }
        val eligibleTables = activeTables.eligibleTables(rule)
        return eligibleTables.sumOf { it.maxPartySize }
    }

    private fun List<RestaurantTableEntity>.eligibleTables(
        rule: ReservationProductSeatRuleEntity,
    ): List<RestaurantTableEntity> {
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

    private fun ownedSlotForUpdate(
        restaurantId: Long,
        request: BusinessTimeSlotStatusChangeRequest,
    ): TimeSlotEntity {
        val slot = request.timeSlotId?.let { timeSlotRepository.findByIdForUpdate(it) }
            ?: run {
                val productId = request.productId
                    ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "timeSlotId 또는 productId/date/startTime이 필요합니다.")
                val date = request.date.parseDate("date")
                val startTime = request.startTime.parseTime("startTime")
                timeSlotRepository.findOwnedSlotForUpdate(restaurantId, productId, date, startTime)
            }
            ?: throw ApiException(ErrorCode.NOT_FOUND, "타임슬롯을 찾을 수 없습니다.")
        if (slot.restaurant.id != restaurantId) {
            throw ApiException(ErrorCode.NOT_FOUND, "타임슬롯을 찾을 수 없습니다.")
        }
        return slot
    }

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

    private fun ownedRestaurant(principal: BusinessPrincipal): RestaurantEntity =
        restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    private fun ownedProduct(
        restaurantId: Long,
        productId: Long,
    ): ReservationProductEntity {
        val product = reservationProductRepository.findById(productId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.") }
        if (
            product.restaurant.id != restaurantId ||
            product.status != ReservationProductStatus.ACTIVE
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        }
        return product
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

    private fun ReservationProductEntity.availableDays(): List<DayOfWeek> =
        objectMapper.readValue<List<String>>(availableDaysJson)
            .map { DayOfWeek.valueOf(it) }

    private fun ReservationProductSeatRuleEntity.allowedSeatTypes(): List<SeatType> =
        allowedSeatTypesJson
            ?.let { objectMapper.readValue<List<String>>(it).map { value -> SeatType.valueOf(value) } }
            .orEmpty()

    private fun ReservationProductSeatRuleEntity.allowedTableIds(): List<Long> =
        allowedTableIdsJson?.let { objectMapper.readValue<List<Long>>(it) }.orEmpty()

    private fun TimeSlotEntity.toResponse(): BusinessTimeSlotResponse {
        val seatType = representativeSeatType(reservationProduct)
        val displayStatus = status.displayStatus()
        return BusinessTimeSlotResponse(
            id = id.toString(),
            timeSlotId = id,
            restaurantId = restaurant.id,
            productId = reservationProduct.id,
            productName = reservationProduct.name,
            date = slotDate,
            startTime = startTime,
            endTime = endTime,
            seatType = seatType.name,
            seatTypeLabel = seatType.defaultLabel(),
            capacity = capacity,
            reservedCount = 0,
            availableCount = if (status == TimeSlotStatus.OPEN) capacity else 0,
            status = displayStatus,
            rawStatus = status,
            statusLabel = displayStatus.label(),
            statusTone = displayStatus.tone(),
            available = status == TimeSlotStatus.OPEN,
            duplicateGuarded = true,
            customerAvailabilityAffected = true,
            lastUpdatedAt = updatedAt ?: createdAt,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }

    private fun representativeSeatType(product: ReservationProductEntity): SeatType {
        val rule = seatRuleRepository.findByReservationProductId(product.id)
        val seatType = rule?.allowedSeatTypes()?.firstOrNull()
        if (seatType != null) {
            return seatType
        }
        return SeatType.HALL
    }

    private fun SeatType.defaultLabel(): String =
        when (this) {
            SeatType.HALL -> "홀"
            SeatType.ROOM -> "룸"
            SeatType.COUNTER -> "카운터"
            SeatType.BAR -> "바"
            SeatType.TERRACE -> "테라스"
        }

    private fun TimeSlotStatus.displayStatus(): String =
        when (this) {
            TimeSlotStatus.OPEN -> "AVAILABLE"
            TimeSlotStatus.BLOCKED -> "TEMP_CLOSED"
        }

    private fun String.label(): String =
        when (this) {
            "AVAILABLE" -> "예약 가능"
            "TEMP_CLOSED" -> "임시 마감"
            else -> "마감"
        }

    private fun String.tone(): String =
        when (this) {
            "AVAILABLE" -> "success"
            "TEMP_CLOSED" -> "warning"
            else -> "muted"
        }

    private fun TimeSlotEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "restaurantId" to restaurant.id,
            "productId" to reservationProduct.id,
            "date" to slotDate.toString(),
            "startTime" to startTime.toString(),
            "endTime" to endTime.toString(),
            "capacity" to capacity,
            "status" to status.name,
        )

    private fun String?.parseDate(fieldName: String): LocalDate =
        try {
            LocalDate.parse(this?.trim().orEmpty().takeIf { it.isNotBlank() }
                ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}가 필요합니다."))
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }

    private fun String?.parseDateOrDefault(
        fieldName: String,
        defaultValue: LocalDate,
    ): LocalDate =
        if (this.isNullOrBlank()) {
            defaultValue
        } else {
            parseDate(fieldName)
        }

    private fun String?.parseTime(fieldName: String): LocalTime =
        try {
            LocalTime.parse(this?.trim().orEmpty().takeIf { it.isNotBlank() }
                ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}이 필요합니다."))
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
}

private data class TimeSlotGenerationContext(
    val restaurant: RestaurantEntity,
    val product: ReservationProductEntity,
    val rule: ReservationProductSeatRuleEntity?,
    val duration: Duration,
    val interval: Duration,
    val capacity: Int,
    val businessHours: List<BusinessHourEntity>,
    val holidayRules: List<HolidayRuleEntity>,
)

private data class TimeSlotCandidate(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val capacity: Int,
)

private data class SlotKey(
    val date: LocalDate,
    val startTime: LocalTime,
)
