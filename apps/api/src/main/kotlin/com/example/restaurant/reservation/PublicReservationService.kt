package com.example.restaurant.reservation

import com.example.restaurant.auth.ReservationLookupTokenRequest
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.availability.AvailabilityService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.notification.NotificationService
import com.example.restaurant.payment.ReservationPaymentPolicyResolver
import com.example.restaurant.refund.RefundOperationResponse
import com.example.restaurant.refund.RefundService
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit

private const val MAX_IDEMPOTENCY_KEY_LENGTH = 128
private const val MAX_CUSTOMER_NAME_LENGTH = 80
private const val MAX_CUSTOMER_REQUEST_LENGTH = 500
private const val MAX_CANCEL_REASON_LENGTH = 255

@Service
class PublicReservationService(
    private val availabilityService: AvailabilityService,
    private val reservationProductRepository: ReservationProductRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val customerRepository: CustomerRepository,
    private val reservationRepository: ReservationRepository,
    private val lookupTokenService: ReservationLookupTokenService,
    private val notificationService: NotificationService,
    private val paymentPolicyResolver: ReservationPaymentPolicyResolver,
    private val refundService: RefundService,
    private val clock: Clock,
) {
    private val secureRandom = SecureRandom()

    @Transactional(isolation = Isolation.READ_COMMITTED)
    fun create(
        request: PublicReservationCreateRequest,
        headerIdempotencyKey: String?,
    ): PublicReservationResponse {
        val normalized = request.normalized(headerIdempotencyKey)
        val existing = reservationRepository.findByIdempotencyKey(normalized.idempotencyKey)
        if (existing != null) {
            return existing.requireSameRequest(normalized).toResponse()
        }

        val availableSlot = availabilityService.availableTimes(
            restaurantId = normalized.restaurantId,
            productId = normalized.productId,
            dateValue = normalized.visitDate.toString(),
            partySizeValue = normalized.partySize,
        ).times.firstOrNull { it.startTime == normalized.startTime && it.available }
            ?: throw ApiException(ErrorCode.CONFLICT, "예약 가능한 시간이 아닙니다.")

        val product = reservationProductRepository.findByIdForUpdate(normalized.productId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약 가능한 상품을 찾을 수 없습니다.")
        val page = reservationPageRepository.findByRestaurantId(normalized.restaurantId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약 가능한 상품을 찾을 수 없습니다.")
        if (
            product.restaurant.id != normalized.restaurantId ||
            product.status != ReservationProductStatus.ACTIVE ||
            !product.visible ||
            product.restaurant.status != RestaurantStatus.APPROVED ||
            page.status != ReservationPageStatus.PUBLIC
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 가능한 상품을 찾을 수 없습니다.")
        }

        reservationRepository.findByIdempotencyKey(normalized.idempotencyKey)?.let {
            return it.requireSameRequest(normalized).toResponse()
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
            restaurantId = normalized.restaurantId,
            phoneNumber = normalized.customerPhone,
        )?.also {
            if (it.name != normalized.customerName) {
                it.name = normalized.customerName
            }
        } ?: customerRepository.saveAndFlush(
            CustomerEntity(
                restaurant = product.restaurant,
                name = normalized.customerName,
                phoneNumber = normalized.customerPhone,
            ),
        )

        val paymentPolicy = paymentPolicyResolver.resolve(product, normalized.partySize)
        val reservation = reservationRepository.saveAndFlush(
            ReservationEntity(
                restaurant = product.restaurant,
                reservationProduct = product,
                customer = customer,
                reservationNumber = generateReservationNumber(normalized.visitDate),
                visitDate = normalized.visitDate,
                startTime = normalized.startTime,
                endTime = availableSlot.endTime,
                partySize = normalized.partySize,
                status = ReservationStatus.CONFIRMED,
                source = ReservationSource.ONLINE,
                customerRequest = normalized.customerRequest,
                paymentRequired = paymentPolicy.requiresGateway,
                paymentMode = paymentPolicy.mode,
                paymentStatus = paymentPolicy.initialStatus,
                paymentDueAt = paymentPolicy.requiresGateway.takeIf { it }
                    ?.let { Instant.now(clock).plus(15, ChronoUnit.MINUTES) },
                idempotencyKey = normalized.idempotencyKey,
                idempotencyRequestHash = normalized.requestHash,
            ),
        )
        notificationService.recordReservationConfirmed(reservation)

        return reservation.toResponse()
    }

    @Transactional
    fun detail(
        reservationId: Long,
        lookupToken: String?,
    ): PublicReservationDetailResponse {
        val reservation = reservationRepository.findById(reservationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.") }
        reservation.requireLookupAccess(lookupToken)
        return reservation.toDetailResponse()
    }

    @Transactional
    fun cancel(
        reservationId: Long,
        lookupToken: String?,
        request: PublicReservationCancelRequest?,
    ): PublicReservationDetailResponse {
        val reservation = reservationRepository.findByIdForUpdate(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        reservation.requireLookupAccess(lookupToken)
        if (reservation.status == ReservationStatus.CANCELLED_BY_CUSTOMER) {
            return reservation.toDetailResponse(refundService.latestRefundOperation(reservation))
        }
        if (reservation.status !in activeReservationStatuses()) {
            throw ApiException(ErrorCode.CONFLICT, "취소할 수 없는 예약입니다.")
        }
        if (!reservation.isCancelableNow()) {
            throw ApiException(ErrorCode.CONFLICT, "방문 시작 이후에는 고객 취소를 할 수 없습니다.")
        }

        val refundPreview = refundService.previewCustomerCancellation(reservation)
        request.requireMatchingRefundAmount(refundPreview.refundableAmount)
        reservation.status = ReservationStatus.CANCELLED_BY_CUSTOMER
        reservation.cancelledAt = Instant.now(clock)
        reservation.cancelReason = request.normalizedCancelReason()
        val refund = refundService.requestCustomerCancellationRefund(reservation)
        notificationService.recordReservationCancelled(reservation)

        return reservation.toDetailResponse(refund)
    }

    private fun PublicReservationCreateRequest.normalized(
        headerIdempotencyKey: String?,
    ): NormalizedReservationCreateRequest {
        val normalizedRestaurantId = restaurantId
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "restaurantId가 필요합니다.")
        val normalizedProductId = productId
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "productId가 필요합니다.")
        val normalizedVisitDate = visitDate.parseDate("visitDate")
        val normalizedStartTime = startTime.parseTime("startTime")
        val normalizedPartySize = partySize
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize가 필요합니다.")
        if (normalizedPartySize < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "partySize는 1 이상이어야 합니다.")
        }

        val normalizedCustomerName = customerName?.trim().orEmpty()
        if (normalizedCustomerName.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName이 필요합니다.")
        }
        if (normalizedCustomerName.length > MAX_CUSTOMER_NAME_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName은 80자 이하여야 합니다.")
        }

        val normalizedCustomerPhone = customerPhone.orEmpty().filter { it.isDigit() }
        if (normalizedCustomerPhone.length !in 8..20) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerPhone이 유효하지 않습니다.")
        }

        val normalizedCustomerRequest = customerRequest
            ?.trim()
            ?.takeIf { it.isNotBlank() }
        if ((normalizedCustomerRequest?.length ?: 0) > MAX_CUSTOMER_REQUEST_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerRequest는 500자 이하여야 합니다.")
        }

        val normalizedIdempotencyKey = (headerIdempotencyKey?.takeIf { it.isNotBlank() } ?: idempotencyKey)
            ?.trim()
            .orEmpty()
        if (normalizedIdempotencyKey.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "Idempotency-Key가 필요합니다.")
        }
        if (normalizedIdempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "Idempotency-Key는 128자 이하여야 합니다.")
        }

        val requestHash = TokenHash.sha256Hex(
            listOf(
                normalizedRestaurantId.toString(),
                normalizedProductId.toString(),
                normalizedVisitDate.toString(),
                normalizedStartTime.toString(),
                normalizedPartySize.toString(),
                normalizedCustomerName,
                normalizedCustomerPhone,
                normalizedCustomerRequest.orEmpty(),
            ).joinToString(separator = "\u001F"),
        )

        return NormalizedReservationCreateRequest(
            restaurantId = normalizedRestaurantId,
            productId = normalizedProductId,
            visitDate = normalizedVisitDate,
            startTime = normalizedStartTime,
            partySize = normalizedPartySize,
            customerName = normalizedCustomerName,
            customerPhone = normalizedCustomerPhone,
            customerRequest = normalizedCustomerRequest,
            idempotencyKey = normalizedIdempotencyKey,
            requestHash = requestHash,
        )
    }

    private fun ReservationEntity.requireSameRequest(
        normalized: NormalizedReservationCreateRequest,
    ): ReservationEntity {
        if (idempotencyRequestHash != normalized.requestHash) {
            throw ApiException(ErrorCode.CONFLICT, "같은 Idempotency-Key로 다른 예약 요청을 처리할 수 없습니다.")
        }
        return this
    }

    private fun ReservationEntity.toResponse(): PublicReservationResponse {
        val token = lookupTokenService.issueToken(
            ReservationLookupTokenRequest(
                reservationNumber = reservationNumber,
                phoneNumber = customer.phoneNumber,
            ),
        )

        return PublicReservationResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            restaurantId = restaurant.id,
            productId = reservationProduct.id,
            customerId = customer.id,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            customerName = customer.name,
            customerPhoneLast4 = customer.phoneNumber.takeLast(4),
            lookupToken = token.lookupToken,
            lookupTokenExpiresAt = token.expiresAt,
        )
    }

    private fun ReservationEntity.toDetailResponse(
        refund: RefundOperationResponse? = null,
    ): PublicReservationDetailResponse =
        PublicReservationDetailResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            restaurantId = restaurant.id,
            restaurantName = restaurant.name,
            productId = reservationProduct.id,
            productName = reservationProduct.name,
            customerId = customer.id,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            customerName = customer.name,
            customerPhoneLast4 = customer.phoneNumber.takeLast(4),
            customerRequest = customerRequest,
            cancelable = isCancelableNow(),
            cancelDeadline = cancelDeadline(),
            cancelledAt = cancelledAt,
            cancelReason = cancelReason,
            refund = refund,
        )

    private fun ReservationEntity.requireLookupAccess(lookupToken: String?) {
        val token = lookupToken?.trim().orEmpty()
        if (token.isBlank()) {
            throw ApiException(ErrorCode.AUTHENTICATION_REQUIRED, "예약 조회 토큰이 필요합니다.")
        }
        if (!lookupTokenService.hasLookupAccess(reservationNumber, token)) {
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약 조회 권한이 없습니다.")
        }
    }

    private fun ReservationEntity.isCancelableNow(): Boolean =
        status in activeReservationStatuses() && Instant.now(clock).isBefore(cancelDeadline())

    private fun ReservationEntity.cancelDeadline(): Instant =
        ZonedDateTime.of(visitDate, startTime, ZoneId.of(restaurant.timezone)).toInstant()

    private fun PublicReservationCancelRequest?.normalizedCancelReason(): String? {
        val normalized = this?.reason?.trim()?.takeIf { it.isNotBlank() }
        if ((normalized?.length ?: 0) > MAX_CANCEL_REASON_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 사유는 255자 이하여야 합니다.")
        }
        return normalized
    }

    private fun PublicReservationCancelRequest?.requireMatchingRefundAmount(expectedAmount: Long) {
        val confirmedAmount = this?.confirmRefundAmount ?: return
        if (confirmedAmount < 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "confirmRefundAmount는 0 이상이어야 합니다.")
        }
        if (confirmedAmount != expectedAmount) {
            throw ApiException(ErrorCode.CONFLICT, "확인한 환불 예상 금액과 현재 환불 금액이 일치하지 않습니다.")
        }
    }

    private fun activeReservationStatuses(): List<ReservationStatus> =
        listOf(ReservationStatus.CONFIRMED, ReservationStatus.MODIFIED)

    private fun generateReservationNumber(visitDate: LocalDate): String {
        repeat(10) {
            val candidate = "R${visitDate.format(DateTimeFormatter.BASIC_ISO_DATE)}-${randomCode()}"
            if (reservationRepository.findByReservationNumber(candidate) == null) {
                return candidate
            }
        }
        throw ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "예약번호를 생성하지 못했습니다.")
    }

    private fun randomCode(): String {
        val bytes = ByteArray(5)
        secureRandom.nextBytes(bytes)
        return bytes.joinToString(separator = "") { "%02X".format(it.toInt() and 0xff) }
    }

    private fun String?.parseDate(fieldName: String): LocalDate =
        try {
            LocalDate.parse(this?.trim().orEmpty().takeIf { it.isNotBlank() }
                ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}가 필요합니다."))
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }

    private fun String?.parseTime(fieldName: String): LocalTime =
        try {
            LocalTime.parse(this?.trim().orEmpty().takeIf { it.isNotBlank() }
                ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}가 필요합니다."))
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
}

private data class NormalizedReservationCreateRequest(
    val restaurantId: Long,
    val productId: Long,
    val visitDate: LocalDate,
    val startTime: LocalTime,
    val partySize: Int,
    val customerName: String,
    val customerPhone: String,
    val customerRequest: String?,
    val idempotencyKey: String,
    val requestHash: String,
)
