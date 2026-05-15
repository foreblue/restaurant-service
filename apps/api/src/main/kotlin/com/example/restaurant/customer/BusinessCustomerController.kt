package com.example.restaurant.customer

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business")
class BusinessCustomerController(
    private val businessCustomerService: BusinessCustomerService,
) {
    @GetMapping("/customers")
    fun list(
        servletRequest: HttpServletRequest,
        @RequestParam(required = false) q: String?,
    ): BusinessCustomerListResponse =
        businessCustomerService.list(
            principal = BusinessAuthContext.principal(servletRequest),
            query = q,
        )

    @GetMapping("/customers/{customerId}")
    fun detail(
        servletRequest: HttpServletRequest,
        @PathVariable customerId: Long,
    ): BusinessCustomerDetailResponse =
        businessCustomerService.detail(
            principal = BusinessAuthContext.principal(servletRequest),
            customerId = customerId,
            metadata = servletRequest.toMetadata(),
        )

    @PostMapping("/customers")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        servletRequest: HttpServletRequest,
        @RequestBody request: BusinessCustomerSaveRequest,
    ): BusinessCustomerDetailResponse =
        businessCustomerService.create(
            principal = BusinessAuthContext.principal(servletRequest),
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/customers/{customerId}")
    fun update(
        servletRequest: HttpServletRequest,
        @PathVariable customerId: Long,
        @RequestBody request: BusinessCustomerSaveRequest,
    ): BusinessCustomerDetailResponse =
        businessCustomerService.update(
            principal = BusinessAuthContext.principal(servletRequest),
            customerId = customerId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PostMapping("/customers/{customerId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    fun createNote(
        servletRequest: HttpServletRequest,
        @PathVariable customerId: Long,
        @RequestBody request: BusinessCustomerNoteSaveRequest,
    ): BusinessCustomerNoteResponse =
        businessCustomerService.createNote(
            principal = BusinessAuthContext.principal(servletRequest),
            customerId = customerId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @PutMapping("/customer-notes/{noteId}")
    fun updateNote(
        servletRequest: HttpServletRequest,
        @PathVariable noteId: Long,
        @RequestBody request: BusinessCustomerNoteSaveRequest,
    ): BusinessCustomerNoteResponse =
        businessCustomerService.updateNote(
            principal = BusinessAuthContext.principal(servletRequest),
            noteId = noteId,
            request = request,
            metadata = servletRequest.toMetadata(),
        )

    @DeleteMapping("/customer-notes/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteNote(
        servletRequest: HttpServletRequest,
        @PathVariable noteId: Long,
    ) {
        businessCustomerService.deleteNote(
            principal = BusinessAuthContext.principal(servletRequest),
            noteId = noteId,
            metadata = servletRequest.toMetadata(),
        )
    }

    private fun HttpServletRequest.toMetadata(): BusinessCustomerRequestMetadata =
        BusinessCustomerRequestMetadata(
            ipAddress = getHeader("X-Forwarded-For")?.substringBefore(",")?.trim()?.takeIf { it.isNotBlank() }
                ?: remoteAddr,
            userAgent = getHeader("User-Agent"),
        )
}
