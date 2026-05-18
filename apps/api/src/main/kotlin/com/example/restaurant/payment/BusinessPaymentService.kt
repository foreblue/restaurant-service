package com.example.restaurant.payment

import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.refund.RefundEntity
import com.example.restaurant.refund.RefundRepository
import com.example.restaurant.refund.RefundStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeParseException
import java.util.Locale

private const val DEFAULT_BUSINESS_PAYMENT_LIST_LIMIT = 100
private const val MAX_BUSINESS_PAYMENT_LIST_LIMIT = 200

@Service
class BusinessPaymentService(
    private val restaurantRepository: RestaurantRepository,
    private val paymentRepository: PaymentRepository,
    private val refundRepository: RefundRepository,
) {
    @Transactional(readOnly = true)
    fun payments(
        principal: BusinessPrincipal,
        query: BusinessPaymentListQuery,
    ): BusinessPaymentListResponse {
        val restaurant = ownedRestaurant(principal)
        val criteria = query.toPaymentCriteria(restaurant)
        val filtered = paymentRepository
            .findBusinessPayments(
                restaurantId = restaurant.id,
                fromCreatedAt = criteria.fromCreatedAt,
                toCreatedAtExclusive = criteria.toCreatedAtExclusive,
            )
            .asSequence()
            .filter { criteria.statuses.isEmpty() || it.status in criteria.statuses }
            .filter { criteria.searchText == null || it.matches(criteria.searchText) }
            .toList()
        return BusinessPaymentListResponse(
            summary = filtered.toPaymentSummary(),
            totalCount = filtered.size,
            items = filtered.take(criteria.limit).map { it.toListItem() },
        )
    }

    @Transactional(readOnly = true)
    fun refunds(
        principal: BusinessPrincipal,
        query: BusinessRefundListQuery,
    ): BusinessRefundListResponse {
        val restaurant = ownedRestaurant(principal)
        val criteria = query.toRefundCriteria(restaurant)
        val filtered = refundRepository
            .findBusinessRefunds(
                restaurantId = restaurant.id,
                fromCreatedAt = criteria.fromCreatedAt,
                toCreatedAtExclusive = criteria.toCreatedAtExclusive,
            )
            .asSequence()
            .filter { criteria.statuses.isEmpty() || it.status in criteria.statuses }
            .filter { criteria.searchText == null || it.matches(criteria.searchText) }
            .toList()
        return BusinessRefundListResponse(
            summary = filtered.toRefundSummary(),
            totalCount = filtered.size,
            items = filtered.take(criteria.limit).map { it.toListItem() },
        )
    }

    private fun ownedRestaurant(principal: BusinessPrincipal): RestaurantEntity =
        restaurantRepository.findByOwnerId(principal.userId)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "매장을 찾을 수 없습니다.")

    private fun BusinessPaymentListQuery.toPaymentCriteria(restaurant: RestaurantEntity): PaymentListCriteria {
        val dateRange = dateRange(restaurant.timezone, from, to)
        return PaymentListCriteria(
            statuses = parseStatuses(status) { PaymentStatus.valueOf(it) },
            fromCreatedAt = dateRange.fromCreatedAt,
            toCreatedAtExclusive = dateRange.toCreatedAtExclusive,
            searchText = normalizedSearchText(query),
            limit = normalizedLimit(limit),
        )
    }

    private fun BusinessRefundListQuery.toRefundCriteria(restaurant: RestaurantEntity): RefundListCriteria {
        val dateRange = dateRange(restaurant.timezone, from, to)
        return RefundListCriteria(
            statuses = parseStatuses(status) { RefundStatus.valueOf(it) },
            fromCreatedAt = dateRange.fromCreatedAt,
            toCreatedAtExclusive = dateRange.toCreatedAtExclusive,
            searchText = normalizedSearchText(query),
            limit = normalizedLimit(limit),
        )
    }

    private fun <T : Enum<T>> parseStatuses(
        value: String?,
        parser: (String) -> T,
    ): Set<T> {
        val normalized = value?.trim()?.takeIf { it.isNotBlank() } ?: return emptySet()
        return normalized
            .split(",")
            .map { it.trim().uppercase(Locale.ROOT) }
            .filter { it.isNotBlank() }
            .map {
                try {
                    parser(it)
                } catch (exception: IllegalArgumentException) {
                    throw ApiException(ErrorCode.VALIDATION_ERROR, "status 값이 올바르지 않습니다.", exception)
                }
            }
            .toSet()
    }

    private fun dateRange(
        timezone: String,
        from: String?,
        to: String?,
    ): BusinessPaymentDateRange {
        val fromDate = from.parseDate("from")
        val toDate = to.parseDate("to")
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "from은 to보다 늦을 수 없습니다.")
        }
        val zone = ZoneId.of(timezone)
        return BusinessPaymentDateRange(
            fromCreatedAt = fromDate?.atStartOfDay(zone)?.toInstant(),
            toCreatedAtExclusive = toDate?.plusDays(1)?.atStartOfDay(zone)?.toInstant(),
        )
    }

    private fun String?.parseDate(fieldName: String): LocalDate? {
        if (this.isNullOrBlank()) {
            return null
        }
        return try {
            LocalDate.parse(trim())
        } catch (exception: DateTimeParseException) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "$fieldName 형식이 올바르지 않습니다.", exception)
        }
    }

    private fun normalizedSearchText(value: String?): String? =
        value?.trim()?.lowercase(Locale.ROOT)?.takeIf { it.isNotBlank() }

    private fun normalizedLimit(value: Int?): Int {
        val limit = value ?: DEFAULT_BUSINESS_PAYMENT_LIST_LIMIT
        if (limit !in 1..MAX_BUSINESS_PAYMENT_LIST_LIMIT) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "limit은 1 이상 200 이하여야 합니다.")
        }
        return limit
    }

    private fun PaymentEntity.matches(searchText: String): Boolean =
        listOf(
            reservation.reservationNumber,
            customer.name,
            reservation.reservationProduct.name,
            pgPaymentId,
            pgOrderId,
        ).any { it.containsSearchText(searchText) }

    private fun RefundEntity.matches(searchText: String): Boolean =
        listOf(
            reservation.reservationNumber,
            reservation.customer.name,
            reservation.reservationProduct.name,
            pgRefundId,
            payment.pgPaymentId,
        ).any { it.containsSearchText(searchText) }

    private fun String?.containsSearchText(searchText: String): Boolean =
        this?.lowercase(Locale.ROOT)?.contains(searchText) == true

    private fun PaymentEntity.toListItem(): BusinessPaymentListItemResponse =
        BusinessPaymentListItemResponse(
            id = id,
            paymentId = id,
            paymentNumber = pgPaymentId ?: "PAY-${id}",
            reservationId = reservation.id,
            reservationNumber = reservation.reservationNumber,
            visitDate = reservation.visitDate,
            startTime = reservation.startTime,
            productId = reservation.reservationProduct.id,
            productName = reservation.reservationProduct.name,
            customerId = customer.id,
            customerName = customer.name,
            customerPhoneMasked = customer.phoneNumber.maskedPhone(),
            paymentType = paymentType,
            status = status,
            statusLabel = status.label(),
            statusTone = status.tone(),
            amount = amount,
            refundedAmount = refundedAmount,
            currency = currency,
            pgProviderKey = pgProviderKey,
            pgPaymentId = pgPaymentId,
            failureCode = failureCode,
            failureMessage = failureMessage,
            paidAt = paidAt,
            expiresAt = expiresAt,
            dueAt = expiresAt,
            cardGuaranteeHeld = isCardGuaranteeHeld(),
            actionRequired = status.requiresBusinessAction(),
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun RefundEntity.toListItem(): BusinessRefundListItemResponse =
        BusinessRefundListItemResponse(
            id = id,
            refundId = id,
            refundNumber = pgRefundId ?: "REF-${id}",
            paymentId = payment.id,
            reservationId = reservation.id,
            reservationNumber = reservation.reservationNumber,
            visitDate = reservation.visitDate,
            startTime = reservation.startTime,
            productId = reservation.reservationProduct.id,
            productName = reservation.reservationProduct.name,
            customerId = reservation.customer.id,
            customerName = reservation.customer.name,
            customerPhoneMasked = reservation.customer.phoneNumber.maskedPhone(),
            status = status,
            statusLabel = status.label(),
            statusTone = status.tone(),
            refundAmount = refundAmount,
            nonRefundableAmount = nonRefundableAmount,
            currency = payment.currency,
            reason = reason,
            requestedByRole = requestedByRole,
            pgRefundId = pgRefundId,
            failureCode = failureCode,
            failureMessage = failureMessage,
            requestedAt = requestedAt,
            succeededAt = succeededAt,
            completedAt = succeededAt,
            actionRequired = status == RefundStatus.FAILED,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun List<PaymentEntity>.toPaymentSummary(): BusinessPaymentListSummaryResponse =
        BusinessPaymentListSummaryResponse(
            totalCount = size,
            paidAmount = filter { it.status in paidStatuses() }.sumOf { it.amount },
            cardGuaranteeCount = count { it.isCardGuaranteeHeld() },
            actionRequiredCount = count { it.status.requiresBusinessAction() },
        )

    private fun List<RefundEntity>.toRefundSummary(): BusinessRefundListSummaryResponse =
        BusinessRefundListSummaryResponse(
            totalCount = size,
            refundAmount = filter { it.status == RefundStatus.SUCCEEDED }.sumOf { it.refundAmount },
            failedCount = count { it.status == RefundStatus.FAILED },
            actionRequiredCount = count { it.status == RefundStatus.FAILED },
        )

    private fun PaymentEntity.isCardGuaranteeHeld(): Boolean =
        paymentType == PaymentType.CARD_GUARANTEE ||
            status in listOf(
                PaymentStatus.GUARANTEE_REGISTERED,
                PaymentStatus.GUARANTEE_CHARGE_PENDING,
                PaymentStatus.GUARANTEE_CHARGED,
                PaymentStatus.GUARANTEE_CHARGE_FAILED,
            )

    private fun paidStatuses(): Set<PaymentStatus> =
        setOf(
            PaymentStatus.PAID,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUNDED,
            PaymentStatus.GUARANTEE_CHARGED,
        )

    private fun PaymentStatus.label(): String =
        when (this) {
            PaymentStatus.NOT_REQUIRED -> "결제 불필요"
            PaymentStatus.PAY_ON_SITE -> "현장 결제"
            PaymentStatus.REQUIRES_PAYMENT -> "결제 필요"
            PaymentStatus.PENDING -> "결제 대기"
            PaymentStatus.PAID -> "결제 완료"
            PaymentStatus.FAILED -> "결제 실패"
            PaymentStatus.CANCELLED -> "결제 취소"
            PaymentStatus.EXPIRED -> "만료"
            PaymentStatus.PARTIALLY_REFUNDED -> "부분 환불"
            PaymentStatus.REFUNDED -> "환불 완료"
            PaymentStatus.REFUND_FAILED -> "환불 실패"
            PaymentStatus.GUARANTEE_REGISTERED -> "카드 보증 등록"
            PaymentStatus.GUARANTEE_CHARGE_PENDING -> "보증 청구 대기"
            PaymentStatus.GUARANTEE_CHARGED -> "보증 청구 완료"
            PaymentStatus.GUARANTEE_CHARGE_FAILED -> "보증 청구 실패"
        }

    private fun PaymentStatus.tone(): String =
        when (this) {
            PaymentStatus.PAID,
            PaymentStatus.PAY_ON_SITE,
            PaymentStatus.NOT_REQUIRED,
            PaymentStatus.GUARANTEE_REGISTERED,
            PaymentStatus.GUARANTEE_CHARGED,
            -> "success"
            PaymentStatus.REQUIRES_PAYMENT,
            PaymentStatus.PENDING,
            PaymentStatus.GUARANTEE_CHARGE_PENDING,
            -> "warning"
            PaymentStatus.FAILED,
            PaymentStatus.REFUND_FAILED,
            PaymentStatus.GUARANTEE_CHARGE_FAILED,
            -> "danger"
            PaymentStatus.CANCELLED,
            PaymentStatus.EXPIRED,
            PaymentStatus.PARTIALLY_REFUNDED,
            PaymentStatus.REFUNDED,
            -> "muted"
        }

    private fun RefundStatus.label(): String =
        when (this) {
            RefundStatus.REQUESTED -> "환불 요청"
            RefundStatus.PENDING -> "환불 처리중"
            RefundStatus.SUCCEEDED -> "환불 완료"
            RefundStatus.FAILED -> "환불 실패"
            RefundStatus.CANCELLED -> "환불 취소"
        }

    private fun RefundStatus.tone(): String =
        when (this) {
            RefundStatus.SUCCEEDED -> "success"
            RefundStatus.REQUESTED,
            RefundStatus.PENDING,
            -> "warning"
            RefundStatus.FAILED -> "danger"
            RefundStatus.CANCELLED -> "muted"
        }

    private fun String.maskedPhone(): String =
        when {
            length >= 11 -> "${take(3)}-****-${takeLast(4)}"
            length >= 8 -> "****${takeLast(4)}"
            else -> "****"
        }
}

private data class BusinessPaymentDateRange(
    val fromCreatedAt: java.time.Instant?,
    val toCreatedAtExclusive: java.time.Instant?,
)

private data class PaymentListCriteria(
    val statuses: Set<PaymentStatus>,
    val fromCreatedAt: java.time.Instant?,
    val toCreatedAtExclusive: java.time.Instant?,
    val searchText: String?,
    val limit: Int,
)

private data class RefundListCriteria(
    val statuses: Set<RefundStatus>,
    val fromCreatedAt: java.time.Instant?,
    val toCreatedAtExclusive: java.time.Instant?,
    val searchText: String?,
    val limit: Int,
)
