package com.example.restaurant.restaurant

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeParseException
import java.util.Locale

@Service
class RestaurantSettingsService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val businessHourRepository: BusinessHourRepository,
    private val holidayRuleRepository: HolidayRuleRepository,
    private val storedFileRepository: StoredFileRepository,
    private val reservationProductRepository: ReservationProductRepository,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()
    private val reservedSlugs = setOf("admin", "api", "login", "owner", "reserve", "static")

    @Transactional(readOnly = true)
    fun current(principal: BusinessPrincipal): RestaurantSettingsResponse =
        restaurantRepository.findByOwnerId(principal.userId)
            ?.toSettingsResponse()
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    @Transactional
    fun updateRestaurant(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: RestaurantUpdateRequest,
        metadata: RestaurantSettingsRequestMetadata,
    ): RestaurantSettingsResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal, restaurantId)
        val before = restaurantAuditSnapshot(restaurant)

        restaurant.name = request.name.trimToNull()
        restaurant.description = request.description.trimToNull()
        restaurant.phone = request.phone.trimToNull()
        restaurant.addressLine1 = request.addressLine1.trimToNull()
        restaurant.addressLine2 = request.addressLine2.trimToNull()
        restaurant.postalCode = request.postalCode.trimToNull()
        restaurant.cuisineTypesJson = request.cuisineTypes
            ?.mapNotNull { it.trimToNull() }
            ?.takeIf { it.isNotEmpty() }
            ?.let { objectMapper.writeValueAsString(it) }
        restaurant.coverImageFile = fileOrNull(request.coverImageFileId, StoredFilePurpose.RESTAURANT_COVER_IMAGE, owner)

        audit(
            actor = owner,
            action = "RESTAURANT_UPDATED",
            targetType = "restaurant",
            targetId = restaurant.id,
            before = before,
            after = restaurantAuditSnapshot(restaurant),
            metadata = metadata,
        )

        return restaurant.toSettingsResponse()
    }

    @Transactional
    fun saveBusinessHours(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: BusinessHoursSaveRequest,
        metadata: RestaurantSettingsRequestMetadata,
    ): List<BusinessHourResponse> {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal, restaurantId)
        val entities = buildBusinessHourEntities(restaurant, request.hours)

        businessHourRepository.deleteByRestaurantId(restaurant.id)
        businessHourRepository.flush()
        val saved = businessHourRepository.saveAll(entities)

        audit(
            actor = owner,
            action = "BUSINESS_HOURS_UPDATED",
            targetType = "restaurant",
            targetId = restaurant.id,
            before = null,
            after = mapOf("count" to saved.size),
            metadata = metadata,
        )

        return saved.sortedBusinessHours().map { it.toResponse() }
    }

    @Transactional
    fun saveHolidayRules(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: HolidayRulesSaveRequest,
        metadata: RestaurantSettingsRequestMetadata,
    ): List<HolidayRuleResponse> {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal, restaurantId)
        val entities = request.rules.map { it.validateAndToEntity(restaurant) }

        holidayRuleRepository.deleteByRestaurantId(restaurant.id)
        holidayRuleRepository.flush()
        val saved = holidayRuleRepository.saveAll(entities)

        audit(
            actor = owner,
            action = "HOLIDAY_RULES_UPDATED",
            targetType = "restaurant",
            targetId = restaurant.id,
            before = null,
            after = mapOf("count" to saved.size),
            metadata = metadata,
        )

        return saved.sortedHolidayRules().map { it.toResponse() }
    }

    @Transactional
    fun updateReservationPage(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: ReservationPageSaveRequest,
        metadata: RestaurantSettingsRequestMetadata,
    ): ReservationPageSettingsResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal, restaurantId)
        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: reservationPageRepository.save(
                ReservationPageEntity(
                    restaurant = restaurant,
                    slug = restaurant.slug ?: generateUniqueSlug(restaurant),
                    status = ReservationPageStatus.PRIVATE,
                ),
            )
        val before = reservationPageAuditSnapshot(page)

        val requestedSlug = request.slug.trimToNull()
        if (requestedSlug != null && requestedSlug != page.slug) {
            validateSlug(requestedSlug, restaurant.id)
            page.slug = requestedSlug
            restaurant.slug = requestedSlug
        } else if (page.slug.isNullOrBlank()) {
            val generatedSlug = restaurant.slug ?: generateUniqueSlug(restaurant)
            validateSlug(generatedSlug, restaurant.id)
            page.slug = generatedSlug
            restaurant.slug = generatedSlug
        }

        val now = Instant.now(clock)
        when (request.status) {
            ReservationPageStatus.PUBLIC -> {
                val blockers = publishBlockers(restaurant, page)
                if (blockers.isNotEmpty()) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 페이지를 공개할 수 없습니다: ${blockers.joinToString(", ")}")
                }
                page.status = ReservationPageStatus.PUBLIC
                page.publishedAt = now
                page.unpublishedAt = null
            }
            ReservationPageStatus.PRIVATE -> {
                if (page.status == ReservationPageStatus.PUBLIC) {
                    page.unpublishedAt = now
                }
                page.status = ReservationPageStatus.PRIVATE
            }
            ReservationPageStatus.DRAFT,
            ReservationPageStatus.DISABLED -> throw ApiException(ErrorCode.BAD_REQUEST, "예약 페이지 상태는 PUBLIC 또는 PRIVATE만 설정할 수 있습니다.")
        }

        audit(
            actor = owner,
            action = "RESERVATION_PAGE_UPDATED",
            targetType = "reservation_page",
            targetId = page.id,
            before = before,
            after = reservationPageAuditSnapshot(page),
            metadata = metadata,
        )

        return page.toSettingsResponse()
    }

    @Transactional(readOnly = true)
    fun publicRestaurant(slug: String): PublicRestaurantResponse {
        val page = reservationPageRepository.findBySlug(slug)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다.")
        return publicRestaurant(page)
    }

    @Transactional(readOnly = true)
    fun publicRestaurantById(restaurantId: Long): PublicRestaurantResponse {
        val restaurant = restaurantRepository.findById(restaurantId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다.") }
        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다.")
        return publicRestaurant(page)
    }

    @Transactional(readOnly = true)
    fun publicRestaurants(): PublicRestaurantListResponse {
        val restaurants = restaurantRepository
            .findAllByOrderByIdAsc()
            .map { restaurant ->
                val page = reservationPageRepository.findByRestaurantId(restaurant.id)
                val reservationProductCount = reservationProductRepository
                    .countByRestaurantIdAndStatusAndVisibleTrue(
                        restaurant.id,
                        ReservationProductStatus.ACTIVE,
                    )
                restaurant.toPublicListItem(page, reservationProductCount)
            }

        return PublicRestaurantListResponse(restaurants = restaurants)
    }

    private fun publicRestaurant(page: ReservationPageEntity): PublicRestaurantResponse {
        val restaurant = page.restaurant
        if (
            page.status != ReservationPageStatus.PUBLIC ||
            restaurant.status != RestaurantStatus.APPROVED ||
            publishBlockers(restaurant, page).isNotEmpty()
        ) {
            throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다.")
        }

        return restaurant.toPublicResponse(page)
    }

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

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

    private fun buildBusinessHourEntities(
        restaurant: RestaurantEntity,
        items: List<BusinessHourSaveItem>,
    ): List<BusinessHourEntity> {
        val normalized = items.groupBy { it.dayOfWeek.parseDayOfWeek("dayOfWeek") }
        val entities = mutableListOf<BusinessHourEntity>()

        normalized.forEach { (dayOfWeek, dayItems) ->
            if (dayItems.any { it.closed == true }) {
                if (dayItems.size > 1) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "전체 휴무 요일에는 영업 구간을 함께 저장할 수 없습니다.")
                }
                val item = dayItems.single()
                if (item.opensAt != null || item.closesAt != null) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "전체 휴무 요일에는 시간을 입력할 수 없습니다.")
                }
                entities += BusinessHourEntity(
                    restaurant = restaurant,
                    dayOfWeek = dayOfWeek,
                    sequence = 1,
                    closed = true,
                )
                return@forEach
            }

            val sorted = dayItems.sortedBy { it.opensAt }
            sorted.forEachIndexed { index, item ->
                val opensAt = item.opensAt.parseTime("opensAt")
                    ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "영업 시작 시간이 필요합니다.")
                val closesAt = item.closesAt.parseTime("closesAt")
                    ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "영업 종료 시간이 필요합니다.")
                if (!opensAt.isBefore(closesAt)) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "영업 시작 시간은 종료 시간보다 빨라야 합니다.")
                }
                val previousClosesAt = sorted.getOrNull(index - 1)?.closesAt.parseTime("closesAt")
                if (previousClosesAt != null && previousClosesAt.isAfter(opensAt)) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "같은 요일의 영업 구간은 겹칠 수 없습니다.")
                }
                entities += BusinessHourEntity(
                    restaurant = restaurant,
                    dayOfWeek = dayOfWeek,
                    sequence = index + 1,
                    opensAt = opensAt,
                    closesAt = closesAt,
                )
            }
        }

        return entities.sortedBusinessHours()
    }

    private fun HolidayRuleSaveItem.validateAndToEntity(restaurant: RestaurantEntity): HolidayRuleEntity {
        val parsedType = type.parseHolidayRuleType()
        val parsedDayOfWeek = dayOfWeek.parseDayOfWeekOrNull("dayOfWeek")
        val parsedDate = date.parseDate("date")
        val parsedStartTime = startTime.parseTime("startTime")
        val parsedEndTime = endTime.parseTime("endTime")

        if (parsedStartTime != null && parsedEndTime != null && !parsedStartTime.isBefore(parsedEndTime)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "휴무 시작 시간은 종료 시간보다 빨라야 합니다.")
        }
        when (parsedType) {
            HolidayRuleType.WEEKLY -> {
                requireField(parsedDayOfWeek, "dayOfWeek")
            }
            HolidayRuleType.MONTHLY_DATE -> {
                if (dayOfMonth == null || dayOfMonth !in 1..31) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "dayOfMonth는 1부터 31 사이여야 합니다.")
                }
            }
            HolidayRuleType.MONTHLY_NTH_WEEKDAY -> {
                requireField(parsedDayOfWeek, "dayOfWeek")
                if (weekOfMonth == null || weekOfMonth !in 1..5) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "weekOfMonth는 1부터 5 사이여야 합니다.")
                }
            }
            HolidayRuleType.TEMPORARY_DATE -> {
                requireField(parsedDate, "date")
            }
            HolidayRuleType.TEMPORARY_TIME -> {
                requireField(parsedDate, "date")
                requireField(parsedStartTime, "startTime")
                requireField(parsedEndTime, "endTime")
            }
        }

        return HolidayRuleEntity(
            restaurant = restaurant,
            type = parsedType,
            dayOfWeek = parsedDayOfWeek,
            dayOfMonth = dayOfMonth,
            weekOfMonth = weekOfMonth,
            date = parsedDate,
            startTime = parsedStartTime,
            endTime = parsedEndTime,
            reason = reason.trimToNull(),
        )
    }

    private fun publishBlockers(
        restaurant: RestaurantEntity,
        page: ReservationPageEntity,
    ): List<String> {
        val blockers = mutableListOf<String>()
        if (restaurant.status != RestaurantStatus.APPROVED) blockers += "restaurantStatus"
        if (restaurant.name.isNullOrBlank()) blockers += "name"
        if (restaurant.phone.isNullOrBlank()) blockers += "phone"
        if (restaurant.addressLine1.isNullOrBlank()) blockers += "addressLine1"
        if (parseCuisineTypes(restaurant.cuisineTypesJson).isEmpty()) blockers += "cuisineTypes"
        if (page.slug.isNullOrBlank()) blockers += "slug"
        if (!businessHourRepository.existsByRestaurantId(restaurant.id)) blockers += "businessHours"
        return blockers
    }

    private fun fileOrNull(
        fileId: Long?,
        purpose: StoredFilePurpose,
        owner: BusinessUserEntity,
    ): StoredFileEntity? {
        if (fileId == null) {
            return null
        }
        val file = storedFileRepository.findById(fileId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.") }
        if (file.purpose != purpose) {
            throw ApiException(ErrorCode.BAD_REQUEST, "파일 용도가 올바르지 않습니다.")
        }
        if (file.createdBy?.id != owner.id) {
            throw ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.")
        }
        return file
    }

    private fun validateSlug(slug: String, restaurantId: Long) {
        if (slug in reservedSlugs) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "예약 페이지 slug로 사용할 수 없는 값입니다.")
        }
        val restaurant = restaurantRepository.findBySlug(slug)
        val page = reservationPageRepository.findBySlug(slug)
        if ((restaurant != null && restaurant.id != restaurantId) || (page != null && page.restaurant.id != restaurantId)) {
            throw ApiException(ErrorCode.CONFLICT, "이미 사용 중인 예약 페이지 slug입니다.")
        }
    }

    private fun generateUniqueSlug(restaurant: RestaurantEntity): String {
        val base = restaurant.name
            ?.lowercase(Locale.ROOT)
            ?.replace(Regex("[^a-z0-9]+"), "-")
            ?.trim('-')
            ?.take(48)
            ?.trim('-')
            ?.takeIf { it.isNotBlank() }
            ?: "restaurant-${restaurant.id}"

        var candidate = base.take(60)
        if (isSlugAvailable(candidate, restaurant.id)) {
            return candidate
        }
        candidate = appendSlugSuffix(base, "-${restaurant.id}")
        if (isSlugAvailable(candidate, restaurant.id)) {
            return candidate
        }

        var sequence = 2
        while (true) {
            candidate = appendSlugSuffix(base, "-${restaurant.id}-$sequence")
            if (isSlugAvailable(candidate, restaurant.id)) {
                return candidate
            }
            sequence += 1
        }
    }

    private fun appendSlugSuffix(base: String, suffix: String): String =
        "${base.take(60 - suffix.length).trim('-')}$suffix"

    private fun isSlugAvailable(slug: String, restaurantId: Long): Boolean {
        val restaurant = restaurantRepository.findBySlug(slug)
        val page = reservationPageRepository.findBySlug(slug)
        return (restaurant == null || restaurant.id == restaurantId) &&
            (page == null || page.restaurant.id == restaurantId)
    }

    private fun audit(
        actor: BusinessUserEntity,
        action: String,
        targetType: String,
        targetId: Long,
        before: Map<String, Any?>?,
        after: Map<String, Any?>,
        metadata: RestaurantSettingsRequestMetadata,
    ) {
        auditLogService.record(
            actorUser = actor,
            actorRole = "OWNER",
            action = action,
            targetType = targetType,
            targetId = targetId,
            beforeValue = before?.let { objectMapper.writeValueAsString(it) },
            afterValue = objectMapper.writeValueAsString(after),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )
    }

    private fun restaurantAuditSnapshot(restaurant: RestaurantEntity): Map<String, Any?> =
        mapOf(
            "name" to restaurant.name,
            "phone" to restaurant.phone,
            "addressLine1" to restaurant.addressLine1,
            "cuisineTypes" to parseCuisineTypes(restaurant.cuisineTypesJson),
            "coverImageFileId" to restaurant.coverImageFile?.id,
        )

    private fun reservationPageAuditSnapshot(page: ReservationPageEntity): Map<String, Any?> =
        mapOf(
            "slug" to page.slug,
            "status" to page.status.name,
            "publishedAt" to page.publishedAt?.toString(),
            "unpublishedAt" to page.unpublishedAt?.toString(),
        )

    private fun RestaurantEntity.toSettingsResponse(): RestaurantSettingsResponse {
        val page = reservationPageRepository.findByRestaurantId(id)
        return RestaurantSettingsResponse(
            id = id,
            status = status,
            name = name,
            slug = slug,
            description = description,
            phone = phone,
            addressLine1 = addressLine1,
            addressLine2 = addressLine2,
            postalCode = postalCode,
            cuisineTypes = parseCuisineTypes(cuisineTypesJson),
            coverImageFileId = coverImageFile?.id,
            timezone = timezone,
            approvedAt = approvedAt,
            reservationPage = page?.toSettingsResponse(),
            businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(id)
                .sortedBusinessHours()
                .map { it.toResponse() },
            holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(id)
                .sortedHolidayRules()
                .map { it.toResponse() },
        )
    }

    private fun RestaurantEntity.toPublicResponse(page: ReservationPageEntity): PublicRestaurantResponse {
        val pageSlug = page.slug ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다.")
        return PublicRestaurantResponse(
            id = id,
            name = name ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다."),
            slug = pageSlug,
            description = description,
            phone = phone ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다."),
            addressLine1 = addressLine1 ?: throw ApiException(ErrorCode.NOT_FOUND, "공개 예약 페이지를 찾을 수 없습니다."),
            addressLine2 = addressLine2,
            postalCode = postalCode,
            cuisineTypes = parseCuisineTypes(cuisineTypesJson),
            coverImageFileId = coverImageFile?.id,
            coverImageUrl = coverImageFile?.id?.let { "/api/public/files/$it" },
            timezone = timezone,
            businessHours = businessHourRepository.findByRestaurantIdOrderByDayOfWeekAscSequenceAsc(id)
                .sortedBusinessHours()
                .map { it.toResponse() },
            holidayRules = holidayRuleRepository.findByRestaurantIdOrderByTypeAscDateAscDayOfWeekAscIdAsc(id)
                .sortedHolidayRules()
                .map { it.toResponse() },
            reservationPage = PublicReservationPageResponse(
                status = page.status,
                publishedAt = page.publishedAt,
                publicUrl = "/r/$pageSlug",
                reservationAvailable = true,
            ),
        )
    }

    private fun RestaurantEntity.toPublicListItem(
        page: ReservationPageEntity?,
        reservationProductCount: Long,
    ): PublicRestaurantListItemResponse {
        val pageSlug = page?.slug ?: slug ?: id.toString()
        val publicUrl = page?.slug?.let { "/r/$it" } ?: "/reserve/$id"
        return PublicRestaurantListItemResponse(
            id = id,
            name = name ?: "매장명 미정",
            slug = pageSlug,
            description = description,
            phone = phone ?: "전화번호 미정",
            addressLine1 = addressLine1 ?: "주소 준비 중",
            addressLine2 = addressLine2,
            cuisineTypes = parseCuisineTypes(cuisineTypesJson),
            coverImageFileId = coverImageFile?.id,
            coverImageUrl = coverImageFile?.id?.let { "/api/public/files/$it" },
            publicUrl = publicUrl,
            reservationProductCount = reservationProductCount,
            publishedAt = page?.publishedAt,
        )
    }

    private fun ReservationPageEntity.toSettingsResponse(): ReservationPageSettingsResponse {
        val blockers = publishBlockers(restaurant, this)
        return ReservationPageSettingsResponse(
            id = id,
            slug = slug,
            status = status,
            publishedAt = publishedAt,
            unpublishedAt = unpublishedAt,
            publicUrl = slug?.let { "/r/$it" },
            publishable = blockers.isEmpty(),
            publishBlockers = blockers,
        )
    }

    private fun BusinessHourEntity.toResponse(): BusinessHourResponse =
        BusinessHourResponse(
            id = id,
            dayOfWeek = dayOfWeek,
            sequence = sequence,
            opensAt = opensAt,
            closesAt = closesAt,
            closed = closed,
        )

    private fun HolidayRuleEntity.toResponse(): HolidayRuleResponse =
        HolidayRuleResponse(
            id = id,
            type = type,
            dayOfWeek = dayOfWeek,
            dayOfMonth = dayOfMonth,
            weekOfMonth = weekOfMonth,
            date = date,
            startTime = startTime,
            endTime = endTime,
            reason = reason,
        )

    private fun List<BusinessHourEntity>.sortedBusinessHours(): List<BusinessHourEntity> =
        sortedWith(compareBy<BusinessHourEntity> { it.dayOfWeek.value }.thenBy { it.sequence })

    private fun List<HolidayRuleEntity>.sortedHolidayRules(): List<HolidayRuleEntity> =
        sortedWith(compareBy<HolidayRuleEntity> { it.type.name }.thenBy { it.date }.thenBy { it.dayOfWeek?.value ?: 0 }.thenBy { it.id })

    private fun parseCuisineTypes(cuisineTypesJson: String?): List<String> {
        if (cuisineTypesJson.isNullOrBlank()) {
            return emptyList()
        }
        return objectMapper.readValue<List<String>>(cuisineTypesJson)
    }

    private fun <T> requireField(value: T?, name: String): T =
        value ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "$name 값이 필요합니다.")

    private fun String?.parseDate(field: String): LocalDate? =
        parseTemporal(field) { LocalDate.parse(it) }

    private fun String?.parseTime(field: String): LocalTime? =
        parseTemporal(field) { LocalTime.parse(it) }

    private fun String.parseDayOfWeek(field: String): DayOfWeek =
        try {
            DayOfWeek.valueOf(trim().uppercase(Locale.ROOT))
        } catch (exception: IllegalArgumentException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$field 값이 올바르지 않습니다.")
        }

    private fun String?.parseDayOfWeekOrNull(field: String): DayOfWeek? =
        trimToNull()?.parseDayOfWeek(field)

    private fun String.parseHolidayRuleType(): HolidayRuleType =
        try {
            HolidayRuleType.valueOf(trim().uppercase(Locale.ROOT))
        } catch (exception: IllegalArgumentException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "type 값이 올바르지 않습니다.")
        }

    private fun <T> String?.parseTemporal(
        field: String,
        parser: (String) -> T,
    ): T? {
        val value = trimToNull() ?: return null
        return try {
            parser(value)
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$field 형식이 올바르지 않습니다.")
        }
    }

    private fun String?.trimToNull(): String? =
        this?.trim()?.takeIf { it.isNotEmpty() }
}

data class RestaurantSettingsRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)
