package com.example.restaurant.reservationproduct

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.payment.CancellationPolicyEntity
import com.example.restaurant.payment.CancellationPolicyRepository
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
import java.time.Instant
import java.time.LocalTime
import java.time.format.DateTimeParseException
import java.util.Locale

@Service
class ReservationProductService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val cancellationPolicyRepository: CancellationPolicyRepository,
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
    fun updatePaymentPolicy(
        principal: BusinessPrincipal,
        productId: Long,
        request: ReservationProductPaymentPolicyRequest,
        metadata: ReservationProductRequestMetadata,
    ): ReservationProductPaymentPolicyResponse {
        val owner = owner(principal)
        val product = ownedProduct(principal, productId)
        val before = product.snapshot()
        val normalized = request.normalized(product)

        product.paymentPolicyType = normalized.paymentPolicyType
        product.paymentAmount = normalized.paymentAmount

        audit(owner, "RESERVATION_PRODUCT_PAYMENT_POLICY_UPDATED", product.id, before, product.snapshot(), metadata)
        return product.toPaymentPolicyResponse()
    }

    @Transactional
    fun upsertCancellationPolicy(
        principal: BusinessPrincipal,
        productId: Long,
        request: ReservationProductCancellationPolicyRequest,
        metadata: ReservationProductRequestMetadata,
    ): ReservationProductCancellationPolicyResponse {
        val owner = owner(principal)
        val product = ownedProduct(principal, productId)
        val activePolicies = cancellationPolicyRepository
            .findByReservationProductIdAndActiveOrderByEffectiveFromDesc(product.id, true)
        val before = activePolicies.map { it.snapshot() }
        val normalized = request.normalized()

        activePolicies.forEach { it.active = false }
        val policy = cancellationPolicyRepository.saveAndFlush(
            CancellationPolicyEntity(
                restaurant = product.restaurant,
                reservationProduct = product,
                name = normalized.name,
                rulesJson = objectMapper.writeValueAsString(normalized.rules),
                noShowRuleJson = normalized.noShowRule?.let { objectMapper.writeValueAsString(it) },
                restaurantCancelRefundRate = normalized.restaurantCancelRefundRate,
                active = true,
                effectiveFrom = normalized.effectiveFrom,
            ),
        )

        audit(
            actor = owner,
            action = "RESERVATION_PRODUCT_CANCELLATION_POLICY_UPDATED",
            targetId = product.id,
            before = before.takeIf { it.isNotEmpty() },
            after = policy.snapshot(),
            metadata = metadata,
        )
        return policy.toResponse()
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

    private fun ReservationProductPaymentPolicyRequest.normalized(
        product: ReservationProductEntity,
    ): NormalizedPaymentPolicyRequest {
        val type = paymentPolicyType
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "paymentPolicyType이 필요합니다.")
        val normalizedAmount = paymentAmount?.takeIf { it > 0 }

        return when (type) {
            ReservationProductPaymentPolicyType.DEPOSIT -> {
                val amount = normalizedAmount
                    ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "예약금 정책에는 paymentAmount가 필요합니다.")
                NormalizedPaymentPolicyRequest(type, amount)
            }
            ReservationProductPaymentPolicyType.PREPAID -> {
                if (product.priceAmount <= 0) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "전액 선결제 정책은 상품 가격이 0보다 커야 합니다.")
                }
                if (normalizedAmount != null) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "전액 선결제 금액은 상품 가격과 예약 인원으로 계산됩니다.")
                }
                NormalizedPaymentPolicyRequest(type, null)
            }
            ReservationProductPaymentPolicyType.CARD_GUARANTEE,
            ReservationProductPaymentPolicyType.PAY_ON_SITE,
            ReservationProductPaymentPolicyType.FREE,
            ReservationProductPaymentPolicyType.NONE,
            -> {
                if (normalizedAmount != null) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "${type.name} 정책에는 paymentAmount를 설정할 수 없습니다.")
                }
                NormalizedPaymentPolicyRequest(type, null)
            }
        }
    }

    private fun ReservationProductCancellationPolicyRequest.normalized(): NormalizedCancellationPolicyRequest {
        val normalizedName = name?.trim().orEmpty()
        if (normalizedName.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 정책명이 필요합니다.")
        }
        if (normalizedName.length > 120) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 정책명은 120자 이하여야 합니다.")
        }
        val normalizedRules = rules
            ?.takeIf { it.isNotEmpty() }
            ?.mapIndexed { index, rule -> rule.normalized(index) }
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 정책 rules가 필요합니다.")
        if (normalizedRules.map { it.beforeVisitHours }.distinct().size != normalizedRules.size) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "취소 정책 기준 시간은 중복될 수 없습니다.")
        }
        val normalizedRestaurantCancelRefundRate = restaurantCancelRefundRate ?: 100
        if (normalizedRestaurantCancelRefundRate !in 0..100) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "restaurantCancelRefundRate는 0 이상 100 이하여야 합니다.")
        }

        return NormalizedCancellationPolicyRequest(
            name = normalizedName,
            rules = normalizedRules.sortedByDescending { it.beforeVisitHours },
            noShowRule = noShowRule?.normalized(),
            restaurantCancelRefundRate = normalizedRestaurantCancelRefundRate,
            effectiveFrom = effectiveFrom ?: Instant.now(),
        )
    }

    private fun CancellationPolicyRuleRequest.normalized(index: Int): NormalizedCancellationPolicyRule {
        val beforeVisitHours = beforeVisitHours
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "rules[$index].beforeVisitHours가 필요합니다.")
        val refundRate = refundRate
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "rules[$index].refundRate가 필요합니다.")
        if (beforeVisitHours < 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "beforeVisitHours는 0 이상이어야 합니다.")
        }
        if (refundRate !in 0..100) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "refundRate는 0 이상 100 이하여야 합니다.")
        }
        return NormalizedCancellationPolicyRule(
            id = "rule_${beforeVisitHours}h_$refundRate",
            beforeVisitHours = beforeVisitHours,
            refundRate = refundRate,
        )
    }

    private fun CancellationPolicyNoShowRuleRequest.normalized(): NormalizedCancellationPolicyNoShowRule {
        val normalizedRefundRate = refundRate ?: 0
        val normalizedFeeAmount = feeAmount
        if (normalizedRefundRate !in 0..100) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "noShowRule.refundRate는 0 이상 100 이하여야 합니다.")
        }
        if ((normalizedFeeAmount ?: 0) < 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "noShowRule.feeAmount는 0 이상이어야 합니다.")
        }
        return NormalizedCancellationPolicyNoShowRule(
            refundRate = normalizedRefundRate,
            feeAmount = normalizedFeeAmount,
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

    private fun ReservationProductEntity.toPaymentPolicyResponse(): ReservationProductPaymentPolicyResponse =
        ReservationProductPaymentPolicyResponse(
            productId = id,
            paymentPolicyType = paymentPolicyType,
            paymentAmount = paymentAmount,
            updatedAt = updatedAt,
        )

    private fun CancellationPolicyEntity.toResponse(): ReservationProductCancellationPolicyResponse {
        val rules = objectMapper.readValue<List<CancellationPolicyRuleResponse>>(rulesJson)
        val noShowRule = noShowRuleJson?.let {
            objectMapper.readValue<CancellationPolicyNoShowRuleResponse>(it)
        }
        return ReservationProductCancellationPolicyResponse(
            policyId = id,
            productId = reservationProduct.id,
            active = active,
            name = name,
            rules = rules,
            noShowRule = noShowRule,
            restaurantCancelRefundRate = restaurantCancelRefundRate,
            effectiveFrom = effectiveFrom,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }

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
            requiresPayment = paymentPolicyType in setOf(
                ReservationProductPaymentPolicyType.DEPOSIT,
                ReservationProductPaymentPolicyType.PREPAID,
                ReservationProductPaymentPolicyType.CARD_GUARANTEE,
            ),
            depositAmount = paymentAmount ?: 0,
            paymentPolicyType = paymentPolicyType,
            paymentAmount = paymentAmount,
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

    private fun CancellationPolicyEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "policyId" to id,
            "productId" to reservationProduct.id,
            "name" to name,
            "rules" to objectMapper.readTree(rulesJson),
            "noShowRule" to noShowRuleJson?.let { objectMapper.readTree(it) },
            "restaurantCancelRefundRate" to restaurantCancelRefundRate,
            "active" to active,
            "effectiveFrom" to effectiveFrom.toString(),
        )

    private fun ReservationProductEntity.parseAvailableDays(): List<DayOfWeek> =
        objectMapper.readValue<List<String>>(availableDaysJson)
            .map { DayOfWeek.valueOf(it) }

    private fun audit(
        actor: BusinessUserEntity,
        action: String,
        targetId: Long,
        before: Any?,
        after: Any,
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

private data class NormalizedPaymentPolicyRequest(
    val paymentPolicyType: ReservationProductPaymentPolicyType,
    val paymentAmount: Long?,
)

private data class NormalizedCancellationPolicyRequest(
    val name: String,
    val rules: List<NormalizedCancellationPolicyRule>,
    val noShowRule: NormalizedCancellationPolicyNoShowRule?,
    val restaurantCancelRefundRate: Int,
    val effectiveFrom: Instant,
)

private data class NormalizedCancellationPolicyRule(
    val id: String,
    val beforeVisitHours: Long,
    val refundRate: Int,
)

private data class NormalizedCancellationPolicyNoShowRule(
    val refundRate: Int,
    val feeAmount: Long?,
)
