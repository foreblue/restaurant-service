package com.example.restaurant.reservation

import com.example.restaurant.auth.ReservationLookupTokenRequest
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.availability.AvailabilityService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

private const val MAX_IDEMPOTENCY_KEY_LENGTH = 128
private const val MAX_CUSTOMER_NAME_LENGTH = 80
private const val MAX_CUSTOMER_REQUEST_LENGTH = 500

@Service
class PublicReservationService(
    private val availabilityService: AvailabilityService,
    private val reservationProductRepository: ReservationProductRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val customerRepository: CustomerRepository,
    private val reservationRepository: ReservationRepository,
    private val lookupTokenService: ReservationLookupTokenService,
) {
    private val secureRandom = SecureRandom()

    @Transactional
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
            statuses = listOf(ReservationStatus.CONFIRMED),
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
                customerRequest = normalized.customerRequest,
                idempotencyKey = normalized.idempotencyKey,
                idempotencyRequestHash = normalized.requestHash,
            ),
        )

        return reservation.toResponse()
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
