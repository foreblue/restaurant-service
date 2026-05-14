package com.example.restaurant.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/business")
class BusinessAuthController(
    private val authService: BusinessAuthService,
) {
    @PostMapping("/auth/login")
    fun login(
        @Valid @RequestBody request: BusinessLoginRequest,
        response: HttpServletResponse,
    ): BusinessLoginResponse {
        val result = authService.login(request)
        response.addHeader(HttpHeaders.SET_COOKIE, authService.sessionCookie(result.token))
        return BusinessLoginResponse(user = result.user)
    }

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(
        request: HttpServletRequest,
        response: HttpServletResponse,
    ) {
        val token = request.cookies
            ?.firstOrNull { it.name == authService.sessionCookieName() }
            ?.value
        authService.logout(token)
        response.addHeader(HttpHeaders.SET_COOKIE, authService.expiredSessionCookie())
    }

    @GetMapping("/me")
    fun me(request: HttpServletRequest): BusinessMeResponse =
        authService.currentUser(BusinessAuthContext.principal(request))
}
