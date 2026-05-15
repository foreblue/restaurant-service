package com.example.restaurant.refund

import org.springframework.stereotype.Component

@Component
class FakeRefundGateway : RefundGateway {
    override fun refundPayment(request: RefundGatewayRequest): RefundGatewayResult {
        val shouldFailOnce = request.providerPaymentId
            ?.contains("refund-fail", ignoreCase = true) == true &&
            "-retry-" !in request.idempotencyKey
        return if (shouldFailOnce) {
            RefundGatewayResult(
                status = RefundGatewayResultStatus.FAILED,
                providerRefundId = null,
                failureCode = "FAKE_REFUND_FAILED",
                failureMessage = "테스트 PG 환불 실패",
            )
        } else {
            RefundGatewayResult(
                status = RefundGatewayResultStatus.SUCCEEDED,
                providerRefundId = "fake-refund-${request.refundId}",
            )
        }
    }
}
