package com.example.restaurant.restaurantapplication

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessUserRole
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.restaurant.ReservationPageEntity
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.example.restaurant.restaurant.RestaurantStatus
import com.example.restaurant.restaurant.StoredFileEntity
import com.example.restaurant.restaurant.StoredFilePurpose
import com.example.restaurant.restaurant.StoredFileRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.util.Locale

@Service
class RestaurantApplicationService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val applicationRepository: RestaurantApplicationRepository,
    private val reservationPageRepository: ReservationPageRepository,
    private val storedFileRepository: StoredFileRepository,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun create(
        principal: BusinessPrincipal,
        request: RestaurantApplicationSaveRequest,
    ): RestaurantApplicationResponse {
        val owner = owner(principal)
        if (restaurantRepository.findByOwnerId(owner.id) != null) {
            throw ApiException(ErrorCode.CONFLICT, "이미 등록된 매장이 있습니다.")
        }

        val restaurant = restaurantRepository.save(
            RestaurantEntity(
                owner = owner,
                status = RestaurantStatus.DRAFT,
            ),
        )
        applyRestaurantFields(restaurant, request)
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name

        val application = applicationRepository.save(
            RestaurantApplicationEntity(
                restaurant = restaurant,
                status = RestaurantApplicationStatus.DRAFT,
            ),
        )
        applyApplicationFields(application, request)

        return application.toResponse()
    }

    @Transactional(readOnly = true)
    fun current(principal: BusinessPrincipal): RestaurantApplicationResponse {
        val restaurant = restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.")
        val application = applicationRepository.findTopByRestaurantIdOrderByCreatedAtDesc(restaurant.id)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.")

        return application.toResponse()
    }

    @Transactional
    fun update(
        principal: BusinessPrincipal,
        applicationId: Long,
        request: RestaurantApplicationSaveRequest,
    ): RestaurantApplicationResponse {
        val application = ownedApplication(principal, applicationId)

        when (application.status) {
            RestaurantApplicationStatus.DRAFT,
            RestaurantApplicationStatus.REJECTED -> {
                applyRestaurantFields(application.restaurant, request)
                applyApplicationFields(application, request)
            }
            RestaurantApplicationStatus.SUBMITTED -> {
                application.managerEmail = request.managerEmail?.trimToNull()
            }
            RestaurantApplicationStatus.APPROVED,
            RestaurantApplicationStatus.CANCELLED -> throw ApiException(ErrorCode.CONFLICT, "처리된 입점 신청은 수정할 수 없습니다.")
        }

        return application.toResponse()
    }

    @Transactional
    fun submit(
        principal: BusinessPrincipal,
        applicationId: Long,
        metadata: BusinessRequestMetadata,
    ): RestaurantApplicationResponse {
        val owner = owner(principal)
        val application = ownedApplication(principal, applicationId)
        val restaurant = application.restaurant

        if (application.status !in setOf(RestaurantApplicationStatus.DRAFT, RestaurantApplicationStatus.REJECTED)) {
            throw ApiException(ErrorCode.CONFLICT, "작성중 또는 반려된 입점 신청만 제출할 수 있습니다.")
        }
        if (applicationRepository.existsByRestaurantIdAndStatus(restaurant.id, RestaurantApplicationStatus.SUBMITTED)) {
            throw ApiException(ErrorCode.CONFLICT, "이미 제출된 입점 신청이 있습니다.")
        }

        validateForSubmit(restaurant, application)
        val businessRegistrationNo = application.businessRegistrationNo
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "사업자등록번호가 필요합니다.")
        if (
            applicationRepository.existsByBusinessRegistrationNoAndStatus(
                businessRegistrationNo,
                RestaurantApplicationStatus.APPROVED,
            )
        ) {
            throw ApiException(ErrorCode.CONFLICT, "이미 승인된 사업자등록번호입니다.")
        }

        val now = Instant.now(clock)
        application.status = RestaurantApplicationStatus.SUBMITTED
        application.submittedAt = now
        application.reviewedBy = null
        application.reviewedAt = null
        application.reviewNote = null
        application.rejectionReason = null
        restaurant.status = RestaurantStatus.APPROVAL_REQUESTED
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name

        auditLogService.record(
            actorUser = owner,
            actorRole = "OWNER",
            action = "RESTAURANT_APPLICATION_SUBMITTED",
            targetType = "restaurant_application",
            targetId = application.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "restaurantId" to restaurant.id,
                    "status" to application.status.name,
                    "restaurantStatus" to restaurant.status.name,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return application.toResponse()
    }

    @Transactional(readOnly = true)
    fun listForAdmin(
        principal: BusinessPrincipal,
        status: RestaurantApplicationStatus?,
    ): List<RestaurantApplicationResponse> {
        admin(principal)
        val applications = if (status == null) {
            applicationRepository.findAllByOrderBySubmittedAtDescIdDesc()
        } else {
            applicationRepository.findByStatusOrderBySubmittedAtDescIdDesc(status)
        }
        return applications.map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getForAdmin(
        principal: BusinessPrincipal,
        applicationId: Long,
    ): RestaurantApplicationResponse {
        admin(principal)
        return applicationRepository.findById(applicationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.") }
            .toResponse()
    }

    @Transactional
    fun approveForAdmin(
        principal: BusinessPrincipal,
        applicationId: Long,
        request: RestaurantApplicationReviewRequest,
        metadata: BusinessRequestMetadata,
    ): RestaurantApplicationResponse {
        val admin = admin(principal)
        val application = submittedApplication(applicationId)
        val restaurant = application.restaurant
        val now = Instant.now(clock)
        val reservationPage = ensureReservationPageForApproval(restaurant)

        application.status = RestaurantApplicationStatus.APPROVED
        application.reviewedBy = admin
        application.reviewedAt = now
        application.reviewNote = request.reviewNote.trimToNull()
        application.rejectionReason = null
        restaurant.status = RestaurantStatus.APPROVED
        restaurant.approvedAt = now
        restaurant.suspendedAt = null
        restaurant.owner.linkedRestaurantId = restaurant.id
        restaurant.owner.linkedRestaurantStatus = restaurant.status.name

        auditLogService.record(
            actorUser = admin,
            actorRole = "ADMIN",
            action = "RESTAURANT_APPLICATION_APPROVED",
            targetType = "restaurant_application",
            targetId = application.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "restaurantId" to restaurant.id,
                    "status" to application.status.name,
                    "restaurantStatus" to restaurant.status.name,
                    "reservationPageId" to reservationPage.id,
                    "slug" to restaurant.slug,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return application.toResponse()
    }

    @Transactional
    fun rejectForAdmin(
        principal: BusinessPrincipal,
        applicationId: Long,
        request: RestaurantApplicationRejectRequest,
        metadata: BusinessRequestMetadata,
    ): RestaurantApplicationResponse {
        val admin = admin(principal)
        val application = submittedApplication(applicationId)
        val restaurant = application.restaurant
        val now = Instant.now(clock)

        application.status = RestaurantApplicationStatus.REJECTED
        application.reviewedBy = admin
        application.reviewedAt = now
        application.reviewNote = request.reviewNote.trimToNull()
        application.rejectionReason = request.rejectionReason.trimToNull()
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "반려 사유가 필요합니다.")
        restaurant.status = RestaurantStatus.REJECTED
        restaurant.owner.linkedRestaurantId = restaurant.id
        restaurant.owner.linkedRestaurantStatus = restaurant.status.name

        auditLogService.record(
            actorUser = admin,
            actorRole = "ADMIN",
            action = "RESTAURANT_APPLICATION_REJECTED",
            targetType = "restaurant_application",
            targetId = application.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "restaurantId" to restaurant.id,
                    "status" to application.status.name,
                    "restaurantStatus" to restaurant.status.name,
                    "rejectionReason" to application.rejectionReason,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return application.toResponse()
    }

    private fun owner(principal: BusinessPrincipal): BusinessUserEntity =
        userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }

    private fun admin(principal: BusinessPrincipal): BusinessUserEntity {
        if (principal.role != BusinessUserRole.ADMIN) {
            throw ApiException(ErrorCode.ACCESS_DENIED)
        }
        return userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }
    }

    private fun submittedApplication(applicationId: Long): RestaurantApplicationEntity {
        val application = applicationRepository.findById(applicationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.") }
        if (application.status != RestaurantApplicationStatus.SUBMITTED) {
            throw ApiException(ErrorCode.CONFLICT, "제출된 입점 신청만 검토할 수 있습니다.")
        }
        return application
    }

    private fun ownedApplication(
        principal: BusinessPrincipal,
        applicationId: Long,
    ): RestaurantApplicationEntity {
        val application = applicationRepository.findById(applicationId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.") }
        if (application.restaurant.owner.id != principal.userId) {
            throw ApiException(ErrorCode.NOT_FOUND, "입점 신청을 찾을 수 없습니다.")
        }
        return application
    }

    private fun applyRestaurantFields(
        restaurant: RestaurantEntity,
        request: RestaurantApplicationSaveRequest,
    ) {
        restaurant.name = request.restaurantName.trimToNull()
        restaurant.description = request.restaurantDescription.trimToNull()
        restaurant.phone = request.restaurantPhone.trimToNull()
        restaurant.addressLine1 = request.addressLine1.trimToNull()
        restaurant.addressLine2 = request.addressLine2.trimToNull()
        restaurant.postalCode = request.postalCode.trimToNull()
        restaurant.cuisineTypesJson = request.cuisineTypes
            ?.mapNotNull { it.trimToNull() }
            ?.takeIf { it.isNotEmpty() }
            ?.let { objectMapper.writeValueAsString(it) }
        restaurant.coverImageFile = fileOrNull(request.coverImageFileId, StoredFilePurpose.RESTAURANT_COVER_IMAGE)
    }

    private fun applyApplicationFields(
        application: RestaurantApplicationEntity,
        request: RestaurantApplicationSaveRequest,
    ) {
        application.businessRegistrationNo = request.businessRegistrationNo.trimToNull()
        application.businessName = request.businessName.trimToNull()
        application.representativeName = request.representativeName.trimToNull()
        application.businessAddress = request.businessAddress.trimToNull()
        application.businessLicenseFile = fileOrNull(request.businessLicenseFileId, StoredFilePurpose.BUSINESS_LICENSE)
        application.managerName = request.managerName.trimToNull()
        application.managerPhone = request.managerPhone.trimToNull()
        application.managerEmail = request.managerEmail.trimToNull()
        if (request.contactVerified != null) {
            application.contactVerifiedAt = if (request.contactVerified) Instant.now(clock) else null
        }
    }

    private fun fileOrNull(
        fileId: Long?,
        purpose: StoredFilePurpose,
    ): StoredFileEntity? {
        if (fileId == null) {
            return null
        }
        val file = storedFileRepository.findById(fileId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.") }
        if (file.purpose != purpose) {
            throw ApiException(ErrorCode.BAD_REQUEST, "파일 용도가 올바르지 않습니다.")
        }
        return file
    }

    private fun validateForSubmit(
        restaurant: RestaurantEntity,
        application: RestaurantApplicationEntity,
    ) {
        val missing = mutableListOf<String>()
        if (restaurant.name.isNullOrBlank()) missing += "restaurantName"
        if (restaurant.phone.isNullOrBlank()) missing += "restaurantPhone"
        if (restaurant.addressLine1.isNullOrBlank()) missing += "addressLine1"
        if (parseCuisineTypes(restaurant.cuisineTypesJson).isEmpty()) missing += "cuisineTypes"
        if (application.businessRegistrationNo.isNullOrBlank()) missing += "businessRegistrationNo"
        if (application.businessName.isNullOrBlank()) missing += "businessName"
        if (application.representativeName.isNullOrBlank()) missing += "representativeName"
        if (application.businessAddress.isNullOrBlank()) missing += "businessAddress"
        if (application.businessLicenseFile == null) missing += "businessLicenseFileId"
        if (application.managerName.isNullOrBlank()) missing += "managerName"
        if (application.managerPhone.isNullOrBlank()) missing += "managerPhone"
        if (application.contactVerifiedAt == null) missing += "contactVerified"

        if (missing.isNotEmpty()) {
            throw ApiException(
                ErrorCode.VALIDATION_ERROR,
                "승인 요청 필수 정보가 부족합니다: ${missing.joinToString(", ")}",
            )
        }
    }

    private fun ensureReservationPageForApproval(restaurant: RestaurantEntity): ReservationPageEntity {
        val slug = restaurant.slug ?: generateUniqueSlug(restaurant)
        restaurant.slug = slug
        val reservationPage = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: reservationPageRepository.save(
                ReservationPageEntity(
                    restaurant = restaurant,
                    slug = slug,
                    status = ReservationPageStatus.PRIVATE,
                ),
            )
        reservationPage.slug = reservationPage.slug ?: slug
        if (reservationPage.status == ReservationPageStatus.DRAFT) {
            reservationPage.status = ReservationPageStatus.PRIVATE
        }
        return reservationPage
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
        val reservationPage = reservationPageRepository.findBySlug(slug)
        return (restaurant == null || restaurant.id == restaurantId) &&
            (reservationPage == null || reservationPage.restaurant.id == restaurantId)
    }

    private fun RestaurantApplicationEntity.toResponse(): RestaurantApplicationResponse =
        RestaurantApplicationResponse(
            id = id,
            status = status,
            restaurant = restaurant.toResponse(),
            businessRegistrationNo = businessRegistrationNo,
            businessName = businessName,
            representativeName = representativeName,
            businessAddress = businessAddress,
            businessLicenseFileId = businessLicenseFile?.id,
            managerName = managerName,
            managerPhone = managerPhone,
            managerEmail = managerEmail,
            contactVerified = contactVerifiedAt != null,
            submittedAt = submittedAt,
            reviewedAt = reviewedAt,
            reviewNote = reviewNote,
            rejectionReason = rejectionReason,
        )

    private fun RestaurantEntity.toResponse(): RestaurantApplicationRestaurantResponse =
        RestaurantApplicationRestaurantResponse(
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
            reservationPage = reservationPageRepository.findByRestaurantId(id)?.let {
                RestaurantApplicationReservationPageResponse(
                    id = it.id,
                    slug = it.slug,
                    status = it.status,
                )
            },
        )

    private fun parseCuisineTypes(cuisineTypesJson: String?): List<String> {
        if (cuisineTypesJson.isNullOrBlank()) {
            return emptyList()
        }
        return objectMapper.readValue<List<String>>(cuisineTypesJson)
    }

    private fun String?.trimToNull(): String? =
        this?.trim()?.takeIf { it.isNotEmpty() }
}
