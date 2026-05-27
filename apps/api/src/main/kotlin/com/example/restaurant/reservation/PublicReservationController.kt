package com.example.restaurant.reservation

import jakarta.validation.Valid
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
@RequestMapping("/api/public/reservations")
class PublicReservationController(
    private val publicReservationService: PublicReservationService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestHeader("Idempotency-Key", required = false) idempotencyKey: String?,
        @Valid @RequestBody request: PublicReservationCreateRequest,
    ): PublicReservationResponse =
        publicReservationService.create(request, idempotencyKey)

    @GetMapping("/{reservationId}")
    fun detail(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
    ): PublicReservationDetailResponse =
        publicReservationService.detail(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
        )

    @PostMapping("/{reservationId}/cancel")
    fun cancel(
        @PathVariable reservationId: Long,
        @RequestHeader("X-Reservation-Lookup-Token", required = false) headerLookupToken: String?,
        @RequestParam(required = false) lookupToken: String?,
        @RequestParam(required = false) memberId: Long?,
        @RequestParam(required = false) token: String?,
        @RequestBody(required = false) request: PublicReservationCancelRequest?,
    ): PublicReservationDetailResponse =
        publicReservationService.cancel(
            reservationId = reservationId,
            lookupToken = selectedLookupToken(headerLookupToken, lookupToken, token),
            memberId = memberId,
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
