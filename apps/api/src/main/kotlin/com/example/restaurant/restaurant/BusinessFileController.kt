package com.example.restaurant.restaurant

import com.example.restaurant.auth.BusinessAuthContext
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/business/files")
class BusinessFileController(
    private val businessFileService: BusinessFileService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun upload(
        servletRequest: HttpServletRequest,
        @RequestParam("purpose") purpose: String,
        @RequestParam("file") file: MultipartFile,
    ): BusinessFileUploadResponse =
        businessFileService.upload(
            principal = BusinessAuthContext.principal(servletRequest),
            purposeValue = purpose,
            file = file,
        )
}
