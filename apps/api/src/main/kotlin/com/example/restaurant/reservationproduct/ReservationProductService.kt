package com.example.restaurant.reservationproduct

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.example.restaurant.restaurant.RestaurantStatus
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.DayOfWeek
import java.time.LocalTime
import java.time.format.DateTimeParseException
import java.util.Locale

@Service
class ReservationProductService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val auditLogService: AuditLogService,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun list(principal: BusinessPrincipal): List<ReservationProductResponse> {
        val restaurant = ownedRestaurant(principal)
        return reservationProductRepository
            .findByRestaurantIdAndStatusOrderByCreatedAtDescIdDesc(restaurant.id, ReservationProductStatus.ACTIVE)
            .map { it.toResponse() }
    }

    @Transactional
    fun create(
        principal: BusinessPrincipal,
        request: ReservationProductSaveRequest,
        metadata: ReservationProductRequestMetadata,
    ): ReservationProductResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalized()
        val product = reservationProductRepository.saveAndFlush(
            ReservationProductEntity(
                restaurant = restaurant,
                name = normalized.name,
                description = normalized.description,
                priceAmount = normalized.priceAmount,
                visible = normalized.visible,
                minPartySize = normalized.minPartySize,
                maxPartySize = normalized.maxPartySize,
                availableDaysJson = objectMapper.writeValueAsString(normalized.availableDays.map { it.name }),
                availableStartTime = normalized.availableStartTime,
                availableEndTime = normalized.availableEndTime,
                slotCapacity = normalized.slotCapacity,
            ),
        )
        audit(owner, "RESERVATION_PRODUCT_CREATED", product.id, null, product.snapshot(), metadata)
        return product.toResponse()
    }

    @Transactional
    fun update(
        principal: BusinessPrincipal,
        productId: Long,
        request: ReservationProductSaveRequest,
        metadata: ReservationProductRequestMetadata,
    ): ReservationProductResponse {
        val owner = owner(principal)
        val product = ownedProduct(principal, productId)
        val before = product.snapshot()
        val normalized = request.normalized()

        product.name = normalized.name
        product.description = normalized.description
        product.priceAmount = normalized.priceAmount
        product.visible = normalized.visible
        product.minPartySize = normalized.minPartySize
        product.maxPartySize = normalized.maxPartySize
        product.availableDaysJson = objectMapper.writeValueAsString(normalized.availableDays.map { it.name })
        product.availableStartTime = normalized.availableStartTime
        product.availableEndTime = normalized.availableEndTime
        product.slotCapacity = normalized.slotCapacity

        audit(owner, "RESERVATION_PRODUCT_UPDATED", product.id, before, product.snapshot(), metadata)
        return product.toResponse()
    }

    @Transactional
    fun delete(
        principal: BusinessPrincipal,
        productId: Long,
        metadata: ReservationProductRequestMetadata,
    ) {
        val owner = owner(principal)
        val product = ownedProduct(principal, productId)
        val before = product.snapshot()
        product.visible = false
        product.status = ReservationProductStatus.DELETED
        audit(owner, "RESERVATION_PRODUCT_DELETED", product.id, before, product.snapshot(), metadata)
    }

    @Transactional(readOnly = true)
    fun publicProducts(restaurantId: Long): PublicReservationProductListResponse {
        val restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "공개 예약 상품을 찾을 수 없습니다.") }
        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 상품을 찾을 수 없습니다.")
        if (restaurant.status != RestaurantStatus.APPROVED || page.status != ReservationPageStatus.PUBLIC) {
            throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 상품을 찾을 수 없습니다.")
        }

        return PublicReservationProductListResponse(
            products = reservationProductRepository
                .findByRestaurantIdAndStatusAndVisibleTrueOrderByCreatedAtAscIdAsc(
                    restaurant.id,
                    ReservationProductStatus.ACTIVE,
                )
                .map { it.toPublicResponse() },
        )
    }

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

    private fun ownedRestaurant(principal: BusinessPrincipal): RestaurantEntity =
        restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    private fun ownedProduct(
        principal: BusinessPrincipal,
        productId: Long,
    ): ReservationProductEntity {
        val product = reservationProductRepository.findById(productId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.") }
        if (product.status == ReservationProductStatus.DELETED || product.restaurant.owner.id != principal.userId) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        }
        return product
    }

    private fun ReservationProductSaveRequest.normalized(): NormalizedReservationProductRequest {
        val normalizedName = name?.trim().orEmpty()
        if (normalizedName.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "상품명이 필요합니다.")
        }
        val normalizedPriceAmount = priceAmount ?: 0
        val normalizedMinPartySize = minPartySize ?: 1
        val normalizedMaxPartySize = maxPartySize ?: normalizedMinPartySize
        val normalizedSlotCapacity = slotCapacity ?: 1
        if (normalizedPriceAmount < 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "가격은 0 이상이어야 합니다.")
        }
        if (
            normalizedMinPartySize < 1 ||
            normalizedMaxPartySize < 1 ||
            normalizedMinPartySize > normalizedMaxPartySize
        ) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 인원 범위가 올바르지 않습니다.")
        }
        if (normalizedMaxPartySize > 20) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "단체 예약 상품은 MVP 범위에서 제외됩니다.")
        }
        if (normalizedSlotCapacity < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "슬롯 재고는 1 이상이어야 합니다.")
        }
        val days = availableDays
            ?.takeIf { it.isNotEmpty() }
            ?.map { it.parseDayOfWeek() }
            ?.distinct()
            ?: DayOfWeek.entries.toList()
        val startTime = availableStartTime.parseTime("availableStartTime")
        val endTime = availableEndTime.parseTime("availableEndTime")
        if ((startTime == null) != (endTime == null)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 가능 시작/종료 시간을 함께 입력해야 합니다.")
        }
        if (startTime != null && endTime != null && !startTime.isBefore(endTime)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 가능 시작 시간은 종료 시간보다 빨라야 합니다.")
        }

        return NormalizedReservationProductRequest(
            name = normalizedName,
            description = description?.trim()?.takeIf { it.isNotBlank() },
            priceAmount = normalizedPriceAmount,
            visible = visible ?: true,
            minPartySize = normalizedMinPartySize,
            maxPartySize = normalizedMaxPartySize,
            availableDays = days,
            availableStartTime = startTime,
            availableEndTime = endTime,
            slotCapacity = normalizedSlotCapacity,
        )
    }

    private fun String.parseDayOfWeek(): DayOfWeek =
        try {
            DayOfWeek.valueOf(trim().uppercase(Locale.ROOT))
        } catch (exception: IllegalArgumentException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 가능 요일 값이 올바르지 않습니다.", exception)
        }

    private fun String?.parseTime(fieldName: String): LocalTime? {
        if (this.isNullOrBlank()) {
            return null
        }
        return try {
            LocalTime.parse(this)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun ReservationProductEntity.toResponse(): ReservationProductResponse =
        ReservationProductResponse(
            id = id,
            restaurantId = restaurant.id,
            name = name,
            description = description,
            priceAmount = priceAmount,
            visible = visible,
            status = status,
            minPartySize = minPartySize,
            maxPartySize = maxPartySize,
            availableDays = parseAvailableDays(),
            availableStartTime = availableStartTime,
            availableEndTime = availableEndTime,
            slotCapacity = slotCapacity,
            paymentPolicyType = paymentPolicyType,
            paymentAmount = paymentAmount,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun ReservationProductEntity.toPublicResponse(): PublicReservationProductResponse =
        PublicReservationProductResponse(
            id = id,
            name = name,
            description = description,
            displayPrice = priceAmount,
            minPartySize = minPartySize,
            maxPartySize = maxPartySize,
            availableDays = parseAvailableDays(),
            availableStartTime = availableStartTime,
            availableEndTime = availableEndTime,
            requiresPayment = paymentPolicyType != ReservationProductPaymentPolicyType.NONE,
            depositAmount = paymentAmount ?: 0,
        )

    private fun ReservationProductEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "name" to name,
            "description" to description,
            "priceAmount" to priceAmount,
            "visible" to visible,
            "status" to status.name,
            "minPartySize" to minPartySize,
            "maxPartySize" to maxPartySize,
            "availableDays" to parseAvailableDays().map { it.name },
            "availableStartTime" to availableStartTime?.toString(),
            "availableEndTime" to availableEndTime?.toString(),
            "slotCapacity" to slotCapacity,
            "paymentPolicyType" to paymentPolicyType.name,
            "paymentAmount" to paymentAmount,
        )

    private fun ReservationProductEntity.parseAvailableDays(): List<DayOfWeek> =
        objectMapper.readValue<List<String>>(availableDaysJson)
            .map { DayOfWeek.valueOf(it) }

    private fun audit(
        actor: BusinessUserEntity,
        action: String,
        targetId: Long,
        before: Map<String, Any?>?,
        after: Map<String, Any?>,
        metadata: ReservationProductRequestMetadata,
    ) {
        auditLogService.record(
            actorUser = actor,
            actorRole = "OWNER",
            action = action,
            targetType = "reservation_product",
            targetId = targetId,
            beforeValue = before?.let { objectMapper.writeValueAsString(it) },
            afterValue = objectMapper.writeValueAsString(after),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
    }
}

private data class NormalizedReservationProductRequest(
    val name: String,
    val description: String?,
    val priceAmount: Long,
    val visible: Boolean,
    val minPartySize: Int,
    val maxPartySize: Int,
    val availableDays: List<DayOfWeek>,
    val availableStartTime: LocalTime?,
    val availableEndTime: LocalTime?,
    val slotCapacity: Int,
)
