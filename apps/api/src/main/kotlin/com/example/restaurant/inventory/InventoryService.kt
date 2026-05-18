package com.example.restaurant.inventory

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

private const val MAX_STANDARD_TABLE_PARTY_SIZE = 8
private const val DEFAULT_SLOT_INTERVAL_MINUTES = 30
private const val DEFAULT_DURATION_MINUTES = 90

@Service
class InventoryService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val restaurantTableRepository: RestaurantTableRepository,
    private val tableCombinationRepository: TableCombinationRepository,
    private val seatRuleRepository: ReservationProductSeatRuleRepository,
    private val auditLogService: AuditLogService,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun listTables(principal: BusinessPrincipal): RestaurantTableListResponse {
        val restaurant = ownedRestaurant(principal)
        val tables = restaurantTableRepository
            .findByRestaurantIdOrderBySortOrderAscIdAsc(restaurant.id)
            .map { it.toResponse() }
        return RestaurantTableListResponse(
            summary = RestaurantTableSummaryResponse(
                totalCount = tables.size,
                activeCount = tables.count { it.isActive },
                totalCapacity = tables.filter { it.isActive }.sumOf { it.maxPartySize },
                roomCount = tables.count { it.isActive && it.seatType == SeatType.ROOM },
            ),
            items = tables,
        )
    }

    @Transactional
    fun createTable(
        principal: BusinessPrincipal,
        request: RestaurantTableSaveRequest,
    ): RestaurantTableResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalizedTable(existing = null)
        ensureTableNameAvailable(restaurant.id, normalized.name, existingTableId = null)
        val table = restaurantTableRepository.saveAndFlush(
            RestaurantTableEntity(
                restaurant = restaurant,
                name = normalized.name,
                seatType = normalized.seatType,
                seatTypeLabel = normalized.seatTypeLabel,
                minPartySize = normalized.minPartySize,
                maxPartySize = normalized.maxPartySize,
                active = normalized.active,
                sortOrder = normalized.sortOrder,
                internalNote = normalized.internalNote,
            ),
        )
        audit(owner, "RESTAURANT_TABLE_CREATED", "restaurant_table", table.id, null, table.snapshot())
        return table.toResponse()
    }

    @Transactional
    fun updateTable(
        principal: BusinessPrincipal,
        tableId: Long,
        request: RestaurantTableSaveRequest,
    ): RestaurantTableResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val table = ownedTable(restaurant.id, tableId)
        val before = table.snapshot()
        val normalized = request.normalizedTable(table)
        ensureTableNameAvailable(restaurant.id, normalized.name, existingTableId = table.id)

        table.name = normalized.name
        table.seatType = normalized.seatType
        table.seatTypeLabel = normalized.seatTypeLabel
        table.minPartySize = normalized.minPartySize
        table.maxPartySize = normalized.maxPartySize
        table.active = normalized.active
        table.sortOrder = normalized.sortOrder
        table.internalNote = normalized.internalNote

        audit(owner, "RESTAURANT_TABLE_UPDATED", "restaurant_table", table.id, before, table.snapshot())
        return table.toResponse()
    }

    @Transactional(readOnly = true)
    fun listCombinations(principal: BusinessPrincipal): List<TableCombinationResponse> {
        val restaurant = ownedRestaurant(principal)
        return tableCombinationRepository
            .findByRestaurantIdOrderByIdAsc(restaurant.id)
            .map { it.toResponse() }
    }

    @Transactional
    fun createCombination(
        principal: BusinessPrincipal,
        request: TableCombinationSaveRequest,
    ): TableCombinationResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalizedCombination(restaurant.id, existing = null)
        ensureCombinationNameAvailable(restaurant.id, normalized.name, existingCombinationId = null)
        val combination = tableCombinationRepository.saveAndFlush(
            TableCombinationEntity(
                restaurant = restaurant,
                name = normalized.name,
                tableIdsJson = objectMapper.writeValueAsString(normalized.tableIds),
                minPartySize = normalized.minPartySize,
                maxPartySize = normalized.maxPartySize,
                active = normalized.active,
            ),
        )
        audit(owner, "TABLE_COMBINATION_CREATED", "table_combination", combination.id, null, combination.snapshot())
        return combination.toResponse()
    }

    @Transactional
    fun updateCombination(
        principal: BusinessPrincipal,
        combinationId: Long,
        request: TableCombinationSaveRequest,
    ): TableCombinationResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val combination = ownedCombination(restaurant.id, combinationId)
        val before = combination.snapshot()
        val normalized = request.normalizedCombination(restaurant.id, combination)
        ensureCombinationNameAvailable(restaurant.id, normalized.name, existingCombinationId = combination.id)

        combination.name = normalized.name
        combination.tableIdsJson = objectMapper.writeValueAsString(normalized.tableIds)
        combination.minPartySize = normalized.minPartySize
        combination.maxPartySize = normalized.maxPartySize
        combination.active = normalized.active

        audit(owner, "TABLE_COMBINATION_UPDATED", "table_combination", combination.id, before, combination.snapshot())
        return combination.toResponse()
    }

    @Transactional(readOnly = true)
    fun seatRules(
        principal: BusinessPrincipal,
        productId: Long,
    ): ReservationProductSeatRuleResponse {
        val restaurant = ownedRestaurant(principal)
        val product = ownedProduct(restaurant.id, productId)
        return (seatRuleRepository.findByReservationProductId(product.id) ?: defaultSeatRule(product))
            .toResponse(product)
    }

    @Transactional
    fun saveSeatRules(
        principal: BusinessPrincipal,
        productId: Long,
        request: ReservationProductSeatRuleSaveRequest,
    ): ReservationProductSeatRuleResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val product = ownedProduct(restaurant.id, productId)
        val normalized = request.normalizedSeatRule(restaurant.id)
        val existing = seatRuleRepository.findByReservationProductId(product.id)
        val before = existing?.snapshot(product)
        val rule = existing ?: ReservationProductSeatRuleEntity(
            restaurant = restaurant,
            reservationProduct = product,
        )

        rule.allowedSeatTypesJson = normalized.allowedSeatTypes
            .takeIf { it.isNotEmpty() }
            ?.let { objectMapper.writeValueAsString(it.map { seatType -> seatType.name }) }
        rule.allowedTableIdsJson = normalized.allowedTableIds
            .takeIf { it.isNotEmpty() }
            ?.let { objectMapper.writeValueAsString(it) }
        rule.defaultDurationMinutes = normalized.defaultDurationMinutes
        rule.slotIntervalMinutes = normalized.slotIntervalMinutes
        rule.inventoryPolicy = normalized.inventoryPolicy

        val saved = seatRuleRepository.saveAndFlush(rule)
        audit(
            owner,
            if (existing == null) "RESERVATION_PRODUCT_SEAT_RULE_CREATED" else "RESERVATION_PRODUCT_SEAT_RULE_UPDATED",
            "reservation_product_seat_rule",
            saved.id,
            before,
            saved.snapshot(product),
        )
        return saved.toResponse(product)
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
        if (product.restaurant.id != restaurantId || product.status == ReservationProductStatus.DELETED) {
            throw ApiException(ErrorCode.NOT_FOUND, "예약 상품을 찾을 수 없습니다.")
        }
        return product
    }

    private fun ownedTable(
        restaurantId: Long,
        tableId: Long,
    ): RestaurantTableEntity {
        val table = restaurantTableRepository.findById(tableId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "테이블을 찾을 수 없습니다.") }
        if (table.restaurant.id != restaurantId) {
            throw ApiException(ErrorCode.NOT_FOUND, "테이블을 찾을 수 없습니다.")
        }
        return table
    }

    private fun ownedCombination(
        restaurantId: Long,
        combinationId: Long,
    ): TableCombinationEntity {
        val combination = tableCombinationRepository.findById(combinationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "테이블 조합을 찾을 수 없습니다.") }
        if (combination.restaurant.id != restaurantId) {
            throw ApiException(ErrorCode.NOT_FOUND, "테이블 조합을 찾을 수 없습니다.")
        }
        return combination
    }

    private fun RestaurantTableSaveRequest.normalizedTable(existing: RestaurantTableEntity?): NormalizedTable {
        val normalizedName = name?.trim()?.takeIf { it.isNotBlank() } ?: existing?.name
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "테이블명이 필요합니다.")
        if (normalizedName.length > 80) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "테이블명은 80자 이하여야 합니다.")
        }
        val normalizedSeatType = seatType ?: existing?.seatType
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "seatType이 필요합니다.")
        val normalizedSeatTypeLabel = seatTypeLabel?.trim()?.takeIf { it.isNotBlank() }
            ?: existing?.seatTypeLabel
            ?: normalizedSeatType.defaultLabel()
        if (normalizedSeatTypeLabel.length > 80) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "좌석 유형 표시명은 80자 이하여야 합니다.")
        }
        val normalizedMinPartySize = minPartySize ?: existing?.minPartySize ?: 1
        val normalizedMaxPartySize = maxPartySize ?: existing?.maxPartySize ?: normalizedMinPartySize
        validatePartyRange(normalizedMinPartySize, normalizedMaxPartySize)
        val normalizedInternalNote = internalNote?.trim()?.takeIf { it.isNotBlank() } ?: existing?.internalNote
        val normalizedActive = active ?: isActive ?: existing?.active ?: true
        if ((normalizedInternalNote?.length ?: 0) > 1000) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "내부 메모는 1000자 이하여야 합니다.")
        }
        return NormalizedTable(
            name = normalizedName,
            seatType = normalizedSeatType,
            seatTypeLabel = normalizedSeatTypeLabel,
            minPartySize = normalizedMinPartySize,
            maxPartySize = normalizedMaxPartySize,
            active = normalizedActive,
            sortOrder = sortOrder ?: existing?.sortOrder ?: 0,
            internalNote = normalizedInternalNote,
        )
    }

    private fun TableCombinationSaveRequest.normalizedCombination(
        restaurantId: Long,
        existing: TableCombinationEntity?,
    ): NormalizedTableCombination {
        val normalizedName = name?.trim()?.takeIf { it.isNotBlank() } ?: existing?.name
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "테이블 조합명이 필요합니다.")
        if (normalizedName.length > 80) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "테이블 조합명은 80자 이하여야 합니다.")
        }
        val normalizedTableIds = tableIds
            ?.distinct()
            ?: existing?.tableIds()
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "tableIds가 필요합니다.")
        if (normalizedTableIds.size < 2) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "테이블 조합은 2개 이상의 테이블이 필요합니다.")
        }
        val tables = ownedTables(restaurantId, normalizedTableIds)
        val normalizedMinPartySize = minPartySize ?: existing?.minPartySize ?: tables.minOf { it.minPartySize }
        val normalizedMaxPartySize = maxPartySize ?: existing?.maxPartySize ?: tables.sumOf { it.maxPartySize }
        validatePartyRange(normalizedMinPartySize, normalizedMaxPartySize)
        if (normalizedMaxPartySize > tables.sumOf { it.maxPartySize }) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "조합 최대 수용 인원은 포함 테이블 수용 인원 합을 초과할 수 없습니다.")
        }
        return NormalizedTableCombination(
            name = normalizedName,
            tableIds = normalizedTableIds.sorted(),
            minPartySize = normalizedMinPartySize,
            maxPartySize = normalizedMaxPartySize,
            active = active ?: existing?.active ?: true,
        )
    }

    private fun ReservationProductSeatRuleSaveRequest.normalizedSeatRule(
        restaurantId: Long,
    ): NormalizedSeatRule {
        val normalizedSeatTypes = allowedSeatTypes?.distinct().orEmpty()
        val normalizedTableIds = allowedTableIds?.distinct()?.sorted().orEmpty()
        if (normalizedTableIds.isNotEmpty()) {
            ownedTables(restaurantId, normalizedTableIds)
                .filter { !it.active }
                .takeIf { it.isNotEmpty() }
                ?.let { throw ApiException(ErrorCode.VALIDATION_ERROR, "비활성 테이블은 seat rule에 연결할 수 없습니다.") }
        }
        val duration = defaultDurationMinutes ?: DEFAULT_DURATION_MINUTES
        if (duration !in 30..240) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "defaultDurationMinutes는 30 이상 240 이하여야 합니다.")
        }
        val interval = slotIntervalMinutes ?: DEFAULT_SLOT_INTERVAL_MINUTES
        if (interval !in setOf(30, 60)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "slotIntervalMinutes는 30 또는 60이어야 합니다.")
        }
        return NormalizedSeatRule(
            allowedSeatTypes = normalizedSeatTypes,
            allowedTableIds = normalizedTableIds,
            defaultDurationMinutes = duration,
            slotIntervalMinutes = interval,
            inventoryPolicy = inventoryPolicy ?: InventoryPolicy.TABLE,
        )
    }

    private fun ownedTables(
        restaurantId: Long,
        tableIds: Collection<Long>,
    ): List<RestaurantTableEntity> {
        val tables = restaurantTableRepository.findByRestaurantIdAndIdIn(restaurantId, tableIds)
        if (tables.size != tableIds.toSet().size) {
            throw ApiException(ErrorCode.NOT_FOUND, "연결할 테이블을 찾을 수 없습니다.")
        }
        return tables
    }

    private fun ensureTableNameAvailable(
        restaurantId: Long,
        name: String,
        existingTableId: Long?,
    ) {
        val duplicated = restaurantTableRepository.findByRestaurantIdOrderBySortOrderAscIdAsc(restaurantId)
            .any { it.name == name && it.id != existingTableId }
        if (duplicated) {
            throw ApiException(ErrorCode.CONFLICT, "같은 이름의 테이블이 이미 있습니다.")
        }
    }

    private fun ensureCombinationNameAvailable(
        restaurantId: Long,
        name: String,
        existingCombinationId: Long?,
    ) {
        val duplicated = tableCombinationRepository.findByRestaurantIdOrderByIdAsc(restaurantId)
            .any { it.name == name && it.id != existingCombinationId }
        if (duplicated) {
            throw ApiException(ErrorCode.CONFLICT, "같은 이름의 테이블 조합이 이미 있습니다.")
        }
    }

    private fun validatePartyRange(
        minPartySize: Int,
        maxPartySize: Int,
    ) {
        if (minPartySize < 1 || maxPartySize < minPartySize) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "수용 인원 범위가 올바르지 않습니다.")
        }
        if (maxPartySize > MAX_STANDARD_TABLE_PARTY_SIZE) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "단체 예약/대관은 좌석 재고 관리 범위에서 제외됩니다.")
        }
    }

    private fun SeatType.defaultLabel(): String =
        when (this) {
            SeatType.HALL -> "홀"
            SeatType.ROOM -> "룸"
            SeatType.COUNTER -> "카운터"
            SeatType.BAR -> "바"
            SeatType.TERRACE -> "테라스"
        }

    private fun RestaurantTableEntity.toResponse(): RestaurantTableResponse =
        RestaurantTableResponse(
            id = id,
            restaurantId = restaurant.id,
            name = name,
            seatType = seatType,
            seatTypeLabel = seatTypeLabel,
            minPartySize = minPartySize,
            maxPartySize = maxPartySize,
            active = active,
            isActive = active,
            hasReservations = false,
            combinationPolicy = "NONE",
            combinationPolicyLabel = "단독 사용",
            sortOrder = sortOrder,
            internalNote = internalNote,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun TableCombinationEntity.toResponse(): TableCombinationResponse =
        TableCombinationResponse(
            id = id,
            restaurantId = restaurant.id,
            name = name,
            tableIds = tableIds(),
            minPartySize = minPartySize,
            maxPartySize = maxPartySize,
            active = active,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun ReservationProductSeatRuleEntity.toResponse(
        product: ReservationProductEntity = reservationProduct,
    ): ReservationProductSeatRuleResponse {
        val seatTypes = allowedSeatTypes()
        val tableIds = allowedTableIds()
        val allowedTables = if (tableIds.isEmpty()) {
            emptyList()
        } else {
            restaurantTableRepository.findByRestaurantIdAndIdIn(restaurant.id, tableIds)
                .sortedBy { tableIds.indexOf(it.id) }
        }
        val duration = defaultDurationMinutes ?: DEFAULT_DURATION_MINUTES
        val interval = slotIntervalMinutes ?: DEFAULT_SLOT_INTERVAL_MINUTES
        return ReservationProductSeatRuleResponse(
            productId = product.id,
            restaurantId = restaurant.id,
            allowedSeatTypes = seatTypes,
            allowedSeatTypeLabels = seatTypes.map { it.defaultLabel() },
            allowedTableIds = tableIds,
            allowedTables = allowedTables.map {
                ReservationProductSeatRuleTableResponse(
                    id = it.id,
                    name = it.name,
                    seatTypeLabel = it.seatTypeLabel,
                    maxPartySize = it.maxPartySize,
                    combinationPolicyLabel = "단독 사용",
                )
            },
            defaultDurationMinutes = duration,
            slotIntervalMinutes = interval,
            inventoryPolicy = inventoryPolicy,
            tableCombinationSummary = tableCombinationSummary(allowedTables),
            summary = seatRuleSummary(seatTypes, allowedTables, duration, interval),
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }

    private fun tableCombinationSummary(tables: List<RestaurantTableEntity>): String {
        if (tables.isEmpty()) {
            return "연결된 테이블이 없습니다."
        }
        val maxSingleTableSize = tables.maxOf { it.maxPartySize }
        val totalCapacity = tables.sumOf { it.maxPartySize }
        return "단일 테이블 최대 ${maxSingleTableSize}명 · 연결 수용 합계 ${totalCapacity}명"
    }

    private fun seatRuleSummary(
        seatTypes: List<SeatType>,
        tables: List<RestaurantTableEntity>,
        duration: Int,
        interval: Int,
    ): String {
        val seatTypeLabel = seatTypes.takeIf { it.isNotEmpty() }
            ?.joinToString(", ") { it.defaultLabel() }
            ?: "전체 좌석"
        return "${seatTypeLabel} · 테이블 ${tables.size}개 · ${duration}분 이용 · ${interval}분 간격"
    }

    private fun defaultSeatRule(product: ReservationProductEntity): ReservationProductSeatRuleEntity =
        ReservationProductSeatRuleEntity(
            restaurant = product.restaurant,
            reservationProduct = product,
            defaultDurationMinutes = DEFAULT_DURATION_MINUTES,
            slotIntervalMinutes = DEFAULT_SLOT_INTERVAL_MINUTES,
            inventoryPolicy = InventoryPolicy.TABLE,
        )

    private fun TableCombinationEntity.tableIds(): List<Long> =
        objectMapper.readValue<List<Long>>(tableIdsJson)

    private fun ReservationProductSeatRuleEntity.allowedSeatTypes(): List<SeatType> =
        allowedSeatTypesJson
            ?.let { objectMapper.readValue<List<String>>(it).map { value -> SeatType.valueOf(value) } }
            .orEmpty()

    private fun ReservationProductSeatRuleEntity.allowedTableIds(): List<Long> =
        allowedTableIdsJson?.let { objectMapper.readValue<List<Long>>(it) }.orEmpty()

    private fun RestaurantTableEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "name" to name,
            "seatType" to seatType.name,
            "seatTypeLabel" to seatTypeLabel,
            "minPartySize" to minPartySize,
            "maxPartySize" to maxPartySize,
            "active" to active,
            "sortOrder" to sortOrder,
        )

    private fun TableCombinationEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "name" to name,
            "tableIds" to tableIds(),
            "minPartySize" to minPartySize,
            "maxPartySize" to maxPartySize,
            "active" to active,
        )

    private fun ReservationProductSeatRuleEntity.snapshot(product: ReservationProductEntity): Map<String, Any?> =
        mapOf(
            "productId" to product.id,
            "allowedSeatTypes" to allowedSeatTypes().map { it.name },
            "allowedTableIds" to allowedTableIds(),
            "defaultDurationMinutes" to defaultDurationMinutes,
            "slotIntervalMinutes" to slotIntervalMinutes,
            "inventoryPolicy" to inventoryPolicy.name,
        )

    private fun audit(
        actor: BusinessUserEntity,
        action: String,
        targetType: String,
        targetId: Long,
        before: Map<String, Any?>?,
        after: Map<String, Any?>,
    ) {
        auditLogService.record(
            actorUser = actor,
            actorRole = "OWNER",
            action = action,
            targetType = targetType,
            targetId = targetId,
            beforeValue = before?.let { objectMapper.writeValueAsString(it) },
            afterValue = objectMapper.writeValueAsString(after),
        )
    }
}

private data class NormalizedTable(
    val name: String,
    val seatType: SeatType,
    val seatTypeLabel: String,
    val minPartySize: Int,
    val maxPartySize: Int,
    val active: Boolean,
    val sortOrder: Int,
    val internalNote: String?,
)

private data class NormalizedTableCombination(
    val name: String,
    val tableIds: List<Long>,
    val minPartySize: Int,
    val maxPartySize: Int,
    val active: Boolean,
)

private data class NormalizedSeatRule(
    val allowedSeatTypes: List<SeatType>,
    val allowedTableIds: List<Long>,
    val defaultDurationMinutes: Int,
    val slotIntervalMinutes: Int,
    val inventoryPolicy: InventoryPolicy,
)
