package com.example.restaurant.payment

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/reservations/{reservationId}")
class PublicPaymentController(
    private val publicPaymentService: PublicPaymentService,
) {
    @GetMapping("/payment-summary")
    fun summary(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
    ): PublicPaymentSummaryResponse =
        publicPaymentService.summary(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
        )

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    fun startPayment(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestHeader("Idempotency-Key", required = false) idempotencyKey: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
        @RequestBody request: PublicPaymentStartRequest,
    ): PublicPaymentStartResponse =
        publicPaymentService.startPayment(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
            headerIdempotencyKey = idempotencyKey,
            request = request,
        )

    @PostMapping("/guarantee")
    @ResponseStatus(HttpStatus.CREATED)
    fun startGuarantee(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestHeader("Idempotency-Key", required = false) idempotencyKey: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
        @RequestBody request: PublicGuaranteeStartRequest,
    ): PublicGuaranteeStartResponse =
        publicPaymentService.startGuarantee(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
            headerIdempotencyKey = idempotencyKey,
            request = request,
        )

    private fun selectedLookupToken(
        headerLookupToken: String?,
        lookupToken: String?,
        token: String?,
    ): String? =
        headerLookupToken?.takeIf { it.isNotBlank() }
            ?: lookupToken?.takeIf { it.isNotBlank() }
            ?: token?.takeIf { it.isNotBlank() }
}
