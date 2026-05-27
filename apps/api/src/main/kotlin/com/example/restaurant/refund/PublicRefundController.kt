package com.example.restaurant.refund

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/reservations/{reservationId}")
class PublicRefundController(
    private val refundService: RefundService,
) {
    @GetMapping("/refund-preview")
    fun preview(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
    ): RefundPreviewResponse =
        refundService.previewCustomerCancellation(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
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
