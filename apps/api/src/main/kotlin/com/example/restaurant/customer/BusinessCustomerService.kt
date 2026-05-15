package com.example.restaurant.customer

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservation.CustomerEntity
import com.example.restaurant.reservation.CustomerRepository
import com.example.restaurant.reservation.ReservationEntity
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

private const val MAX_CUSTOMER_NAME_LENGTH = 80
private const val MAX_CUSTOMER_EMAIL_LENGTH = 255
private const val MAX_CUSTOMER_SHORT_FIELD_LENGTH = 40
private const val MAX_CUSTOMER_NOTE_LENGTH = 1000
private const val MAX_CUSTOMER_FLAG_REASON_LENGTH = 500

@Service
class BusinessCustomerService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val customerRepository: CustomerRepository,
    private val reservationRepository: ReservationRepository,
    private val customerNoteRepository: CustomerNoteRepository,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun list(
        principal: BusinessPrincipal,
        query: String?,
    ): BusinessCustomerListResponse {
        val restaurant = ownedRestaurant(principal)
        val normalizedQuery = query?.trim()?.takeIf { it.isNotBlank() }
        val items = customerRepository.findByRestaurantIdOrderByCreatedAtDescIdDesc(restaurant.id)
            .filter { it.matches(normalizedQuery) }
            .map { it.toListItem() }
        return BusinessCustomerListResponse(items = items, totalCount = items.size)
    }

    @Transactional
    fun detail(
        principal: BusinessPrincipal,
        customerId: Long,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val customer = ownedCustomer(restaurant.id, customerId)
        audit(
            actor = owner,
            action = "CUSTOMER_VIEWED",
            targetType = "customer",
            targetId = customer.id,
            before = null,
            after = mapOf("customerId" to customer.id),
            metadata = metadata,
        )
        return customer.toDetail()
    }

    @Transactional
    fun reservations(
        principal: BusinessPrincipal,
        customerId: Long,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerReservationsResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val customer = ownedCustomer(restaurant.id, customerId)
        audit(
            actor = owner,
            action = "CUSTOMER_RESERVATIONS_VIEWED",
            targetType = "customer",
            targetId = customer.id,
            before = null,
            after = mapOf("customerId" to customer.id),
            metadata = metadata,
        )
        return BusinessCustomerReservationsResponse(
            customer = customer.toHistoryCustomer(),
            stats = customer.stats(),
            items = reservationRepository
                .findByRestaurantIdAndCustomerIdOrderByVisitDateDescStartTimeDescIdDesc(restaurant.id, customer.id)
                .map { it.toCustomerReservationSummary() },
        )
    }

    @Transactional
    fun create(
        principal: BusinessPrincipal,
        request: BusinessCustomerSaveRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalized(existing = null)
        ensurePhoneAvailable(restaurant.id, normalized.phoneNumber, existingCustomerId = null)
        val customer = customerRepository.saveAndFlush(
            CustomerEntity(
                restaurant = restaurant,
                name = normalized.name,
                phoneNumber = normalized.phoneNumber,
                email = normalized.email,
                allergyNote = normalized.allergyNote,
                anniversaryType = normalized.anniversaryType,
                anniversaryDate = normalized.anniversaryDate,
                preferenceNote = normalized.preferenceNote,
                internalNote = normalized.internalNote,
            ),
        )
        audit(owner, "CUSTOMER_CREATED", "customer", customer.id, null, customer.snapshot(), metadata)
        return customer.toDetail()
    }

    @Transactional
    fun update(
        principal: BusinessPrincipal,
        customerId: Long,
        request: BusinessCustomerSaveRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerDetailResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val customer = ownedCustomer(restaurant.id, customerId)
        val before = customer.snapshot()
        val normalized = request.normalized(existing = customer)
        ensurePhoneAvailable(restaurant.id, normalized.phoneNumber, existingCustomerId = customer.id)

        customer.name = normalized.name
        customer.phoneNumber = normalized.phoneNumber
        customer.email = normalized.email
        customer.allergyNote = normalized.allergyNote
        customer.anniversaryType = normalized.anniversaryType
        customer.anniversaryDate = normalized.anniversaryDate
        customer.preferenceNote = normalized.preferenceNote
        customer.internalNote = normalized.internalNote

        audit(owner, "CUSTOMER_UPDATED", "customer", customer.id, before, customer.snapshot(), metadata)
        return customer.toDetail()
    }

    @Transactional
    fun updateFlags(
        principal: BusinessPrincipal,
        customerId: Long,
        request: BusinessCustomerFlagUpdateRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerFlagsResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val customer = ownedCustomer(restaurant.id, customerId)
        val before = customer.snapshot()
        val normalized = request.normalizedFlags(customer)

        customer.vip = normalized.vip
        customer.caution = normalized.caution
        customer.cautionReason = normalized.cautionReason
        customer.blocked = normalized.blocked
        customer.blockedReason = normalized.blockedReason

        audit(owner, "CUSTOMER_FLAGS_UPDATED", "customer", customer.id, before, customer.snapshot(), metadata)
        return customer.toFlagsResponse()
    }

    @Transactional
    fun createNote(
        principal: BusinessPrincipal,
        customerId: Long,
        request: BusinessCustomerNoteSaveRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerNoteResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val customer = ownedCustomer(restaurant.id, customerId)
        val normalized = request.normalizedNote(existing = null)
        val note = customerNoteRepository.saveAndFlush(
            CustomerNoteEntity(
                restaurant = restaurant,
                customer = customer,
                authorUser = owner,
                noteType = normalized.noteType,
                content = normalized.content,
            ),
        )
        audit(owner, "CUSTOMER_NOTE_CREATED", "customer_note", note.id, null, note.snapshot(), metadata)
        return note.toResponse()
    }

    @Transactional
    fun updateNote(
        principal: BusinessPrincipal,
        noteId: Long,
        request: BusinessCustomerNoteSaveRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerNoteResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val note = ownedNote(restaurant.id, noteId)
        val before = note.snapshot()
        val normalized = request.normalizedNote(existing = note)
        note.noteType = normalized.noteType
        note.content = normalized.content
        audit(owner, "CUSTOMER_NOTE_UPDATED", "customer_note", note.id, before, note.snapshot(), metadata)
        return note.toResponse()
    }

    @Transactional
    fun deleteNote(
        principal: BusinessPrincipal,
        noteId: Long,
        metadata: BusinessCustomerRequestMetadata,
    ) {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val note = ownedNote(restaurant.id, noteId)
        val before = note.snapshot()
        note.deletedAt = Instant.now(clock)
        audit(owner, "CUSTOMER_NOTE_DELETED", "customer_note", note.id, before, note.snapshot(), metadata)
    }

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

    private fun ownedRestaurant(principal: BusinessPrincipal): RestaurantEntity =
        restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    private fun ownedCustomer(
        restaurantId: Long,
        customerId: Long,
    ): CustomerEntity =
        customerRepository.findByRestaurantIdAndId(restaurantId, customerId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "고객을 찾을 수 없습니다.")

    private fun ownedNote(
        restaurantId: Long,
        noteId: Long,
    ): CustomerNoteEntity =
        customerNoteRepository.findByRestaurantIdAndIdAndDeletedAtIsNull(restaurantId, noteId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "고객 메모를 찾을 수 없습니다.")

    private fun ensurePhoneAvailable(
        restaurantId: Long,
        phoneNumber: String,
        existingCustomerId: Long?,
    ) {
        val duplicated = if (existingCustomerId == null) {
            customerRepository.findByRestaurantIdAndPhoneNumber(restaurantId, phoneNumber) != null
        } else {
            customerRepository.existsByRestaurantIdAndPhoneNumberAndIdNot(restaurantId, phoneNumber, existingCustomerId)
        }
        if (duplicated) {
            throw ApiException(ErrorCode.CONFLICT, "같은 전화번호의 고객이 이미 있습니다.")
        }
    }

    private fun BusinessCustomerSaveRequest.normalized(existing: CustomerEntity?): NormalizedCustomer {
        val normalizedName = name?.trim()?.takeIf { it.isNotBlank() } ?: existing?.name
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "고객명이 필요합니다.")
        if (normalizedName.length > MAX_CUSTOMER_NAME_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "고객명은 80자 이하여야 합니다.")
        }
        val normalizedPhone = phoneNumber?.filter { it.isDigit() } ?: existing?.phoneNumber
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "phoneNumber가 필요합니다.")
        if (normalizedPhone.length !in 8..20) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "phoneNumber가 유효하지 않습니다.")
        }
        val normalizedEmail = email.normalizedText(MAX_CUSTOMER_EMAIL_LENGTH, "email") ?: existing?.email
        val normalizedAllergyNote = allergyNote.normalizedText(MAX_CUSTOMER_NOTE_LENGTH, "allergyNote")
            ?: existing?.allergyNote
        val normalizedAnniversaryType = anniversaryType.normalizedText(MAX_CUSTOMER_SHORT_FIELD_LENGTH, "anniversaryType")
            ?: existing?.anniversaryType
        val normalizedAnniversaryDate = anniversaryDate.normalizedText(10, "anniversaryDate")
            ?: existing?.anniversaryDate
        val normalizedPreferenceNote = preferenceNote.normalizedText(MAX_CUSTOMER_NOTE_LENGTH, "preferenceNote")
            ?: existing?.preferenceNote
        val normalizedInternalNote = internalNote.normalizedText(MAX_CUSTOMER_NOTE_LENGTH, "internalNote")
            ?: existing?.internalNote
        return NormalizedCustomer(
            name = normalizedName,
            phoneNumber = normalizedPhone,
            email = normalizedEmail,
            allergyNote = normalizedAllergyNote,
            anniversaryType = normalizedAnniversaryType,
            anniversaryDate = normalizedAnniversaryDate,
            preferenceNote = normalizedPreferenceNote,
            internalNote = normalizedInternalNote,
        )
    }

    private fun BusinessCustomerNoteSaveRequest.normalizedNote(
        existing: CustomerNoteEntity?,
    ): NormalizedCustomerNote {
        val normalizedContent = content?.trim()?.takeIf { it.isNotBlank() } ?: existing?.content
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "content가 필요합니다.")
        if (normalizedContent.length > MAX_CUSTOMER_NOTE_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "content는 1000자 이하여야 합니다.")
        }
        return NormalizedCustomerNote(
            noteType = noteType ?: existing?.noteType ?: CustomerNoteType.GENERAL,
            content = normalizedContent,
        )
    }

    private fun BusinessCustomerFlagUpdateRequest.normalizedFlags(
        existing: CustomerEntity,
    ): NormalizedCustomerFlags {
        val normalizedVip = vip ?: existing.vip
        val normalizedCaution = caution ?: existing.caution
        val normalizedBlocked = blocked ?: existing.blocked
        val normalizedCautionReason = if (normalizedCaution) {
            cautionReason.normalizedOptionalText(
                maxLength = MAX_CUSTOMER_FLAG_REASON_LENGTH,
                fieldName = "cautionReason",
                existing = existing.cautionReason,
            )
        } else {
            null
        }
        val normalizedBlockedReason = if (normalizedBlocked) {
            blockedReason.normalizedOptionalText(
                maxLength = MAX_CUSTOMER_FLAG_REASON_LENGTH,
                fieldName = "blockedReason",
                existing = existing.blockedReason,
            )
        } else {
            null
        }
        return NormalizedCustomerFlags(
            vip = normalizedVip,
            caution = normalizedCaution,
            cautionReason = normalizedCautionReason,
            blocked = normalizedBlocked,
            blockedReason = normalizedBlockedReason,
        )
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

    private fun String?.normalizedOptionalText(
        maxLength: Int,
        fieldName: String,
        existing: String?,
    ): String? {
        if (this == null) {
            return existing
        }
        val normalized = trim().takeIf { it.isNotBlank() }
        if ((normalized?.length ?: 0) > maxLength) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}은 ${maxLength}자 이하여야 합니다.")
        }
        return normalized
    }

    private fun CustomerEntity.matches(query: String?): Boolean {
        if (query == null) {
            return true
        }
        val digits = query.filter { it.isDigit() }
        return name.contains(query, ignoreCase = true) ||
            (email?.contains(query, ignoreCase = true) == true) ||
            (digits.isNotBlank() && phoneNumber.contains(digits))
    }

    private fun CustomerEntity.toListItem(): BusinessCustomerListItemResponse {
        val stats = stats()
        return BusinessCustomerListItemResponse(
            id = id,
            name = name,
            phoneMasked = phoneNumber.maskedPhone(),
            email = email,
            allergyNote = allergyNote,
            preferenceNote = preferenceNote,
            reservationCount = stats.reservationCount,
            completedCount = stats.completedCount,
            noShowCount = stats.noShowCount,
            vip = vip,
            caution = caution,
            blocked = blocked,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
    }

    private fun CustomerEntity.toHistoryCustomer(): BusinessCustomerHistoryCustomerResponse =
        BusinessCustomerHistoryCustomerResponse(
            id = id,
            name = name,
            phoneMasked = phoneNumber.maskedPhone(),
            email = email,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            preferenceNote = preferenceNote,
            vip = vip,
            caution = caution,
            cautionReason = cautionReason,
            blocked = blocked,
            blockedReason = blockedReason,
        )

    private fun CustomerEntity.toDetail(): BusinessCustomerDetailResponse =
        BusinessCustomerDetailResponse(
            id = id,
            name = name,
            phoneNumber = phoneNumber,
            phoneMasked = phoneNumber.maskedPhone(),
            email = email,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            preferenceNote = preferenceNote,
            internalNote = internalNote,
            vip = vip,
            caution = caution,
            cautionReason = cautionReason,
            blocked = blocked,
            blockedReason = blockedReason,
            stats = stats(),
            notes = customerNoteRepository
                .findByCustomerIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(id)
                .map { it.toResponse() },
            recentReservations = reservationRepository
                .findByCustomerIdOrderByVisitDateDescStartTimeDescIdDesc(id)
                .take(20)
                .map { it.toCustomerReservationSummary() },
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun CustomerEntity.toFlagsResponse(): BusinessCustomerFlagsResponse =
        BusinessCustomerFlagsResponse(
            customerId = id,
            vip = vip,
            caution = caution,
            cautionReason = cautionReason,
            blocked = blocked,
            blockedReason = blockedReason,
            updatedAt = updatedAt,
        )

    private fun CustomerEntity.stats(): BusinessCustomerStatsResponse =
        BusinessCustomerStatsResponse(
            reservationCount = reservationRepository.countByCustomerId(id),
            completedCount = reservationRepository.countByCustomerIdAndStatus(id, ReservationStatus.COMPLETED),
            cancelledCount = reservationRepository.countByCustomerIdAndStatusIn(
                id,
                listOf(ReservationStatus.CANCELLED_BY_CUSTOMER, ReservationStatus.CANCELLED_BY_RESTAURANT),
            ),
            noShowCount = reservationRepository.countByCustomerIdAndStatus(id, ReservationStatus.NO_SHOW),
        )

    private fun ReservationEntity.toCustomerReservationSummary(): BusinessCustomerReservationSummaryResponse =
        BusinessCustomerReservationSummaryResponse(
            id = id,
            reservationNumber = reservationNumber,
            productId = reservationProduct.id,
            productName = reservationProduct.name,
            visitDate = visitDate,
            startTime = startTime,
            endTime = endTime,
            partySize = partySize,
            status = status.name,
            source = source.name,
            customerRequest = customerRequest,
            completedAt = completedAt,
            noShowAt = noShowAt,
            cancelledAt = cancelledAt,
            cancelReason = cancelReason,
        )

    private fun CustomerNoteEntity.toResponse(): BusinessCustomerNoteResponse =
        BusinessCustomerNoteResponse(
            id = id,
            customerId = customer.id,
            noteType = noteType,
            visibility = visibility,
            content = content,
            authorUserId = authorUser.id,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun CustomerEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "name" to name,
            "phoneNumber" to phoneNumber,
            "email" to email,
            "allergyNote" to allergyNote,
            "anniversaryType" to anniversaryType,
            "anniversaryDate" to anniversaryDate,
            "preferenceNote" to preferenceNote,
            "internalNote" to internalNote,
            "vip" to vip,
            "caution" to caution,
            "cautionReason" to cautionReason,
            "blocked" to blocked,
            "blockedReason" to blockedReason,
        )

    private fun CustomerNoteEntity.snapshot(): Map<String, Any?> =
        mapOf(
            "customerId" to customer.id,
            "noteType" to noteType.name,
            "visibility" to visibility.name,
            "content" to content,
            "deletedAt" to deletedAt?.toString(),
        )

    private fun audit(
        actor: BusinessUserEntity,
        action: String,
        targetType: String,
        targetId: Long,
        before: Map<String, Any?>?,
        after: Map<String, Any?>,
        metadata: BusinessCustomerRequestMetadata,
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

    private fun String.maskedPhone(): String =
        when {
            length >= 11 -> "${take(3)}-****-${takeLast(4)}"
            length >= 8 -> "****${takeLast(4)}"
            else -> "****"
        }
}

private data class NormalizedCustomer(
    val name: String,
    val phoneNumber: String,
    val email: String?,
    val allergyNote: String?,
    val anniversaryType: String?,
    val anniversaryDate: String?,
    val preferenceNote: String?,
    val internalNote: String?,
)

private data class NormalizedCustomerNote(
    val noteType: CustomerNoteType,
    val content: String,
)

private data class NormalizedCustomerFlags(
    val vip: Boolean,
    val caution: Boolean,
    val cautionReason: String?,
    val blocked: Boolean,
    val blockedReason: String?,
)
