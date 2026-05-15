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
            paymentId = id,
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
            amount = amount,
            refundedAmount = refundedAmount,
            currency = currency,
            pgProviderKey = pgProviderKey,
            pgPaymentId = pgPaymentId,
            failureCode = failureCode,
            failureMessage = failureMessage,
            paidAt = paidAt,
            expiresAt = expiresAt,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

    private fun RefundEntity.toListItem(): BusinessRefundListItemResponse =
        BusinessRefundListItemResponse(
            refundId = id,
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
            createdAt = createdAt,
            updatedAt = updatedAt,
        )

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
