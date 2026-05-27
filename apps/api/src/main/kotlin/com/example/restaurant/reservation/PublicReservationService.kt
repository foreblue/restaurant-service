package com.example.restaurant.reservation

import com.example.restaurant.auth.ReservationLookupTokenRequest
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.availability.AvailabilityService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.inventory.SeatInventoryService
import com.example.restaurant.member.CustomerMemberEntity
import com.example.restaurant.member.CustomerMemberRepository
import com.example.restaurant.member.CustomerMemberStatus
import com.example.restaurant.notification.NotificationService
import com.example.restaurant.payment.CancellationPolicyEntity
import com.example.restaurant.payment.CancellationPolicyRepository
import com.example.restaurant.payment.ReservationPaymentPolicyResolver
import com.example.restaurant.refund.RefundOperationResponse
import com.example.restaurant.refund.RefundService
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantStatus
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
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
private const val MAX_CUSTOMER_EMAIL_LENGTH = 255
private const val MAX_CUSTOMER_NOTE_LENGTH = 1000
private const val MAX_CUSTOMER_SHORT_FIELD_LENGTH = 40
private const val MAX_REQUEST_TEMPLATE_COUNT = 10
private const val MAX_REQUEST_TEMPLATE_VALUE_LENGTH = 80

@Service
class PublicReservationService(
    private val availabilityService: AvailabilityService,
    private val reservationProductRepository: ReservationProductRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val customerRepository: CustomerRepository,
    private val customerMemberRepository: CustomerMemberRepository,
    private val reservationRepository: ReservationRepository,
    private val seatInventoryService: SeatInventoryService,
    private val lookupTokenService: ReservationLookupTokenService,
    private val notificationService: NotificationService,
    private val paymentPolicyResolver: ReservationPaymentPolicyResolver,
    private val cancellationPolicyRepository: CancellationPolicyRepository,
    private val refundService: RefundService,
    private val clock: Clock,
) {
    private val secureRandom = SecureRandom()
    private val objectMapper = jacksonObjectMapper()

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
            applyInventory = false,
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
        customer.applyReservationSelections(normalized)

        val paymentPolicy = paymentPolicyResolver.resolve(product, normalized.partySize)
        val reservation = reservationRepository.saveAndFlush(
            ReservationEntity(
                restaurant = product.restaurant,
                reservationProduct = product,
                customer = customer,
                member = normalized.member,
                reservationNumber = generateReservationNumber(normalized.visitDate),
                visitDate = normalized.visitDate,
                startTime = normalized.startTime,
                endTime = availableSlot.endTime,
                partySize = normalized.partySize,
                status = ReservationStatus.CONFIRMED,
                source = ReservationSource.ONLINE,
                customerRequest = normalized.customerRequest,
                customerEmail = normalized.customerEmail,
                allergyNote = normalized.allergyNote,
                anniversaryType = normalized.anniversaryType,
                anniversaryDate = normalized.anniversaryDate,
                requestTemplateValuesJson = normalized.requestTemplateValuesJson(),
                marketingOptIn = normalized.marketingOptIn,
                paymentRequired = paymentPolicy.requiresGateway,
                paymentMode = paymentPolicy.mode,
                paymentStatus = paymentPolicy.initialStatus,
                paymentDueAt = paymentPolicy.requiresGateway.takeIf { it }
                    ?.let { Instant.now(clock).plus(15, ChronoUnit.MINUTES) },
                cancellationPolicySnapshotJson = product.activeCancellationPolicySnapshot(),
                idempotencyKey = normalized.idempotencyKey,
                idempotencyRequestHash = normalized.requestHash,
            ),
        )
        seatInventoryService.assignReservation(reservation)
        notificationService.recordReservationConfirmed(reservation)

        return reservation.toResponse()
    }

    @Transactional
    fun detail(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long? = null,
    ): PublicReservationDetailResponse {
        val reservation = reservationRepository.findById(reservationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.") }
        reservation.requirePublicAccess(lookupToken, memberId)
        return reservation.toDetailResponse()
    }

    @Transactional
    fun cancel(
        reservationId: Long,
        lookupToken: String?,
        memberId: Long? = null,
        request: PublicReservationCancelRequest?,
    ): PublicReservationDetailResponse {
        val reservation = reservationRepository.findByIdForUpdate(reservationId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        reservation.requirePublicAccess(lookupToken, memberId)
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

    @Transactional(readOnly = true)
    fun listByMember(memberId: Long): PublicMemberReservationListResponse {
        val member = findActiveMember(memberId)
        val reservations = reservationRepository.findPublicMemberReservations(member.id)

        return PublicMemberReservationListResponse(
            reservations = reservations.map { it.toMemberReservationItemResponse() },
        )
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

        val member = memberId?.let { findActiveMember(it) }
        val normalizedCustomerName = member?.name ?: customerName?.trim().orEmpty()
        if (normalizedCustomerName.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName이 필요합니다.")
        }
        if (normalizedCustomerName.length > MAX_CUSTOMER_NAME_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerName은 80자 이하여야 합니다.")
        }

        val normalizedCustomerPhone = member?.phoneNumber
            ?: customerPhone.orEmpty().filter { it.isDigit() }
        if (normalizedCustomerPhone.length !in 8..20) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerPhone이 유효하지 않습니다.")
        }

        val normalizedCustomerRequest = customerRequest
            ?.trim()
            ?.takeIf { it.isNotBlank() }
        if ((normalizedCustomerRequest?.length ?: 0) > MAX_CUSTOMER_REQUEST_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerRequest는 500자 이하여야 합니다.")
        }
        val normalizedCustomerEmail = customerEmail.normalizedEmail() ?: member?.email
        val normalizedAllergyNote =
            allergyNote.normalizedText(MAX_CUSTOMER_NOTE_LENGTH, "allergyNote") ?: member?.allergyNote
        val normalizedAnniversaryType =
            anniversaryType.normalizedText(MAX_CUSTOMER_SHORT_FIELD_LENGTH, "anniversaryType")
                ?: member?.anniversaryType
        val normalizedAnniversaryDate =
            anniversaryDate.normalizedAnniversaryDate() ?: member?.anniversaryDate
        val normalizedRequestTemplateValues = requestTemplateValues.normalizedRequestTemplateValues()
        val normalizedMarketingOptIn = marketingOptIn ?: member?.marketingOptIn ?: false

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
                member?.id?.toString().orEmpty(),
                normalizedCustomerName,
                normalizedCustomerPhone,
                normalizedCustomerRequest.orEmpty(),
                normalizedCustomerEmail.orEmpty(),
                normalizedAllergyNote.orEmpty(),
                normalizedAnniversaryType.orEmpty(),
                normalizedAnniversaryDate.orEmpty(),
                normalizedRequestTemplateValues.joinToString(separator = "\u001E"),
                normalizedMarketingOptIn.toString(),
            ).joinToString(separator = "\u001F"),
        )

        return NormalizedReservationCreateRequest(
            restaurantId = normalizedRestaurantId,
            productId = normalizedProductId,
            visitDate = normalizedVisitDate,
            startTime = normalizedStartTime,
            partySize = normalizedPartySize,
            member = member,
            customerName = normalizedCustomerName,
            customerPhone = normalizedCustomerPhone,
            customerRequest = normalizedCustomerRequest,
            customerEmail = normalizedCustomerEmail,
            allergyNote = normalizedAllergyNote,
            anniversaryType = normalizedAnniversaryType,
            anniversaryDate = normalizedAnniversaryDate,
            requestTemplateValues = normalizedRequestTemplateValues,
            marketingOptIn = normalizedMarketingOptIn,
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
            memberId = member?.id,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            customerName = customer.name,
            customerPhoneLast4 = customer.phoneNumber.takeLast(4),
            customerEmail = customerEmail,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            requestTemplateValues = requestTemplateValues(),
            marketingOptIn = marketingOptIn,
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
            memberId = member?.id,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            customerName = customer.name,
            customerPhoneLast4 = customer.phoneNumber.takeLast(4),
            customerRequest = customerRequest,
            customerEmail = customerEmail,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            requestTemplateValues = requestTemplateValues(),
            marketingOptIn = marketingOptIn,
            cancelable = isCancelableNow(),
            cancelDeadline = cancelDeadline(),
            cancelledAt = cancelledAt,
            cancelReason = cancelReason,
            refund = refund,
        )

    private fun ReservationEntity.toMemberReservationItemResponse(): PublicMemberReservationItemResponse =
        PublicMemberReservationItemResponse(
            id = id,
            reservationNumber = reservationNumber,
            status = status,
            restaurantId = restaurant.id,
            restaurantName = restaurant.name,
            productId = reservationProduct.id,
            productName = reservationProduct.name,
            memberId = member?.id
                ?: throw ApiException(ErrorCode.INTERNAL_SERVER_ERROR, "회원 예약 정보가 올바르지 않습니다."),
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            paymentRequired = paymentRequired,
            paymentMode = paymentMode,
            paymentStatus = paymentStatus,
            cancelable = isCancelableNow(),
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

    private fun ReservationEntity.requirePublicAccess(
        lookupToken: String?,
        memberId: Long?,
    ) {
        memberId?.let {
            if (it < 1) {
                throw ApiException(ErrorCode.VALIDATION_ERROR, "memberId가 올바르지 않습니다.")
            }
            if (member?.id == it && member?.status == CustomerMemberStatus.ACTIVE) {
                return
            }
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약 조회 권한이 없습니다.")
        }

        requireLookupAccess(lookupToken)
    }

    private fun ReservationEntity.isCancelableNow(): Boolean =
        status in activeReservationStatuses() && Instant.now(clock).isBefore(cancelDeadline())

    private fun ReservationEntity.cancelDeadline(): Instant =
        ZonedDateTime.of(visitDate, startTime, ZoneId.of(restaurant.timezone)).toInstant()

    private fun ReservationProductEntity.activeCancellationPolicySnapshot(): String? {
        val policy = cancellationPolicyRepository
            .findByReservationProductIdAndActiveOrderByEffectiveFromDesc(id, true)
            .firstOrNull()
            ?: return null
        return objectMapper.writeValueAsString(policy.snapshot())
    }

    private fun CancellationPolicyEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "policyId" to id,
            "policyName" to name,
            "rules" to objectMapper.readTree(rulesJson),
            "noShowRule" to noShowRuleJson?.let { objectMapper.readTree(it) },
            "restaurantCancelRefundRate" to restaurantCancelRefundRate,
            "effectiveFrom" to effectiveFrom.toString(),
        )

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

    private fun CustomerEntity.applyReservationSelections(
        normalized: NormalizedReservationCreateRequest,
    ) {
        normalized.customerEmail?.let { email = it }
        normalized.allergyNote?.let { allergyNote = it }
        normalized.anniversaryType?.let { anniversaryType = it }
        normalized.anniversaryDate?.let { anniversaryDate = it }
    }

    private fun findActiveMember(memberId: Long): CustomerMemberEntity {
        val member = customerMemberRepository.findById(memberId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.") }
        if (member.status != CustomerMemberStatus.ACTIVE) {
            throw ApiException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.")
        }
        return member
    }

    private fun NormalizedReservationCreateRequest.requestTemplateValuesJson(): String? =
        requestTemplateValues.takeIf { it.isNotEmpty() }
            ?.let { objectMapper.writeValueAsString(it) }

    private fun ReservationEntity.requestTemplateValues(): List<String> =
        requestTemplateValuesJson?.let { objectMapper.readValue<List<String>>(it) }.orEmpty()

    private fun String?.normalizedEmail(): String? {
        val normalized = normalizedText(MAX_CUSTOMER_EMAIL_LENGTH, "customerEmail") ?: return null
        val hasValidShape = normalized.count { it == '@' } == 1 &&
            normalized.substringAfter("@").contains(".") &&
            normalized.none { it.isWhitespace() }
        if (!hasValidShape) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "customerEmail 형식이 올바르지 않습니다.")
        }
        return normalized.lowercase()
    }

    private fun String?.normalizedText(
        maxLength: Int,
        fieldName: String,
    ): String? {
        val normalized = this?.trim()?.takeIf { it.isNotBlank() } ?: return null
        if (normalized.length > maxLength) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}은 ${maxLength}자 이하여야 합니다.")
        }
        return normalized
    }

    private fun String?.normalizedAnniversaryDate(): String? {
        val normalized = normalizedText(10, "anniversaryDate") ?: return null
        val valid = Regex("""\d{2}-\d{2}|\d{4}-\d{2}-\d{2}""").matches(normalized)
        if (!valid) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "anniversaryDate 형식이 올바르지 않습니다.")
        }
        return normalized
    }

    private fun List<String>?.normalizedRequestTemplateValues(): List<String> {
        val values = this.orEmpty()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
        if (values.size > MAX_REQUEST_TEMPLATE_COUNT) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "requestTemplateValues는 최대 10개까지 입력할 수 있습니다.")
        }
        values.firstOrNull { it.length > MAX_REQUEST_TEMPLATE_VALUE_LENGTH }?.let {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "requestTemplateValues 항목은 80자 이하여야 합니다.")
        }
        return values
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
    val member: CustomerMemberEntity?,
    val customerName: String,
    val customerPhone: String,
    val customerRequest: String?,
    val customerEmail: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val requestTemplateValues: List<String>,
    val marketingOptIn: Boolean,
    val idempotencyKey: String,
    val requestHash: String,
)
