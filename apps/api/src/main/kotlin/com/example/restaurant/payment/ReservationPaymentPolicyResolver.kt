package com.example.restaurant.payment

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservation.ReservationPaymentMode
import com.example.restaurant.reservationproduct.ReservationProductEntity
import com.example.restaurant.reservationproduct.ReservationProductPaymentPolicyType
import org.springframework.stereotype.Component

@Component
class ReservationPaymentPolicyResolver {
    fun resolve(
        product: ReservationProductEntity,
        partySize: Int,
    ): ReservationPaymentPolicy =
        when (product.paymentPolicyType) {
            ReservationProductPaymentPolicyType.NONE,
            ReservationProductPaymentPolicyType.FREE,
            -> ReservationPaymentPolicy(
                mode = ReservationPaymentMode.FREE,
                initialStatus = PaymentStatus.NOT_REQUIRED,
                amount = 0,
                requiresGateway = false,
                paymentType = PaymentType.FREE,
            )
            ReservationProductPaymentPolicyType.PAY_ON_SITE -> ReservationPaymentPolicy(
                mode = ReservationPaymentMode.PAY_ON_SITE,
                initialStatus = PaymentStatus.PAY_ON_SITE,
                amount = 0,
                requiresGateway = false,
                paymentType = PaymentType.ONSITE,
            )
            ReservationProductPaymentPolicyType.DEPOSIT -> ReservationPaymentPolicy(
                mode = ReservationPaymentMode.DEPOSIT,
                initialStatus = PaymentStatus.REQUIRES_PAYMENT,
                amount = product.requirePositivePaymentAmount("예약금"),
                requiresGateway = true,
                paymentType = PaymentType.DEPOSIT,
            )
            ReservationProductPaymentPolicyType.PREPAID -> ReservationPaymentPolicy(
                mode = ReservationPaymentMode.PREPAID,
                initialStatus = PaymentStatus.REQUIRES_PAYMENT,
                amount = product.priceAmount * partySize,
                requiresGateway = true,
                paymentType = PaymentType.PREPAID,
            )
            ReservationProductPaymentPolicyType.CARD_GUARANTEE -> ReservationPaymentPolicy(
                mode = ReservationPaymentMode.CARD_GUARANTEE,
                initialStatus = PaymentStatus.REQUIRES_PAYMENT,
                amount = 0,
                requiresGateway = true,
                paymentType = PaymentType.CARD_GUARANTEE,
            )
        }

    private fun ReservationProductEntity.requirePositivePaymentAmount(label: String): Long {
        val amount = paymentAmount ?: throw ApiException(ErrorCode.CONFLICT, "$label 결제 금액이 설정되지 않았습니다.")
        if (amount <= 0) {
            throw ApiException(ErrorCode.CONFLICT, "$label 결제 금액은 0보다 커야 합니다.")
        }
        return amount
    }
}

data class ReservationPaymentPolicy(
    val mode: ReservationPaymentMode,
    val initialStatus: PaymentStatus,
    val amount: Long,
    val requiresGateway: Boolean,
    val paymentType: PaymentType,
)
