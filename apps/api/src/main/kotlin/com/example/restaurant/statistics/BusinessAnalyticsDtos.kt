package com.example.restaurant.statistics

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class BusinessAnalyticsPeriodQuery(
    val from: String?,
    val to: String?,
)

data class BusinessAnalyticsTimeSlotQuery(
    val date: String?,
)

data class BusinessAnalyticsExportRequest(
    val type: String? = null,
    val from: String? = null,
    val to: String? = null,
    val date: String? = null,
)

data class BusinessAnalyticsExportResponse(
    val id: Long,
    val restaurantId: Long,
    val type: BusinessAnalyticsExportType,
    val status: BusinessAnalyticsExportStatus,
    val fileName: String,
    val contentType: String,
    val rowCount: Int,
    val csvContent: String,
    val requestedAt: Instant,
    val completedAt: Instant?,
    val privacyNotice: String,
)

data class BusinessAnalyticsExportRequestMetadata(
    val ipAddress: String?,
    val userAgent: String?,
)

data class BusinessAnalyticsPeriodResponse(
    val from: LocalDate,
    val to: LocalDate,
)

data class BusinessAnalyticsSummaryResponse(
    val restaurantId: Long,
    val period: BusinessAnalyticsPeriodResponse,
    val reservationMetricBasis: String,
    val paymentMetricBasis: String,
    val refundMetricBasis: String,
    val generatedAt: Instant,
    val settlementNotice: String,
    val reservations: BusinessAnalyticsReservationMetricsResponse,
    val payments: BusinessAnalyticsPaymentMetricsResponse,
    val rates: BusinessAnalyticsRateMetricsResponse,
)

data class BusinessAnalyticsReservationMetricsResponse(
    val total: Int,
    val confirmed: Int,
    val modified: Int,
    val completed: Int,
    val cancelledByCustomer: Int,
    val cancelledByRestaurant: Int,
    val cancelled: Int,
    val noShow: Int,
)

data class BusinessAnalyticsPaymentMetricsResponse(
    val depositAmount: Long,
    val prepaidAmount: Long,
    val guaranteeChargeAmount: Long,
    val paymentAmount: Long,
    val refundAmount: Long,
    val netAmount: Long,
    val cardGuaranteeCount: Int,
    val refundCount: Int,
)

data class BusinessAnalyticsRateMetricsResponse(
    val completionRate: Double,
    val cancellationRate: Double,
    val noShowRate: Double,
)

data class BusinessAnalyticsTimeSlotResponse(
    val restaurantId: Long,
    val date: LocalDate,
    val slotMinutes: Long,
    val metricBasis: String,
    val generatedAt: Instant,
    val settlementNotice: String,
    val slots: List<BusinessAnalyticsTimeSlotItemResponse>,
)

data class BusinessAnalyticsTimeSlotItemResponse(
    val startTime: LocalTime,
    val endTime: LocalTime,
    val capacity: Int,
    val reserved: Int,
    val reservationRate: Double,
)

data class BusinessAnalyticsProductResponse(
    val restaurantId: Long,
    val period: BusinessAnalyticsPeriodResponse,
    val reservationMetricBasis: String,
    val paymentMetricBasis: String,
    val refundMetricBasis: String,
    val generatedAt: Instant,
    val settlementNotice: String,
    val items: List<BusinessAnalyticsProductItemResponse>,
)

data class BusinessAnalyticsProductItemResponse(
    val reservationProductId: Long,
    val name: String,
    val reservations: Int,
    val completed: Int,
    val cancelled: Int,
    val noShow: Int,
    val paymentAmount: Long,
    val refundAmount: Long,
    val netAmount: Long,
    val averagePartySize: Double,
)
