package com.example.restaurant.reservation

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.audit.AuditLogRepository
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.availability.AvailabilityService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.notification.NotificationService
import com.example.restaurant.payment.PaymentRepository
import com.example.restaurant.refund.RefundOperationResponse
import com.example.restaurant.refund.RefundPreviewResponse
import com.example.restaurant.refund.RefundRepository
import com.example.restaurant.refund.RefundService
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.BusinessHourRepository
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID

private const val MAX_RESERVATION_QUERY_DAYS = 93L
private const val MAX_MANUAL_CUSTOMER_NAME_LENGTH = 80
private const val MAX_MANUAL_CUSTOMER_REQUEST_LENGTH = 500
private const val MAX_OWNER_NOTE_LENGTH = 1000
@Service
class BusinessReservationService(
    private val availabilityService: AvailabilityService,
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val customerRepository: CustomerRepository,
    private val reservationRepository: ReservationRepository,
    private val auditLogService: AuditLogService,
    private val auditLogRepository: AuditLogRepository,
    private val paymentRepository: PaymentRepository,
    private val refundRepository: RefundRepository,
    private val refundService: RefundService,
    private val notificationService: NotificationService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun createManual(
        principal: BusinessPrincipal,
        request: BusinessManualReservationCreateRequest,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalized()
        val availableSlot = availabilityService.businessAvailableTimes(
            restaurantId = restaurant.id,
            productId = normalized.productId,
            dateValue = normalized.visitDate.toString(),
            partySizeValue = normalized.partySize,
        ).times.firstOrNull { it.startTime == normalized.startTime && it.available }
            ?: throw ApiException(ErrorCode.CONFLICT, "예약 가능한 시간이 아닙니다.")

        val product = reservationProductRepository.findByIdForUpdate(normalized.productId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        if (
            product.restaurant.id != restaurant.id ||
            product.status != ReservationProductStatus.ACTIVE
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        }

        val reservedPartySize = reservationRepository.sumPartySizeBySlot(
            productId = product.id,
            visitDate = normalized.visitDate,
            startTime = normalized.startTime,
            statuses = activeReservationStatuses(),
        )
        if (reservedPartySize + normalized.partySize > availableSlot.remainingCapacity) {
            throw ApiException(ErrorCode.CONFLICT, "예약 가능한 재고가 없습니다.")
        }

        val customer = customerRepository.findByRestaurantIdAndPhoneNumber(
            restaurantId = restaurant.id,
            phoneNumber = normalized.customerPhone,
        )?.also {
            if (it.name != normalized.customerName) {
                it.name = normalized.customerName
            }
        } ?: customerRepository.saveAndFlush(
            CustomerEntity(
                restaurant = restaurant,
                name = normalized.customerName,
                phoneNumber = normalized.customerPhone,
            ),
        )

        val idempotencyKey = "manual-${UUID.randomUUID()}"
        val reservation = reservationRepository.saveAndFlush(
            ReservationEntity(
                restaurant = restaurant,
                reservationProduct = product,
                customer = customer,
                reservationNumber = generateReservationNumber(normalized.visitDate),
                visitDate = normalized.visitDate,
                startTime = normalized.startTime,
                endTime = availableSlot.endTime,
                partySize = normalized.partySize,
                status = ReservationStatus.CONFIRMED,
                source = normalized.source,
                customerRequest = normalized.customerRequest,
                idempotencyKey = idempotencyKey,
                idempotencyRequestHash = TokenHash.sha256Hex(idempotencyKey),
            ),
        )
        auditLogService.record(
            actorUser = owner,
            actorRole = "OWNER",
            action = "RESERVATION_CREATED_MANUAL",
            targetType = "reservation",
            targetId = reservation.id,
            afterValue = objectMapper.writeValueAsString(reservation.auditSnapshot()),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
        notificationService.recordReservationConfirmed(reservation)

        return reservation.toDetail()
    }

    @Transactional
    fun update(
        principal: BusinessPrincipal,
        reservationId: Long,
        request: BusinessReservationUpdateRequest,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val reservation = ownedReservationForUpdate(restaurant.id, reservationId)
        reservation.requireActive("변경할 수 없는 예약입니다.")
        val normalized = request.normalized(reservation)
        val availableSlot = availabilityService.businessAvailableTimes(
            restaurantId = restaurant.id,
            productId = normalized.productId,
            dateValue = normalized.visitDate.toString(),
            partySizeValue = normalized.partySize,
        ).times.firstOrNull { it.startTime == normalized.startTime && it.available }
            ?: throw ApiException(ErrorCode.CONFLICT, "예약 가능한 시간이 아닙니다.")

        val product = reservationProductRepository.findByIdForUpdate(normalized.productId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        if (product.restaurant.id != restaurant.id || product.status != ReservationProductStatus.ACTIVE) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        }

        val reservedPartySize = reservationRepository.sumPartySizeBySlot(
            productId = product.id,
            visitDate = normalized.visitDate,
            startTime = normalized.startTime,
            statuses = activeReservationStatuses(),
        )
        val currentPartySizeInTarget = reservation.currentPartySizeInTarget(
            productId = product.id,
            visitDate = normalized.visitDate,
            startTime = normalized.startTime,
        )
        if (reservedPartySize - currentPartySizeInTarget + normalized.partySize > availableSlot.remainingCapacity) {
            throw ApiException(ErrorCode.CONFLICT, "예약 가능한 재고가 없습니다.")
        }

        val before = reservation.auditSnapshot()
        reservation.reservationProduct = product
        reservation.visitDate = normalized.visitDate
        reservation.startTime = normalized.startTime
        reservation.endTime = availableSlot.endTime
        reservation.partySize = normalized.partySize
        reservation.status = ReservationStatus.MODIFIED
        auditReservationChange(owner, "RESERVATION_UPDATED", reservation, before, metadata)
        notificationService.recordReservationUpdated(reservation)

        return reservation.toDetail()
    }

    @Transactional
    fun cancel(
        principal: BusinessPrincipal,
        reservationId: Long,
        request: BusinessReservationCancelRequest?,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val reservation = ownedReservationForUpdate(restaurant.id, reservationId)
        if (reservation.status == ReservationStatus.CANCELLED_BY_RESTAURANT) {
            return reservation.toDetail(refundService.latestRefundOperation(reservation))
        }
        reservation.requireActive("취소할 수 없는 예약입니다.")
        val reason = request.normalizedCancelReason()
        val before = reservation.auditSnapshot()
        reservation.status = ReservationStatus.CANCELLED_BY_RESTAURANT
        reservation.cancelledAt = Instant.now(clock)
        reservation.cancelReason = reason
        val refund = refundService.requestRestaurantCancellationRefund(reservation)
        auditReservationChange(owner, "RESERVATION_CANCELLED_BY_RESTAURANT", reservation, before, metadata)
        notificationService.recordReservationCancelled(reservation)

        return reservation.toDetail(refund)
    }

    @Transactional(readOnly = true)
    fun refundPreview(
        principal: BusinessPrincipal,
        reservationId: Long,
    ): RefundPreviewResponse {
        val restaurant = ownedRestaurant(principal)
        val reservation = reservationRepository.findBusinessReservationById(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        if (reservation.restaurant.id != restaurant.id) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        }
        return refundService.previewRestaurantCancellation(reservation)
    }

    @Transactional
    fun complete(
        principal: BusinessPrincipal,
        reservationId: Long,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val reservation = ownedReservationForUpdate(restaurant.id, reservationId)
        reservation.requireActive("방문 완료 처리할 수 없는 예약입니다.")
        val before = reservation.auditSnapshot()
        reservation.status = ReservationStatus.COMPLETED
        reservation.completedAt = Instant.now(clock)
        auditReservationChange(owner, "RESERVATION_COMPLETED", reservation, before, metadata)

        return reservation.toDetail()
    }

    @Transactional
    fun noShow(
        principal: BusinessPrincipal,
        reservationId: Long,
        request: BusinessReservationNoShowRequest?,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val reservation = ownedReservationForUpdate(restaurant.id, reservationId)
        reservation.requireActive("노쇼 처리할 수 없는 예약입니다.")
        if (Instant.now(clock).isBefore(reservation.reservedInstant(reservation.startTime)) && request?.force != true) {
            throw ApiException(ErrorCode.CONFLICT, "예약 시작 전에는 노쇼 처리할 수 없습니다.")
        }
        val before = reservation.auditSnapshot()
        reservation.status = ReservationStatus.NO_SHOW
        reservation.noShowAt = Instant.now(clock)
        val after = reservation.auditSnapshot() + ("reason" to request?.reason?.trim()?.takeIf { it.isNotBlank() })
        auditReservationChange(owner, "RESERVATION_NO_SHOW", reservation, before, metadata, after)

        return reservation.toDetail()
    }

    @Transactional
    fun updateOperationNote(
        principal: BusinessPrincipal,
        reservationId: Long,
        request: BusinessReservationOperationNoteRequest,
        metadata: BusinessReservationRequestMetadata,
    ): BusinessReservationDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val reservation = ownedReservationForUpdate(restaurant.id, reservationId)
        val normalizedOwnerNote = request.normalizedOwnerNote()
        val before = reservation.auditSnapshot()
        reservation.ownerNote = normalizedOwnerNote
        auditReservationChange(owner, "RESERVATION_OWNER_NOTE_UPDATED", reservation, before, metadata)

        return reservation.toDetail()
    }

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
                    modifiedCount = reservations.count { it.status == ReservationStatus.MODIFIED },
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

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

    private fun ownedReservationForUpdate(
        restaurantId: Long,
        reservationId: Long,
    ): ReservationEntity {
        val reservation = reservationRepository.findByIdForUpdate(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        if (reservation.restaurant.id != restaurantId) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        }
        return reservation
    }

    private fun BusinessManualReservationCreateRequest.normalized(): NormalizedManualReservationCreateRequest {
        val normalizedProductId = productId
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "productId가 필요합니다.")
        if (normalizedProductId < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "productId가 올바르지 않습니다.")
        }
        val normalizedVisitDate = visitDate.parseRequiredDate("visitDate")
        val normalizedStartTime = startTime.parseRequiredTime("startTime")
        val normalizedPartySize = partySize
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize가 필요합니다.")
        if (normalizedPartySize < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize는 1 이상이어야 합니다.")
        }
        val normalizedCustomerName = customerName?.trim().orEmpty()
        if (normalizedCustomerName.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName이 필요합니다.")
        }
        if (normalizedCustomerName.length > MAX_MANUAL_CUSTOMER_NAME_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName은 80자 이하여야 합니다.")
        }
        val normalizedCustomerPhone = customerPhone.orEmpty().filter { it.isDigit() }
        if (normalizedCustomerPhone.length !in 8..20) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerPhone이 유효하지 않습니다.")
        }
        val normalizedCustomerRequest = customerRequest
            ?.trim()
            ?.takeIf { it.isNotBlank() }
        if ((normalizedCustomerRequest?.length ?: 0) > MAX_MANUAL_CUSTOMER_REQUEST_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerRequest는 500자 이하여야 합니다.")
        }

        return NormalizedManualReservationCreateRequest(
            productId = normalizedProductId,
            visitDate = normalizedVisitDate,
            startTime = normalizedStartTime,
            partySize = normalizedPartySize,
            customerName = normalizedCustomerName,
            customerPhone = normalizedCustomerPhone,
            customerRequest = normalizedCustomerRequest,
            source = source.parseManualSource(),
        )
    }

    private fun BusinessReservationUpdateRequest.normalized(
        reservation: ReservationEntity,
    ): NormalizedReservationUpdateRequest {
        val normalizedProductId = productId ?: reservation.reservationProduct.id
        if (normalizedProductId < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "productId가 올바르지 않습니다.")
        }
        val normalizedVisitDate = visitDate.parseOptionalDate("visitDate") ?: reservation.visitDate
        val normalizedStartTime = startTime.parseOptionalTime("startTime") ?: reservation.startTime
        val normalizedPartySize = partySize ?: reservation.partySize
        if (normalizedPartySize < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize는 1 이상이어야 합니다.")
        }
        return NormalizedReservationUpdateRequest(
            productId = normalizedProductId,
            visitDate = normalizedVisitDate,
            startTime = normalizedStartTime,
            partySize = normalizedPartySize,
        )
    }

    private fun BusinessReservationCancelRequest?.normalizedCancelReason(): String {
        val reason = this?.reason?.trim().orEmpty()
        if (reason.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 사유가 필요합니다.")
        }
        if (reason.length > 255) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 사유는 255자 이하여야 합니다.")
        }
        return reason
    }

    private fun BusinessReservationOperationNoteRequest.normalizedOwnerNote(): String? {
        val normalized = ownerNote?.trim()?.takeIf { it.isNotBlank() }
        if ((normalized?.length ?: 0) > MAX_OWNER_NOTE_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "운영 메모는 1000자 이하여야 합니다.")
        }
        return normalized
    }

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

    private fun String?.parseRequiredDate(fieldName: String): LocalDate =
        parseOptionalDate(fieldName)
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}가 필요합니다.")

    private fun String?.parseOptionalTime(fieldName: String): LocalTime? {
        val value = this?.trim()?.takeIf { it.isNotBlank() } ?: return null
        return try {
            LocalTime.parse(value)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun String?.parseRequiredTime(fieldName: String): LocalTime =
        parseOptionalTime(fieldName)
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}이 필요합니다.")

    private fun String?.parseManualSource(): ReservationSource {
        val value = this?.trim()?.takeIf { it.isNotBlank() } ?: return ReservationSource.MANUAL_PHONE
        val source = try {
            ReservationSource.valueOf(value.replace('-', '_').uppercase(Locale.ROOT))
        } catch (exception: IllegalArgumentException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "source 값이 올바르지 않습니다.", exception)
        }
        if (source != ReservationSource.MANUAL_PHONE && source != ReservationSource.MANUAL_WALK_IN) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "수동 예약 source만 사용할 수 있습니다.")
        }
        return source
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
            modifiedCount = count { it.status == ReservationStatus.MODIFIED },
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
            source = source.name,
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
            hasOwnerNote = !ownerNote.isNullOrBlank(),
            paymentStatus = paymentStatus.name,
            paymentActionRequired = paymentStatus.requiresBusinessAction(),
        )
    }

    private fun ReservationEntity.toDetail(
        refund: RefundOperationResponse? = null,
    ): BusinessReservationDetailResponse {
        val statusPresentation = status.presentation()
        return BusinessReservationDetailResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            statusLabel = statusPresentation.label,
            statusTone = statusPresentation.tone,
            source = source.name,
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
            ownerNote = ownerNote,
            paymentStatus = paymentStatus.name,
            paymentActionRequired = paymentStatus.requiresBusinessAction(),
            paymentSummary = paymentSummary(),
            cancelledAt = cancelledAt,
            cancelReason = cancelReason,
            refund = refund,
            completedAt = completedAt,
            noShowAt = noShowAt,
            auditLogs = auditLogRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtAscIdAsc("reservation", id)
                .map { BusinessReservationAuditLogResponse(id = it.id, action = it.action, createdAt = it.createdAt) },
        )
    }

    private fun ReservationEntity.paymentSummary(): BusinessReservationPaymentSummaryResponse {
        val latestPayment = paymentRepository.findByReservationIdOrderByCreatedAtAsc(id).lastOrNull()
        val latestRefund = refundRepository.findByReservationIdOrderByCreatedAtAsc(id).lastOrNull()
        return BusinessReservationPaymentSummaryResponse(
            paymentRequired = paymentRequired,
            paymentMode = paymentMode,
            reservationPaymentStatus = paymentStatus,
            paymentDueAt = paymentDueAt,
            latestPaymentId = latestPayment?.id,
            latestPaymentType = latestPayment?.paymentType,
            latestPaymentStatus = latestPayment?.status,
            latestPaymentAmount = latestPayment?.amount,
            refundedAmount = latestPayment?.refundedAmount ?: 0,
            latestRefundId = latestRefund?.id,
            latestRefundStatus = latestRefund?.status,
            latestRefundAmount = latestRefund?.refundAmount,
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
            ReservationStatus.MODIFIED -> ReservationStatusPresentation("변경됨", "warning")
            ReservationStatus.CANCELLED_BY_CUSTOMER -> ReservationStatusPresentation("고객 취소", "neutral")
            ReservationStatus.CANCELLED_BY_RESTAURANT -> ReservationStatusPresentation("매장 취소", "warning")
            ReservationStatus.COMPLETED -> ReservationStatusPresentation("방문 완료", "success")
            ReservationStatus.NO_SHOW -> ReservationStatusPresentation("노쇼", "danger")
        }

    private fun ReservationStatus.isCancelled(): Boolean =
        this == ReservationStatus.CANCELLED_BY_CUSTOMER || this == ReservationStatus.CANCELLED_BY_RESTAURANT

    private fun ReservationEntity.requireActive(message: String) {
        if (status !in activeReservationStatuses()) {
            throw ApiException(ErrorCode.CONFLICT, message)
        }
    }

    private fun ReservationEntity.currentPartySizeInTarget(
        productId: Long,
        visitDate: LocalDate,
        startTime: LocalTime,
    ): Int =
        if (
            status in activeReservationStatuses() &&
            reservationProduct.id == productId &&
            this.visitDate == visitDate &&
            this.startTime == startTime
        ) {
            partySize
        } else {
            0
        }

    private fun activeReservationStatuses(): List<ReservationStatus> =
        listOf(ReservationStatus.CONFIRMED, ReservationStatus.MODIFIED)

    private fun ReservationDateRange.dates(): List<LocalDate> =
        generateSequence(from) { previous ->
            previous.plusDays(1).takeIf { !it.isAfter(to) }
        }.toList()

    private fun generateReservationNumber(visitDate: LocalDate): String {
        repeat(10) {
            val randomCode = UUID.randomUUID().toString()
                .take(8)
                .uppercase(Locale.ROOT)
            val candidate = "R${visitDate.format(DateTimeFormatter.BASIC_ISO_DATE)}-$randomCode"
            if (reservationRepository.findByReservationNumber(candidate) == null) {
                return candidate
            }
        }
        throw ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "예약번호를 생성하지 못했습니다.")
    }

    private fun ReservationEntity.auditSnapshot(): Map<String, Any?> =
        mapOf(
            "reservationNumber" to reservationNumber,
            "restaurantId" to restaurant.id,
            "productId" to reservationProduct.id,
            "customerId" to customer.id,
            "visitDate" to visitDate.toString(),
            "startTime" to startTime.toString(),
            "endTime" to endTime.toString(),
            "partySize" to partySize,
            "status" to status.name,
            "source" to source.name,
            "ownerNote" to ownerNote,
            "paymentRequired" to paymentRequired,
            "paymentMode" to paymentMode.name,
            "paymentStatus" to paymentStatus.name,
            "paymentDueAt" to paymentDueAt?.toString(),
            "cancellationPolicySnapshot" to cancellationPolicySnapshotJson,
            "cancelledAt" to cancelledAt?.toString(),
            "cancelReason" to cancelReason,
            "completedAt" to completedAt?.toString(),
            "noShowAt" to noShowAt?.toString(),
        )

    private fun auditReservationChange(
        owner: BusinessUserEntity,
        action: String,
        reservation: ReservationEntity,
        before: Map<String, Any?>,
        metadata: BusinessReservationRequestMetadata,
        after: Map<String, Any?> = reservation.auditSnapshot(),
    ) {
        auditLogService.record(
            actorUser = owner,
            actorRole = "OWNER",
            action = action,
            targetType = "reservation",
            targetId = reservation.id,
            beforeValue = objectMapper.writeValueAsString(before),
            afterValue = objectMapper.writeValueAsString(after),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
    }
}

data class BusinessManualReservationCreateRequest(
    val source: String? = null,
    val productId: Long? = null,
    val visitDate: String? = null,
    val startTime: String? = null,
    val partySize: Int? = null,
    val customerName: String? = null,
    val customerPhone: String? = null,
    val customerRequest: String? = null,
)

data class BusinessReservationUpdateRequest(
    val productId: Long? = null,
    val visitDate: String? = null,
    val startTime: String? = null,
    val partySize: Int? = null,
)

data class BusinessReservationCancelRequest(
    val reason: String? = null,
)

data class BusinessReservationNoShowRequest(
    val reason: String? = null,
    val force: Boolean? = null,
)

data class BusinessReservationOperationNoteRequest(
    val ownerNote: String? = null,
)

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

data class BusinessReservationRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)

private data class NormalizedManualReservationCreateRequest(
    val productId: Long,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val partySize: Int,
    val customerName: String,
    val customerPhone: String,
    val customerRequest: String?,
    val source: ReservationSource,
)

private data class NormalizedReservationUpdateRequest(
    val productId: Long,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val partySize: Int,
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
