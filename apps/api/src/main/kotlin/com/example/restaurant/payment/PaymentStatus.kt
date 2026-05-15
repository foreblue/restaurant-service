package com.example.restaurant.payment

enum class PaymentStatus {
    NOT_REQUIRED,
    PAY_ON_SITE,
    REQUIRES_PAYMENT,
    PENDING,
    PAID,
    FAILED,
    CANCELLED,
    EXPIRED,
    PARTIALLY_REFUNDED,
    REFUNDED,
    REFUND_FAILED,
    GUARANTEE_REGISTERED,
    GUARANTEE_CHARGE_PENDING,
    GUARANTEE_CHARGED,
    GUARANTEE_CHARGE_FAILED,
    ;

    fun requiresBusinessAction(): Boolean =
        this == REFUND_FAILED || this == GUARANTEE_CHARGE_FAILED
}
