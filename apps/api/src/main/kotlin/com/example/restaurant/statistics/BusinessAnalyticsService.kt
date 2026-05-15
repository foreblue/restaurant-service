package com.example.restaurant.statistics

import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.availability.TimeSlotEntity
import com.example.restaurant.availability.TimeSlotRepository
import com.example.restaurant.availability.TimeSlotStatus
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.payment.PaymentEntity
import com.example.restaurant.payment.PaymentRepository
import com.example.restaurant.payment.PaymentStatus
import com.example.restaurant.payment.PaymentType
import com.example.restaurant.refund.RefundEntity
import com.example.restaurant.refund.RefundRepository
import com.example.restaurant.refund.RefundStatus
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationStatus
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
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import kotlin.math.round

private const val DEFAULT_ANALYTICS_DAYS = 30L
private const val MAX_ANALYTICS_RANGE_DAYS = 366L
private const val RESERVATION_METRIC_BASIS = "VISIT_DATE"
private const val PAYMENT_METRIC_BASIS = "PAID_AT"
private const val REFUND_METRIC_BASIS = "SUCCEEDED_AT"
private const val SETTLEMENT_NOTICE = "운영 참고용 통계이며 정산 자동화 또는 세금 처리 기준 금액이 아닙니다."
private val ANALYTICS_SLOT_INTERVAL: Duration = Duration.ofMinutes(30)
private val REVENUE_PAYMENT_TYPES = setOf(PaymentType.DEPOSIT, PaymentType.PREPAID, PaymentType.GUARANTEE_CHARGE)
private val REVENUE_PAYMENT_STATUSES = setOf(
    PaymentStatus.PAID,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
    PaymentStatus.GUARANTEE_CHARGED,
)
private val CARD_GUARANTEE_COUNT_STATUSES = setOf(
    PaymentStatus.PENDING,
    PaymentStatus.GUARANTEE_REGISTERED,
    PaymentStatus.GUARANTEE_CHARGED,
)
private val RESERVED_SLOT_STATUSES = setOf(
    ReservationStatus.CONFIRMED,
    ReservationStatus.MODIFIED,
    ReservationStatus.COMPLETED,
    ReservationStatus.NO_SHOW,
)

@Service
class BusinessAnalyticsService(
    private val restaurantRepository: RestaurantRepository,
    private val reservationRepository: ReservationRepository,
    private val paymentRepository: PaymentRepository,
    private val refundRepository: RefundRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val holidayRuleRepository: HolidayRuleRepository,
    private val timeSlotRepository: TimeSlotRepository,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun summary(
        principal: BusinessPrincipal,
        restaurantId: Long,
        query: BusinessAnalyticsPeriodQuery,
    ): BusinessAnalyticsSummaryResponse {
        val restaurant = ownedRestaurant(principal, restaurantId)
        val period = query.toPeriod(restaurant)
        val reservations = reservationRepository.findAnalyticsReservations(
            restaurantId = restaurant.id,
            fromDate = period.from,
            toDate = period.to,
        )
        val payments = paymentRepository.findAnalyticsPaidPayments(
            restaurantId = restaurant.id,
            fromPaidAt = period.fromInstant,
            toPaidAtExclusive = period.toInstantExclusive,
        )
        val refunds = refundRepository.findAnalyticsSucceededRefunds(
            restaurantId = restaurant.id,
            fromSucceededAt = period.fromInstant,
            toSucceededAtExclusive = period.toInstantExclusive,
        )

        val reservationMetrics = reservations.toReservationMetrics()
        val paymentMetrics = payments.toPaymentMetrics(refunds)
        return BusinessAnalyticsSummaryResponse(
            restaurantId = restaurant.id,
            period = period.toResponse(),
            reservationMetricBasis = RESERVATION_METRIC_BASIS,
            paymentMetricBasis = PAYMENT_METRIC_BASIS,
            refundMetricBasis = REFUND_METRIC_BASIS,
            generatedAt = Instant.now(clock),
            settlementNotice = SETTLEMENT_NOTICE,
            reservations = reservationMetrics,
            payments = paymentMetrics,
            rates = reservationMetrics.toRateMetrics(),
        )
    }

    @Transactional(readOnly = true)
    fun timeSlots(
        principal: BusinessPrincipal,
        restaurantId: Long,
        query: BusinessAnalyticsTimeSlotQuery,
    ): BusinessAnalyticsTimeSlotResponse {
        val restaurant = ownedRestaurant(principal, restaurantId)
        val date = query.date.parseDate("date") ?: today(restaurant)
        val products = reservationProductRepository.findByRestaurantIdAndStatusAndVisibleTrueOrderByCreatedAtAscIdAsc(
            restaurant.id,
            ReservationProductStatus.ACTIVE,
        )
        val businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurant.id)
        val holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(restaurant.id)
        val reservations = reservationRepository.findAnalyticsReservations(
            restaurantId = restaurant.id,
            fromDate = date,
            toDate = date,
        )
        val slots = mutableMapOf<AnalyticsSlotKey, AnalyticsSlotAccumulator>()

        products.forEach { product ->
            product.analyticsSlots(date, businessHours, holidayRules).forEach { slot ->
                val accumulator = slots.getOrPut(AnalyticsSlotKey(slot.startTime, slot.endTime)) {
                    AnalyticsSlotAccumulator(startTime = slot.startTime, endTime = slot.endTime)
                }
                accumulator.capacity += slot.capacity
            }
        }
        reservations
            .filter { it.status in RESERVED_SLOT_STATUSES }
            .forEach { reservation ->
                val accumulator = slots.getOrPut(AnalyticsSlotKey(reservation.startTime, reservation.endTime)) {
                    AnalyticsSlotAccumulator(startTime = reservation.startTime, endTime = reservation.endTime)
                }
                accumulator.reserved += reservation.partySize
            }

        return BusinessAnalyticsTimeSlotResponse(
            restaurantId = restaurant.id,
            date = date,
            slotMinutes = ANALYTICS_SLOT_INTERVAL.toMinutes(),
            metricBasis = RESERVATION_METRIC_BASIS,
            generatedAt = Instant.now(clock),
            settlementNotice = SETTLEMENT_NOTICE,
            slots = slots.values
                .sortedWith(compareBy<AnalyticsSlotAccumulator> { it.startTime }.thenBy { it.endTime })
                .map { it.toResponse() },
        )
    }

    @Transactional(readOnly = true)
    fun products(
        principal: BusinessPrincipal,
        restaurantId: Long,
        query: BusinessAnalyticsPeriodQuery,
    ): BusinessAnalyticsProductResponse {
        val restaurant = ownedRestaurant(principal, restaurantId)
        val period = query.toPeriod(restaurant)
        val reservations = reservationRepository.findAnalyticsReservations(
            restaurantId = restaurant.id,
            fromDate = period.from,
            toDate = period.to,
        )
        val payments = paymentRepository.findAnalyticsPaidPayments(
            restaurantId = restaurant.id,
            fromPaidAt = period.fromInstant,
            toPaidAtExclusive = period.toInstantExclusive,
        )
        val refunds = refundRepository.findAnalyticsSucceededRefunds(
            restaurantId = restaurant.id,
            fromSucceededAt = period.fromInstant,
            toSucceededAtExclusive = period.toInstantExclusive,
        )
        val productMetrics = mutableMapOf<Long, ProductAnalyticsAccumulator>()

        reservations.forEach { reservation ->
            productMetrics
                .getOrPut(reservation.reservationProduct.id) { ProductAnalyticsAccumulator(reservation.reservationProduct) }
                .addReservation(reservation)
        }
        payments.revenuePayments().forEach { payment ->
            productMetrics
                .getOrPut(payment.reservation.reservationProduct.id) {
                    ProductAnalyticsAccumulator(payment.reservation.reservationProduct)
                }
                .paymentAmount += payment.amount
        }
        refunds.successfulRefunds().forEach { refund ->
            productMetrics
                .getOrPut(refund.reservation.reservationProduct.id) {
                    ProductAnalyticsAccumulator(refund.reservation.reservationProduct)
                }
                .refundAmount += refund.refundAmount
        }

        return BusinessAnalyticsProductResponse(
            restaurantId = restaurant.id,
            period = period.toResponse(),
            reservationMetricBasis = RESERVATION_METRIC_BASIS,
            paymentMetricBasis = PAYMENT_METRIC_BASIS,
            refundMetricBasis = REFUND_METRIC_BASIS,
            generatedAt = Instant.now(clock),
            settlementNotice = SETTLEMENT_NOTICE,
            items = productMetrics.values
                .sortedWith(compareByDescending<ProductAnalyticsAccumulator> { it.reservations }.thenBy { it.name })
                .map { it.toResponse() },
        )
    }

    private fun ownedRestaurant(
        principal: BusinessPrincipal,
        restaurantId: Long,
    ): RestaurantEntity {
        val restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.") }
        if (restaurant.owner.id != principal.userId) {
            throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")
        }
        return restaurant
    }

    private fun BusinessAnalyticsPeriodQuery.toPeriod(restaurant: RestaurantEntity): AnalyticsPeriod {
        val today = today(restaurant)
        val requestedFrom = from.parseDate("from")
        val requestedTo = to.parseDate("to")
        val normalizedTo = requestedTo ?: today
        val normalizedFrom = requestedFrom ?: normalizedTo.minusDays(DEFAULT_ANALYTICS_DAYS - 1)
        if (normalizedFrom.isAfter(normalizedTo)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "from은 to보다 늦을 수 없습니다.")
        }
        if (ChronoUnit.DAYS.between(normalizedFrom, normalizedTo) >= MAX_ANALYTICS_RANGE_DAYS) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "조회 기간은 최대 366일까지 가능합니다.")
        }
        val zone = ZoneId.of(restaurant.timezone)
        return AnalyticsPeriod(
            from = normalizedFrom,
            to = normalizedTo,
            fromInstant = normalizedFrom.atStartOfDay(zone).toInstant(),
            toInstantExclusive = normalizedTo.plusDays(1).atStartOfDay(zone).toInstant(),
        )
    }

    private fun List<ReservationEntity>.toReservationMetrics(): BusinessAnalyticsReservationMetricsResponse {
        val confirmed = count { it.status == ReservationStatus.CONFIRMED }
        val modified = count { it.status == ReservationStatus.MODIFIED }
        val completed = count { it.status == ReservationStatus.COMPLETED }
        val cancelledByCustomer = count { it.status == ReservationStatus.CANCELLED_BY_CUSTOMER }
        val cancelledByRestaurant = count { it.status == ReservationStatus.CANCELLED_BY_RESTAURANT }
        return BusinessAnalyticsReservationMetricsResponse(
            total = size,
            confirmed = confirmed,
            modified = modified,
            completed = completed,
            cancelledByCustomer = cancelledByCustomer,
            cancelledByRestaurant = cancelledByRestaurant,
            cancelled = cancelledByCustomer + cancelledByRestaurant,
            noShow = count { it.status == ReservationStatus.NO_SHOW },
        )
    }

    private fun List<PaymentEntity>.toPaymentMetrics(
        refunds: List<RefundEntity>,
    ): BusinessAnalyticsPaymentMetricsResponse {
        val revenuePayments = revenuePayments()
        val depositAmount = revenuePayments
            .filter { it.paymentType == PaymentType.DEPOSIT }
            .sumOf { it.amount }
        val prepaidAmount = revenuePayments
            .filter { it.paymentType == PaymentType.PREPAID }
            .sumOf { it.amount }
        val guaranteeChargeAmount = revenuePayments
            .filter { it.paymentType == PaymentType.GUARANTEE_CHARGE }
            .sumOf { it.amount }
        val refundAmount = refunds.successfulRefunds().sumOf { it.refundAmount }
        val paymentAmount = depositAmount + prepaidAmount + guaranteeChargeAmount
        return BusinessAnalyticsPaymentMetricsResponse(
            depositAmount = depositAmount,
            prepaidAmount = prepaidAmount,
            guaranteeChargeAmount = guaranteeChargeAmount,
            paymentAmount = paymentAmount,
            refundAmount = refundAmount,
            netAmount = paymentAmount - refundAmount,
            cardGuaranteeCount = count {
                it.paymentType == PaymentType.CARD_GUARANTEE && it.status in CARD_GUARANTEE_COUNT_STATUSES
            },
            refundCount = refunds.successfulRefunds().size,
        )
    }

    private fun BusinessAnalyticsReservationMetricsResponse.toRateMetrics(): BusinessAnalyticsRateMetricsResponse =
        BusinessAnalyticsRateMetricsResponse(
            completionRate = ratio(completed, confirmed + modified + completed + noShow),
            cancellationRate = ratio(cancelled, total),
            noShowRate = ratio(noShow, confirmed + modified + completed + noShow),
        )

    private fun List<PaymentEntity>.revenuePayments(): List<PaymentEntity> =
        filter { it.paymentType in REVENUE_PAYMENT_TYPES && it.status in REVENUE_PAYMENT_STATUSES && it.paidAt != null }

    private fun List<RefundEntity>.successfulRefunds(): List<RefundEntity> =
        filter { it.status == RefundStatus.SUCCEEDED && it.succeededAt != null }

    private fun ReservationProductEntity.analyticsSlots(
        date: LocalDate,
        businessHours: List<BusinessHourEntity>,
        holidayRules: List<HolidayRuleEntity>,
    ): List<AnalyticsSlotCapacity> {
        if (date.dayOfWeek !in availableDays() || isFullDayHoliday(date, holidayRules)) {
            return emptyList()
        }
        val manualSlots = timeSlotRepository.findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(id, date)
        if (manualSlots.isNotEmpty()) {
            return manualSlots
                .filter { it.inProductTimeRange(this) }
                .filter { !isTemporaryHolidayOverlap(date, it.startTime, it.endTime, holidayRules) }
                .map { it.toAnalyticsSlotCapacity() }
        }
        return businessHours
            .filter { it.dayOfWeek == date.dayOfWeek }
            .filter { !it.closed && it.opensAt != null && it.closesAt != null && it.opensAt.isBefore(it.closesAt) }
            .sortedBy { it.sequence }
            .flatMap { hour ->
                val windowStart = maxOf(hour.opensAt!!, availableStartTime ?: hour.opensAt!!)
                val windowEnd = minOf(hour.closesAt!!, availableEndTime ?: hour.closesAt!!)
                buildDynamicSlots(date, windowStart, windowEnd, holidayRules)
            }
    }

    private fun ReservationProductEntity.buildDynamicSlots(
        date: LocalDate,
        windowStart: LocalTime,
        windowEnd: LocalTime,
        holidayRules: List<HolidayRuleEntity>,
    ): List<AnalyticsSlotCapacity> {
        if (!windowStart.isBefore(windowEnd)) {
            return emptyList()
        }
        val slots = mutableListOf<AnalyticsSlotCapacity>()
        var current = windowStart
        while (!current.plus(ANALYTICS_SLOT_INTERVAL).isAfter(windowEnd)) {
            val endTime = current.plus(ANALYTICS_SLOT_INTERVAL)
            if (!isTemporaryHolidayOverlap(date, current, endTime, holidayRules)) {
                slots += AnalyticsSlotCapacity(
                    startTime = current,
                    endTime = endTime,
                    capacity = slotCapacity,
                )
            }
            current = current.plus(ANALYTICS_SLOT_INTERVAL)
        }
        return slots
    }

    private fun TimeSlotEntity.toAnalyticsSlotCapacity(): AnalyticsSlotCapacity =
        AnalyticsSlotCapacity(
            startTime = startTime,
            endTime = endTime,
            capacity = if (status == TimeSlotStatus.OPEN) capacity else 0,
        )

    private fun TimeSlotEntity.inProductTimeRange(product: ReservationProductEntity): Boolean {
        val start = product.availableStartTime
        val end = product.availableEndTime
        if (start == null || end == null) {
            return true
        }
        return !startTime.isBefore(start) && !endTime.isAfter(end)
    }

    private fun ReservationProductEntity.availableDays(): List<java.time.DayOfWeek> =
        objectMapper.readValue<List<String>>(availableDaysJson)
            .map { java.time.DayOfWeek.valueOf(it) }

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
            LocalDate.parse(trim())
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun AnalyticsPeriod.toResponse(): BusinessAnalyticsPeriodResponse =
        BusinessAnalyticsPeriodResponse(from = from, to = to)

    private fun AnalyticsSlotAccumulator.toResponse(): BusinessAnalyticsTimeSlotItemResponse =
        BusinessAnalyticsTimeSlotItemResponse(
            startTime = startTime,
            endTime = endTime,
            capacity = capacity,
            reserved = reserved,
            reservationRate = ratio(reserved, capacity),
        )

    private fun ratio(
        numerator: Int,
        denominator: Int,
    ): Double =
        if (denominator <= 0) {
            0.0
        } else {
            round((numerator.toDouble() / denominator.toDouble()) * 10_000.0) / 10_000.0
        }
}

private data class AnalyticsPeriod(
    val from: LocalDate,
    val to: LocalDate,
    val fromInstant: Instant,
    val toInstantExclusive: Instant,
)

private data class AnalyticsSlotKey(
    val startTime: LocalTime,
    val endTime: LocalTime,
)

private data class AnalyticsSlotCapacity(
    val startTime: LocalTime,
    val endTime: LocalTime,
    val capacity: Int,
)

private data class AnalyticsSlotAccumulator(
    val startTime: LocalTime,
    val endTime: LocalTime,
    var capacity: Int = 0,
    var reserved: Int = 0,
)

private class ProductAnalyticsAccumulator(
    product: ReservationProductEntity,
) {
    val reservationProductId: Long = product.id
    val name: String = product.name
    var reservations: Int = 0
    var completed: Int = 0
    var cancelled: Int = 0
    var noShow: Int = 0
    var partySizeTotal: Int = 0
    var paymentAmount: Long = 0
    var refundAmount: Long = 0

    fun addReservation(reservation: ReservationEntity) {
        reservations += 1
        partySizeTotal += reservation.partySize
        when (reservation.status) {
            ReservationStatus.COMPLETED -> completed += 1
            ReservationStatus.CANCELLED_BY_CUSTOMER,
            ReservationStatus.CANCELLED_BY_RESTAURANT,
            -> cancelled += 1
            ReservationStatus.NO_SHOW -> noShow += 1
            ReservationStatus.CONFIRMED,
            ReservationStatus.MODIFIED,
            -> Unit
        }
    }

    fun toResponse(): BusinessAnalyticsProductItemResponse =
        BusinessAnalyticsProductItemResponse(
            reservationProductId = reservationProductId,
            name = name,
            reservations = reservations,
            completed = completed,
            cancelled = cancelled,
            noShow = noShow,
            paymentAmount = paymentAmount,
            refundAmount = refundAmount,
            netAmount = paymentAmount - refundAmount,
            averagePartySize = if (reservations == 0) {
                0.0
            } else {
                round((partySizeTotal.toDouble() / reservations.toDouble()) * 100.0) / 100.0
            },
        )
}
