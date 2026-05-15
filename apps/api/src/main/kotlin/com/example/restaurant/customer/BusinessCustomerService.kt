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
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant

private const val MAX_CUSTOMER_NAME_LENGTH = 80
private const val MAX_CUSTOMER_EMAIL_LENGTH = 255
private const val MAX_CUSTOMER_SHORT_FIELD_LENGTH = 40
private const val MAX_CUSTOMER_NOTE_LENGTH = 1000
private const val MAX_CUSTOMER_FLAG_REASON_LENGTH = 500
private const val MAX_CUSTOMER_PRIVACY_REASON_LENGTH = 255
private const val MERGE_WARNING = "고객 병합은 되돌릴 수 없으며, 병합된 고객의 개인정보는 익명화됩니다."
private const val ANONYMIZE_WARNING = "개인정보 익명화는 되돌릴 수 없으며, 예약 운영에 필요한 최소 이력만 유지됩니다."
private const val ANONYMIZED_NOTE_CONTENT = "개인정보 요청으로 삭제된 메모입니다."
private const val ANONYMIZED_CUSTOMER_NAME = "익명 고객"
private const val MERGED_CUSTOMER_NAME = "병합된 고객"
private const val ANONYMIZED_PHONE_PREFIX = "90000000"
private const val MERGED_PHONE_PREFIX = "91000000"

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

    @Transactional(readOnly = true)
    fun duplicateCandidates(
        principal: BusinessPrincipal,
    ): BusinessCustomerDuplicateCandidatesResponse {
        val restaurant = ownedRestaurant(principal)
        val customers = customerRepository.findByRestaurantIdOrderByCreatedAtDescIdDesc(restaurant.id)
            .filterNot { it.isAnonymizedCustomer() }
        val phoneGroups = customers
            .groupBy { it.phoneNumber }
            .filterValues { it.size > 1 }
            .map { (phoneNumber, groupCustomers) ->
                BusinessCustomerDuplicateCandidateGroupResponse(
                    matchType = BusinessCustomerDuplicateMatchType.PHONE,
                    matchKeyMasked = phoneNumber.maskedPhone(),
                    customers = groupCustomers.toDuplicateItems(),
                )
            }
        val emailGroups = customers
            .filter { !it.email.isNullOrBlank() }
            .groupBy { it.email!!.trim().lowercase() }
            .filterValues { it.size > 1 }
            .map { (email, groupCustomers) ->
                BusinessCustomerDuplicateCandidateGroupResponse(
                    matchType = BusinessCustomerDuplicateMatchType.EMAIL,
                    matchKeyMasked = email.maskedEmail(),
                    customers = groupCustomers.toDuplicateItems(),
                )
            }
        val groups = (phoneGroups + emailGroups)
            .sortedWith(compareBy({ it.matchType.name }, { it.matchKeyMasked }))
        return BusinessCustomerDuplicateCandidatesResponse(
            totalGroups = groups.size,
            groups = groups,
        )
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
    fun merge(
        principal: BusinessPrincipal,
        request: BusinessCustomerMergeRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerMergeResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalizedMergeRequest()
        val target = lockedCustomer(restaurant.id, normalized.targetCustomerId)
        val before = target.snapshot()
        var movedReservationCount = 0
        var movedNoteCount = 0
        val sourceSnapshots = mutableListOf<Map<String, Any?>>()

        normalized.sourceCustomerIds.forEach { sourceCustomerId ->
            val source = lockedCustomer(restaurant.id, sourceCustomerId)
            sourceSnapshots += source.snapshot() + ("id" to source.id)
            target.absorbMissingProfile(source)
            movedReservationCount += reservationRepository.reassignCustomer(
                restaurantId = restaurant.id,
                sourceCustomerId = source.id,
                targetCustomer = target,
            )
            movedNoteCount += customerNoteRepository.reassignCustomer(
                restaurantId = restaurant.id,
                sourceCustomerId = source.id,
                targetCustomer = target,
            )
            val sourceBefore = sourceSnapshots.last()
            source.anonymizeProfile(
                displayName = MERGED_CUSTOMER_NAME,
                phonePrefix = MERGED_PHONE_PREFIX,
            )
            audit(
                actor = owner,
                action = "CUSTOMER_MERGE_SOURCE_ANONYMIZED",
                targetType = "customer",
                targetId = source.id,
                before = sourceBefore,
                after = source.snapshot() + mapOf(
                    "mergedIntoCustomerId" to target.id,
                    "reason" to normalized.reason,
                    "warning" to MERGE_WARNING,
                ),
                metadata = metadata,
            )
        }

        audit(
            actor = owner,
            action = "CUSTOMER_MERGED",
            targetType = "customer",
            targetId = target.id,
            before = before,
            after = target.snapshot() + mapOf(
                "sourceCustomerIds" to normalized.sourceCustomerIds,
                "sourceSnapshots" to sourceSnapshots,
                "movedReservationCount" to movedReservationCount,
                "movedNoteCount" to movedNoteCount,
                "reason" to normalized.reason,
                "warning" to MERGE_WARNING,
            ),
            metadata = metadata,
        )

        return BusinessCustomerMergeResponse(
            targetCustomerId = target.id,
            mergedCustomerIds = normalized.sourceCustomerIds,
            movedReservationCount = movedReservationCount,
            movedNoteCount = movedNoteCount,
            anonymizedCustomerIds = normalized.sourceCustomerIds,
            warning = MERGE_WARNING,
        )
    }

    @Transactional
    fun anonymize(
        principal: BusinessPrincipal,
        customerId: Long,
        request: BusinessCustomerAnonymizeRequest,
        metadata: BusinessCustomerRequestMetadata,
    ): BusinessCustomerAnonymizeResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal)
        val normalized = request.normalizedAnonymizeRequest()
        val customer = lockedCustomer(restaurant.id, customerId)
        val before = customer.snapshot()
        val notes = customerNoteRepository
            .findByRestaurantIdAndCustomerIdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(restaurant.id, customer.id)
        val now = Instant.now(clock)
        notes.forEach { note ->
            note.noteType = CustomerNoteType.PRIVACY_REQUEST
            note.content = ANONYMIZED_NOTE_CONTENT
            note.deletedAt = now
        }
        customer.anonymizeProfile(
            displayName = ANONYMIZED_CUSTOMER_NAME,
            phonePrefix = ANONYMIZED_PHONE_PREFIX,
        )
        audit(
            actor = owner,
            action = "CUSTOMER_ANONYMIZED",
            targetType = "customer",
            targetId = customer.id,
            before = before,
            after = customer.snapshot() + mapOf(
                "deletedNoteCount" to notes.size,
                "reason" to normalized.reason,
                "warning" to ANONYMIZE_WARNING,
            ),
            metadata = metadata,
        )
        return BusinessCustomerAnonymizeResponse(
            customerId = customer.id,
            anonymized = true,
            anonymizedName = customer.name,
            anonymizedPhoneMasked = customer.phoneNumber.maskedPhone(),
            deletedNoteCount = notes.size,
            warning = ANONYMIZE_WARNING,
        )
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

    private fun lockedCustomer(
        restaurantId: Long,
        customerId: Long,
    ): CustomerEntity =
        customerRepository.findByRestaurantIdAndIdForUpdate(restaurantId, customerId)
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

    private fun BusinessCustomerMergeRequest.normalizedMergeRequest(): NormalizedCustomerMergeRequest {
        if (confirmIrreversible != true) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "되돌릴 수 없는 고객 병합 작업 확인이 필요합니다.")
        }
        val normalizedTargetCustomerId = targetCustomerId
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "targetCustomerId가 필요합니다.")
        if (normalizedTargetCustomerId < 1) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "targetCustomerId가 올바르지 않습니다.")
        }
        val normalizedSourceCustomerIds = sourceCustomerIds
            ?.distinct()
            ?.takeIf { it.isNotEmpty() }
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "sourceCustomerIds가 필요합니다.")
        if (normalizedSourceCustomerIds.any { it < 1 }) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "sourceCustomerIds가 올바르지 않습니다.")
        }
        if (normalizedTargetCustomerId in normalizedSourceCustomerIds) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "기준 고객과 병합 대상 고객은 달라야 합니다.")
        }
        return NormalizedCustomerMergeRequest(
            targetCustomerId = normalizedTargetCustomerId,
            sourceCustomerIds = normalizedSourceCustomerIds,
            reason = reason.normalizedPrivacyReason(),
        )
    }

    private fun BusinessCustomerAnonymizeRequest.normalizedAnonymizeRequest(): NormalizedCustomerAnonymizeRequest {
        if (confirmIrreversible != true) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "되돌릴 수 없는 개인정보 익명화 작업 확인이 필요합니다.")
        }
        return NormalizedCustomerAnonymizeRequest(reason = reason.normalizedPrivacyReason())
    }

    private fun String?.normalizedPrivacyReason(): String? {
        val normalized = trimOrNull() ?: return null
        if (normalized.length > MAX_CUSTOMER_PRIVACY_REASON_LENGTH) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "reason은 255자 이하여야 합니다.")
        }
        return normalized
    }

    private fun String?.normalizedText(
        maxLength: Int,
        fieldName: String,
    ): String? {
        val normalized = trimOrNull() ?: return null
        if (normalized.length > maxLength) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "${fieldName}은 ${maxLength}자 이하여야 합니다.")
        }
        return normalized
    }

    private fun String?.trimOrNull(): String? =
        this?.trim()?.takeIf { it.isNotBlank() }

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

    private fun List<CustomerEntity>.toDuplicateItems(): List<BusinessCustomerDuplicateCandidateItemResponse> =
        sortedBy { it.id }.map { customer ->
            BusinessCustomerDuplicateCandidateItemResponse(
                id = customer.id,
                name = customer.name,
                phoneMasked = customer.phoneNumber.maskedPhone(),
                email = customer.email,
                reservationCount = reservationRepository.countByCustomerId(customer.id),
                noteCount = customerNoteRepository.countByCustomerIdAndDeletedAtIsNull(customer.id),
                vip = customer.vip,
                caution = customer.caution,
                blocked = customer.blocked,
                createdAt = customer.createdAt,
                updatedAt = customer.updatedAt,
            )
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

    private fun CustomerEntity.absorbMissingProfile(source: CustomerEntity) {
        email = email ?: source.email
        allergyNote = allergyNote ?: source.allergyNote
        anniversaryType = anniversaryType ?: source.anniversaryType
        anniversaryDate = anniversaryDate ?: source.anniversaryDate
        preferenceNote = preferenceNote ?: source.preferenceNote
        internalNote = internalNote ?: source.internalNote
        vip = vip || source.vip
        caution = caution || source.caution
        cautionReason = cautionReason ?: source.cautionReason
        blocked = blocked || source.blocked
        blockedReason = blockedReason ?: source.blockedReason
    }

    private fun CustomerEntity.anonymizeProfile(
        displayName: String,
        phonePrefix: String,
    ) {
        name = displayName
        phoneNumber = syntheticPhoneNumber(phonePrefix, id)
        email = null
        allergyNote = null
        anniversaryType = null
        anniversaryDate = null
        preferenceNote = null
        internalNote = null
        vip = false
        caution = false
        cautionReason = null
        blocked = false
        blockedReason = null
    }

    private fun CustomerEntity.isAnonymizedCustomer(): Boolean =
        phoneNumber.startsWith(ANONYMIZED_PHONE_PREFIX) || phoneNumber.startsWith(MERGED_PHONE_PREFIX)

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
            customerEmail = customerEmail,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            requestTemplateValues = requestTemplateValues(),
            marketingOptIn = marketingOptIn,
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

    private fun ReservationEntity.requestTemplateValues(): List<String> =
        requestTemplateValuesJson?.let { objectMapper.readValue<List<String>>(it) }.orEmpty()

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

    private fun String.maskedEmail(): String {
        val atIndex = indexOf("@")
        if (atIndex <= 0) {
            return "***"
        }
        val local = take(atIndex)
        val domain = drop(atIndex + 1)
        val maskedLocal = when {
            local.length == 1 -> "*"
            local.length == 2 -> "${local.first()}*"
            else -> "${local.first()}***${local.last()}"
        }
        return "$maskedLocal@$domain"
    }

    private fun syntheticPhoneNumber(
        prefix: String,
        customerId: Long,
    ): String =
        prefix + customerId.toString().padStart(12, '0').takeLast(12)
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

private data class NormalizedCustomerMergeRequest(
    val targetCustomerId: Long,
    val sourceCustomerIds: List<Long>,
    val reason: String?,
)

private data class NormalizedCustomerAnonymizeRequest(
    val reason: String?,
)
