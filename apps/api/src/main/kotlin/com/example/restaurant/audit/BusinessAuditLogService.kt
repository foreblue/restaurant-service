package com.example.restaurant.audit

import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.Locale

@Service
class BusinessAuditLogService(
    private val restaurantRepository: RestaurantRepository,
    private val reservationRepository: ReservationRepository,
    private val auditLogRepository: AuditLogRepository,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional(readOnly = true)
    fun list(
        principal: BusinessPrincipal,
        query: BusinessAuditLogQuery,
    ): BusinessAuditLogListResponse {
        val targetType = query.targetType?.trim()?.lowercase(Locale.ROOT)
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "targetType이 필요합니다.")
        val targetId = query.targetId
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "targetId가 필요합니다.")
        if (targetType != "reservation") {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "지원하지 않는 targetType입니다.")
        }

        val restaurant = restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")
        val reservation = reservationRepository.findBusinessReservationById(targetId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "감사 로그 대상을 찾을 수 없습니다.")
        if (reservation.restaurant.id != restaurant.id) {
            throw ApiException(ErrorCode.NOT_FOUND, "감사 로그 대상을 찾을 수 없습니다.")
        }

        return BusinessAuditLogListResponse(
            items = auditLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAscIdAsc(
                targetType = targetType,
                targetId = targetId,
            ).map { it.toResponse() },
        )
    }

    private fun AuditLogEntity.toResponse(): BusinessAuditLogResponse =
        BusinessAuditLogResponse(
            id = id,
            actorUserId = actorUser?.id,
            actorRole = actorRole,
            action = action,
            targetType = targetType,
            targetId = targetId,
            beforeValue = beforeValue.toJsonMap(),
            afterValue = afterValue.toJsonMap(),
            ipAddress = ipAddress,
            userAgent = userAgent,
            createdAt = createdAt,
        )

    private fun String?.toJsonMap(): Map<String, Any?>? =
        this?.let {
            val node = objectMapper.readTree(it)
            val objectNode = if (node.isTextual) {
                objectMapper.readTree(node.asText())
            } else {
                node
            }
            objectMapper.convertValue(objectNode, object : TypeReference<Map<String, Any?>>() {})
        }
}
