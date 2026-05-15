package com.example.restaurant.statistics

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.util.Locale

private const val CSV_PRIVACY_NOTICE = "기본 CSV에는 고객 전화번호 전체, 이메일, 상세 요청사항을 포함하지 않습니다."

@Service
class BusinessAnalyticsExportService(
    private val userRepository: BusinessUserRepository,
    private val restaurantRepository: RestaurantRepository,
    private val exportRepository: BusinessAnalyticsExportRepository,
    private val analyticsService: BusinessAnalyticsService,
    private val auditLogService: AuditLogService,
    private val clock: Clock,
) {
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun create(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: BusinessAnalyticsExportRequest,
        metadata: BusinessAnalyticsExportRequestMetadata,
    ): BusinessAnalyticsExportResponse {
        val owner = owner(principal)
        val restaurant = ownedRestaurant(principal, restaurantId)
        val exportType = request.type.parseExportType()
        val export = exportRepository.saveAndFlush(
            BusinessAnalyticsExportEntity(
                restaurant = restaurant,
                requestedByUser = owner,
                exportType = exportType,
            ),
        )

        val generated = generateCsv(principal, restaurant.id, request, exportType)
        val completedAt = Instant.now(clock)
        export.status = BusinessAnalyticsExportStatus.COMPLETED
        export.fromDate = generated.from
        export.toDate = generated.to
        export.slotDate = generated.date
        export.rowCount = generated.rowCount
        export.fileName = generated.fileName
        export.contentType = CSV_CONTENT_TYPE
        export.csvContent = generated.csvContent
        export.completedAt = completedAt
        exportRepository.saveAndFlush(export)

        auditLogService.record(
            actorUser = owner,
            actorRole = principal.role.name,
            action = "ANALYTICS_CSV_EXPORT_REQUESTED",
            targetType = "analytics_export_request",
            targetId = export.id,
            beforeValue = null,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "restaurantId" to restaurant.id,
                    "type" to exportType.name,
                    "status" to export.status.name,
                    "fileName" to generated.fileName,
                    "rowCount" to generated.rowCount,
                    "from" to generated.from?.toString(),
                    "to" to generated.to?.toString(),
                    "date" to generated.date?.toString(),
                    "privacyMasked" to true,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return export.toResponse(requestedAt = export.createdAt ?: completedAt)
    }

    private fun generateCsv(
        principal: BusinessPrincipal,
        restaurantId: Long,
        request: BusinessAnalyticsExportRequest,
        exportType: BusinessAnalyticsExportType,
    ): GeneratedAnalyticsCsv =
        when (exportType) {
            BusinessAnalyticsExportType.RESERVATION_SUMMARY -> {
                val summary = analyticsService.summary(
                    principal = principal,
                    restaurantId = restaurantId,
                    query = BusinessAnalyticsPeriodQuery(from = request.from, to = request.to),
                )
                val rows = listOf(
                    listOf("metric", "value", "basis"),
                    listOf("total", summary.reservations.total, summary.reservationMetricBasis),
                    listOf("confirmed", summary.reservations.confirmed, summary.reservationMetricBasis),
                    listOf("modified", summary.reservations.modified, summary.reservationMetricBasis),
                    listOf("completed", summary.reservations.completed, summary.reservationMetricBasis),
                    listOf("cancelled_by_customer", summary.reservations.cancelledByCustomer, summary.reservationMetricBasis),
                    listOf("cancelled_by_restaurant", summary.reservations.cancelledByRestaurant, summary.reservationMetricBasis),
                    listOf("cancelled", summary.reservations.cancelled, summary.reservationMetricBasis),
                    listOf("no_show", summary.reservations.noShow, summary.reservationMetricBasis),
                    listOf("completion_rate", summary.rates.completionRate, summary.reservationMetricBasis),
                    listOf("cancellation_rate", summary.rates.cancellationRate, summary.reservationMetricBasis),
                    listOf("no_show_rate", summary.rates.noShowRate, summary.reservationMetricBasis),
                )
                GeneratedAnalyticsCsv(
                    fileName = exportFileName(exportType, summary.period),
                    rowCount = rows.size - 1,
                    csvContent = rows.toCsv(),
                    from = summary.period.from,
                    to = summary.period.to,
                    date = null,
                )
            }
            BusinessAnalyticsExportType.PAYMENT_REFUND_SUMMARY -> {
                val summary = analyticsService.summary(
                    principal = principal,
                    restaurantId = restaurantId,
                    query = BusinessAnalyticsPeriodQuery(from = request.from, to = request.to),
                )
                val rows = listOf(
                    listOf("metric", "value", "basis"),
                    listOf("deposit_amount", summary.payments.depositAmount, summary.paymentMetricBasis),
                    listOf("prepaid_amount", summary.payments.prepaidAmount, summary.paymentMetricBasis),
                    listOf("guarantee_charge_amount", summary.payments.guaranteeChargeAmount, summary.paymentMetricBasis),
                    listOf("payment_amount", summary.payments.paymentAmount, summary.paymentMetricBasis),
                    listOf("refund_amount", summary.payments.refundAmount, summary.refundMetricBasis),
                    listOf("net_amount", summary.payments.netAmount, "PAID_MINUS_REFUNDED"),
                    listOf("card_guarantee_count", summary.payments.cardGuaranteeCount, summary.paymentMetricBasis),
                    listOf("refund_count", summary.payments.refundCount, summary.refundMetricBasis),
                )
                GeneratedAnalyticsCsv(
                    fileName = exportFileName(exportType, summary.period),
                    rowCount = rows.size - 1,
                    csvContent = rows.toCsv(),
                    from = summary.period.from,
                    to = summary.period.to,
                    date = null,
                )
            }
            BusinessAnalyticsExportType.PRODUCT_PERFORMANCE -> {
                val products = analyticsService.products(
                    principal = principal,
                    restaurantId = restaurantId,
                    query = BusinessAnalyticsPeriodQuery(from = request.from, to = request.to),
                )
                val rows = listOf(
                    listOf(
                        "reservation_product_id",
                        "name",
                        "reservations",
                        "completed",
                        "cancelled",
                        "no_show",
                        "payment_amount",
                        "refund_amount",
                        "net_amount",
                        "average_party_size",
                    ),
                ) + products.items.map {
                    listOf(
                        it.reservationProductId,
                        it.name,
                        it.reservations,
                        it.completed,
                        it.cancelled,
                        it.noShow,
                        it.paymentAmount,
                        it.refundAmount,
                        it.netAmount,
                        it.averagePartySize,
                    )
                }
                GeneratedAnalyticsCsv(
                    fileName = exportFileName(exportType, products.period),
                    rowCount = products.items.size,
                    csvContent = rows.toCsv(),
                    from = products.period.from,
                    to = products.period.to,
                    date = null,
                )
            }
            BusinessAnalyticsExportType.TIME_SLOT_RESERVATION_RATE -> {
                val timeSlots = analyticsService.timeSlots(
                    principal = principal,
                    restaurantId = restaurantId,
                    query = BusinessAnalyticsTimeSlotQuery(date = request.date),
                )
                val rows = listOf(
                    listOf("date", "start_time", "end_time", "capacity", "reserved", "reservation_rate"),
                ) + timeSlots.slots.map {
                    listOf(
                        timeSlots.date,
                        it.startTime,
                        it.endTime,
                        it.capacity,
                        it.reserved,
                        it.reservationRate,
                    )
                }
                GeneratedAnalyticsCsv(
                    fileName = exportFileName(exportType, timeSlots.date),
                    rowCount = timeSlots.slots.size,
                    csvContent = rows.toCsv(),
                    from = null,
                    to = null,
                    date = timeSlots.date,
                )
            }
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

    private fun String?.parseExportType(): BusinessAnalyticsExportType {
        val normalized = this?.trim()?.takeIf { it.isNotBlank() }
            ?.uppercase(Locale.ROOT)
            ?.replace("-", "_")
            ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "type이 필요합니다.")
        return when (normalized) {
            "RESERVATION_SUMMARY" -> BusinessAnalyticsExportType.RESERVATION_SUMMARY
            "PAYMENT_REFUND_SUMMARY",
            "PAYMENT_SUMMARY",
            "REFUND_SUMMARY",
            -> BusinessAnalyticsExportType.PAYMENT_REFUND_SUMMARY
            "PRODUCT_PERFORMANCE",
            "PRODUCTS",
            -> BusinessAnalyticsExportType.PRODUCT_PERFORMANCE
            "TIME_SLOT_RESERVATION_RATE",
            "TIME_SLOTS",
            "TIME_SLOT",
            -> BusinessAnalyticsExportType.TIME_SLOT_RESERVATION_RATE
            else -> throw ApiException(ErrorCode.VALIDATION_ERROR, "type 값이 올바르지 않습니다.")
        }
    }

    private fun BusinessAnalyticsExportEntity.toResponse(requestedAt: Instant): BusinessAnalyticsExportResponse =
        BusinessAnalyticsExportResponse(
            id = id,
            restaurantId = restaurant.id,
            type = exportType,
            status = status,
            fileName = fileName ?: exportFileName(exportType, createdAt?.toString() ?: id.toString()),
            contentType = contentType,
            rowCount = rowCount,
            csvContent = csvContent.orEmpty(),
            requestedAt = requestedAt,
            completedAt = completedAt,
            privacyNotice = CSV_PRIVACY_NOTICE,
        )
}

private data class GeneratedAnalyticsCsv(
    val fileName: String,
    val rowCount: Int,
    val csvContent: String,
    val from: LocalDate?,
    val to: LocalDate?,
    val date: LocalDate?,
)

private fun exportFileName(
    type: BusinessAnalyticsExportType,
    period: BusinessAnalyticsPeriodResponse,
): String =
    exportFileName(type, "${period.from}_${period.to}")

private fun exportFileName(
    type: BusinessAnalyticsExportType,
    date: LocalDate,
): String =
    exportFileName(type, date.toString())

private fun exportFileName(
    type: BusinessAnalyticsExportType,
    suffix: String,
): String =
    "analytics-${type.name.lowercase(Locale.ROOT)}-$suffix.csv"

private fun List<List<Any?>>.toCsv(): String =
    joinToString(separator = "\n", postfix = "\n") { row ->
        row.joinToString(separator = ",") { value -> value.toCsvCell() }
    }

private fun Any?.toCsvCell(): String {
    val raw = this?.toString().orEmpty()
    val escaped = raw.replace("\"", "\"\"")
    return if (escaped.any { it == ',' || it == '"' || it == '\n' || it == '\r' }) {
        "\"$escaped\""
    } else {
        escaped
    }
}
