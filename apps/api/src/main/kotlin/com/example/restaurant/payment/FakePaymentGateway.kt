package com.example.restaurant.payment

import org.springframework.stereotype.Component
import java.time.Clock
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Locale

@Component
class FakePaymentGateway(
    private val clock: Clock,
) : PaymentGateway {
    override fun createPayment(request: PaymentGatewayRequest): PaymentGatewayResult =
        resultFor(request, actionPath = "payments", providerPrefix = "fake-payment")

    override fun registerGuarantee(request: PaymentGatewayRequest): PaymentGatewayResult =
        resultFor(request, actionPath = "guarantees", providerPrefix = "fake-guarantee")

    private fun resultFor(
        request: PaymentGatewayRequest,
        actionPath: String,
        providerPrefix: String,
    ): PaymentGatewayResult {
        val providerPaymentId = "$providerPrefix-${request.paymentId}"
        val providerOrderId = "order-${request.reservationNumber}-${request.paymentId}".take(128)
        val normalizedReturnUrl = request.returnUrl.lowercase(Locale.ROOT)
        return when {
            "gateway-fail" in normalizedReturnUrl -> PaymentGatewayResult(
                status = PaymentGatewayResultStatus.FAILED,
                providerKey = PROVIDER_KEY,
                providerPaymentId = providerPaymentId,
                providerOrderId = providerOrderId,
                action = null,
                expiresAt = null,
                failureCode = "FAKE_GATEWAY_FAILED",
                failureMessage = "테스트 PG 결제 시작 실패",
            )
            "gateway-expire" in normalizedReturnUrl -> PaymentGatewayResult(
                status = PaymentGatewayResultStatus.EXPIRED,
                providerKey = PROVIDER_KEY,
                providerPaymentId = providerPaymentId,
                providerOrderId = providerOrderId,
                action = null,
                expiresAt = Instant.now(clock),
                failureCode = "FAKE_GATEWAY_EXPIRED",
                failureMessage = "테스트 PG 결제 만료",
            )
            else -> PaymentGatewayResult(
                status = PaymentGatewayResultStatus.PENDING,
                providerKey = PROVIDER_KEY,
                providerPaymentId = providerPaymentId,
                providerOrderId = providerOrderId,
                action = PaymentGatewayAction(
                    type = "REDIRECT",
                    url = "https://pg.example.test/$actionPath/$providerPaymentId",
                ),
                expiresAt = Instant.now(clock).plus(15, ChronoUnit.MINUTES),
            )
        }
    }

    private companion object {
        const val PROVIDER_KEY = "fake"
    }
}
