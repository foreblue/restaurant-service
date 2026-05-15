package com.example.restaurant.reservation

import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.restaurant.BusinessHourRepository
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Locale

private const val MAX_RESERVATION_QUERY_DAYS = 93L
private const val BUSINESS_RESERVATION_SOURCE = "ONLINE"
private const val BUSINESS_RESERVATION_PAYMENT_STATUS = "NOT_REQUIRED"

@Service
class BusinessReservationService(
    private val restaurantRepository: RestaurantRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val reservationRepository: ReservationRepository,
    private val clock: Clock,
) {
    @Transactional(readOnly = true)
    fun list(
        principal: BusinessPrincipal,
        query: BusinessReservationListQuery,
    ): BusinessReservationListResponse {
        val restaurant = ownedRestaurant(principal)
        val criteria = query.toCriteria(restaurant, includeCancelledDefault = false)
        val items = reservationRepository
            .findBusinessReservations(restaurant.id, criteria.range.from, criteria.range.to)
            .filter { it.matches(criteria) }
        return BusinessReservationListResponse(
            date = criteria.range.date,
            from = criteria.range.from,
            to = criteria.range.to,
            summary = items.toSummary(),
            items = items.map { it.toListItem() },
        )
    }

    @Transactional(readOnly = true)
    fun calendar(
        principal: BusinessPrincipal,
        query: BusinessReservationCalendarQuery,
    ): BusinessReservationCalendarResponse {
        val restaurant = ownedRestaurant(principal)
        val criteria = query.toCriteria(restaurant, includeCancelledDefault = true)
        val reservationsByDate = reservationRepository
            .findBusinessReservations(restaurant.id, criteria.range.from, criteria.range.to)
            .filter { it.matches(criteria) }
            .groupBy { it.visitDate }
        val openDays = businessHourRepository
            .findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(restaurant.id)
            .filter { !it.closed && it.opensAt != null && it.closesAt != null && it.opensAt.isBefore(it.closesAt) }
            .map { it.dayOfWeek }
            .toSet()

        return BusinessReservationCalendarResponse(
            from = criteria.range.from,
            to = criteria.range.to,
            days = criteria.range.dates().map { date ->
                val reservations = reservationsByDate[date].orEmpty()
                BusinessReservationCalendarDayResponse(
                    date = date,
                    isOpen = date.dayOfWeek in openDays,
                    reservationCount = reservations.size,
                    partySizeTotal = reservations.sumOf { it.partySize },
                    confirmedCount = reservations.count { it.status == ReservationStatus.CONFIRMED },
                    modifiedCount = 0,
                    completedCount = reservations.count { it.status == ReservationStatus.COMPLETED },
                    cancelledCount = reservations.count { it.status.isCancelled() },
                    noShowCount = reservations.count { it.status == ReservationStatus.NO_SHOW },
                )
            },
        )
    }

    @Transactional(readOnly = true)
    fun detail(
        principal: BusinessPrincipal,
        reservationId: Long,
    ): BusinessReservationDetailResponse {
        val restaurant = ownedRestaurant(principal)
        val reservation = reservationRepository.findBusinessReservationById(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        if (reservation.restaurant.id != restaurant.id) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        }
        return reservation.toDetail()
    }

    private fun ownedRestaurant(principal: BusinessPrincipal): RestaurantEntity =
        restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    private fun BusinessReservationListQuery.toCriteria(
        restaurant: RestaurantEntity,
        includeCancelledDefault: Boolean,
    ): BusinessReservationSearchCriteria =
        BusinessReservationSearchCriteria(
            range = dateRange(restaurant, date = date, from = from, to = to),
            statuses = status.parseStatuses(),
            productId = productId.normalizedProductId(),
            startTime = startTime.parseOptionalTime("startTime"),
            endTime = endTime.parseOptionalTime("endTime"),
            query = query?.trim()?.takeIf { it.isNotBlank() },
            includeCancelled = includeCancelled ?: includeCancelledDefault,
        ).validated()

    private fun BusinessReservationCalendarQuery.toCriteria(
        restaurant: RestaurantEntity,
        includeCancelledDefault: Boolean,
    ): BusinessReservationSearchCriteria =
        BusinessReservationSearchCriteria(
            range = dateRange(restaurant, date = null, from = from, to = to),
            statuses = status.parseStatuses(),
            productId = productId.normalizedProductId(),
            startTime = startTime.parseOptionalTime("startTime"),
            endTime = endTime.parseOptionalTime("endTime"),
            query = null,
            includeCancelled = includeCancelledDefault,
        ).validated()

    private fun BusinessReservationSearchCriteria.validated(): BusinessReservationSearchCriteria {
        if (endTime != null && startTime != null && !startTime.isBefore(endTime)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "startTime은 endTime보다 빨라야 합니다.")
        }
        return this
    }

    private fun Long?.normalizedProductId(): Long? {
        if (this == null) {
            return null
        }
        if (this < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "productId가 올바르지 않습니다.")
        }
        return this
    }

    private fun String?.parseStatuses(): Set<ReservationStatus>? {
        val values = this?.split(",")
            ?.map { it.trim() }
            ?.filter { it.isNotBlank() }
            .orEmpty()
        if (values.isEmpty()) {
            return null
        }
        return values.map { value ->
            try {
                ReservationStatus.valueOf(value.replace('-', '_').uppercase(Locale.ROOT))
            } catch (exception: IllegalArgumentException) {
                throw ApiException(ErrorCode.VALIDATION_ERROR, "status 값이 올바르지 않습니다.", exception)
            }
        }.toSet()
    }

    private fun String?.parseOptionalDate(fieldName: String): LocalDate? {
        val value = this?.trim()?.takeIf { it.isNotBlank() } ?: return null
        return try {
            LocalDate.parse(value)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun String?.parseOptionalTime(fieldName: String): LocalTime? {
        val value = this?.trim()?.takeIf { it.isNotBlank() } ?: return null
        return try {
            LocalTime.parse(value)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun dateRange(
        restaurant: RestaurantEntity,
        date: String?,
        from: String?,
        to: String?,
    ): ReservationDateRange {
        val parsedDate = date.parseOptionalDate("date")
        if (parsedDate != null) {
            return ReservationDateRange(date = parsedDate, from = parsedDate, to = parsedDate).validated()
        }
        val parsedFrom = from.parseOptionalDate("from")
        val parsedTo = to.parseOptionalDate("to")
        val today = LocalDate.now(clock.withZone(ZoneId.of(restaurant.timezone)))
        val normalizedFrom = parsedFrom ?: parsedTo ?: today
        val normalizedTo = parsedTo ?: normalizedFrom
        return ReservationDateRange(date = null, from = normalizedFrom, to = normalizedTo).validated()
    }

    private fun ReservationDateRange.validated(): ReservationDateRange {
        if (to.isBefore(from)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "to는 from보다 빠를 수 없습니다.")
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RESERVATION_QUERY_DAYS) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "조회 기간은 93일 이하여야 합니다.")
        }
        return this
    }

    private fun ReservationEntity.matches(criteria: BusinessReservationSearchCriteria): Boolean {
        if (criteria.statuses == null && !criteria.includeCancelled && status.isCancelled()) {
            return false
        }
        if (criteria.statuses != null && status !in criteria.statuses) {
            return false
        }
        if (criteria.productId != null && reservationProduct.id != criteria.productId) {
            return false
        }
        if (criteria.startTime != null && startTime.isBefore(criteria.startTime)) {
            return false
        }
        if (criteria.endTime != null && !startTime.isBefore(criteria.endTime)) {
            return false
        }
        if (!matchesQuery(criteria.query)) {
            return false
        }
        return true
    }

    private fun ReservationEntity.matchesQuery(query: String?): Boolean {
        if (query == null) {
            return true
        }
        val digits = query.filter { it.isDigit() }
        return reservationNumber.contains(query, ignoreCase = true) ||
            customer.name.contains(query, ignoreCase = true) ||
            (digits.isNotBlank() && customer.phoneNumber.contains(digits))
    }

    private fun List<ReservationEntity>.toSummary(): BusinessReservationSummaryResponse =
        BusinessReservationSummaryResponse(
            totalReservations = size,
            totalPartySize = sumOf { it.partySize },
            confirmedCount = count { it.status == ReservationStatus.CONFIRMED },
            modifiedCount = 0,
            completedCount = count { it.status == ReservationStatus.COMPLETED },
            cancelledCount = count { it.status.isCancelled() },
            noShowCount = count { it.status == ReservationStatus.NO_SHOW },
        )

    private fun ReservationEntity.toListItem(): BusinessReservationListItemResponse {
        val statusPresentation = status.presentation()
        return BusinessReservationListItemResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            statusLabel = statusPresentation.label,
            statusTone = statusPresentation.tone,
            source = BUSINESS_RESERVATION_SOURCE,
            reservedStartAt = reservedInstant(startTime),
            reservedEndAt = reservedInstant(endTime),
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            productId = reservationProduct.id,
            productName = reservationProduct.name,
            customer = BusinessReservationCustomerSummaryResponse(
                id = customer.id,
                name = customer.name,
                phoneMasked = customer.phoneNumber.maskedPhone(),
            ),
            hasCustomerRequest = !customerRequest.isNullOrBlank(),
            hasOwnerNote = false,
            paymentStatus = BUSINESS_RESERVATION_PAYMENT_STATUS,
            paymentActionRequired = false,
        )
    }

    private fun ReservationEntity.toDetail(): BusinessReservationDetailResponse {
        val statusPresentation = status.presentation()
        return BusinessReservationDetailResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            statusLabel = statusPresentation.label,
            statusTone = statusPresentation.tone,
            source = BUSINESS_RESERVATION_SOURCE,
            reservedStartAt = reservedInstant(startTime),
            reservedEndAt = reservedInstant(endTime),
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            product = BusinessReservationProductSummaryResponse(
                id = reservationProduct.id,
                name = reservationProduct.name,
            ),
            customer = BusinessReservationCustomerDetailResponse(
                id = customer.id,
                name = customer.name,
                phoneNumber = customer.phoneNumber,
                visitCount = reservationRepository.countByCustomerId(customer.id),
                noShowCount = reservationRepository.countByCustomerIdAndStatus(customer.id, ReservationStatus.NO_SHOW),
            ),
            customerRequest = customerRequest,
            ownerNote = null,
            paymentStatus = BUSINESS_RESERVATION_PAYMENT_STATUS,
            paymentActionRequired = false,
            cancelledAt = cancelledAt,
            cancelReason = cancelReason,
            auditLogs = emptyList(),
        )
    }

    private fun ReservationEntity.reservedInstant(time: LocalTime): Instant =
        ZonedDateTime.of(visitDate, time, ZoneId.of(restaurant.timezone)).toInstant()

    private fun String.maskedPhone(): String =
        when {
            length >= 11 -> "${take(3)}-****-${takeLast(4)}"
            length >= 8 -> "****${takeLast(4)}"
            else -> "****"
        }

    private fun ReservationStatus.presentation(): ReservationStatusPresentation =
        when (this) {
            ReservationStatus.CONFIRMED -> ReservationStatusPresentation("확정", "success")
            ReservationStatus.CANCELLED_BY_CUSTOMER -> ReservationStatusPresentation("고객 취소", "neutral")
            ReservationStatus.CANCELLED_BY_RESTAURANT -> ReservationStatusPresentation("매장 취소", "warning")
            ReservationStatus.COMPLETED -> ReservationStatusPresentation("방문 완료", "success")
            ReservationStatus.NO_SHOW -> ReservationStatusPresentation("노쇼", "danger")
        }

    private fun ReservationStatus.isCancelled(): Boolean =
        this == ReservationStatus.CANCELLED_BY_CUSTOMER || this == ReservationStatus.CANCELLED_BY_RESTAURANT

    private fun ReservationDateRange.dates(): List<LocalDate> =
        generateSequence(from) { previous ->
            previous.plusDays(1).takeIf { !it.isAfter(to) }
        }.toList()
}

data class BusinessReservationListQuery(
    val date: String?,
    val from: String?,
    val to: String?,
    val status: String?,
    val productId: Long?,
    val startTime: String?,
    val endTime: String?,
    val query: String?,
    val includeCancelled: Boolean?,
)

data class BusinessReservationCalendarQuery(
    val from: String?,
    val to: String?,
    val status: String?,
    val productId: Long?,
    val startTime: String?,
    val endTime: String?,
)

private data class BusinessReservationSearchCriteria(
    val range: ReservationDateRange,
    val statuses: Set<ReservationStatus>?,
    val productId: Long?,
    val startTime: LocalTime?,
    val endTime: LocalTime?,
    val query: String?,
    val includeCancelled: Boolean,
)

private data class ReservationDateRange(
    val date: LocalDate?,
    val from: LocalDate,
    val to: LocalDate,
)

private data class ReservationStatusPresentation(
    val label: String,
    val tone: String,
)
