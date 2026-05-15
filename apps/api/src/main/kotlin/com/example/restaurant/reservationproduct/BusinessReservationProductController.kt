package com.example.restaurant.reservationproduct

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business/reservation-products")
class BusinessReservationProductController(
    private val reservationProductService: ReservationProductService,
) {
    @GetMapping
    fun list(servletRequest: HttpServletRequest): List<ReservationProductResponse> =
        reservationProductService.list(BusinessAuthContext.principal(servletRequest))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        servletRequest: HttpServletRequest,
        @Valid @RequestBody request: ReservationProductSaveRequest,
    ): ReservationProductResponse =
        reservationProductService.create(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/{productId}")
    fun update(
        servletRequest: HttpServletRequest,
        @PathVariable productId: Long,
        @Valid @RequestBody request: ReservationProductSaveRequest,
    ): ReservationProductResponse =
        reservationProductService.update(
            principal = BusinessAuthContext.principal(servletRequest),
            productId = productId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        servletRequest: HttpServletRequest,
        @PathVariable productId: Long,
    ) {
        reservationProductService.delete(
            principal = BusinessAuthContext.principal(servletRequest),
            productId = productId,
            metadata = servletRequest.toMetadata(),
        )
    }

    private fun HttpServletRequest.toMetadata(): ReservationProductRequestMetadata =
        ReservationProductRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
