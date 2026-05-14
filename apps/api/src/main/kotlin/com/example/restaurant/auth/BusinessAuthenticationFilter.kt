package com.example.restaurant.auth

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ApiErrorResponseWriter
import com.example.restaurant.common.error.ErrorCode
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
class BusinessAuthenticationFilter(
    private val authService: BusinessAuthService,
    private val errorResponseWriter: ApiErrorResponseWriter,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        if (!requiresBusinessAuthentication(request)) {
            filterChain.doFilter(request, response)
            return
        }

        try {
            val token = request.cookies
                ?.firstOrNull { it.name == authService.sessionCookieName() }
                ?.value
            val principal = authService.authenticate(token)

            if (principal == null) {
                errorResponseWriter.write(response, ErrorCode.AUTHENTICATION_REQUIRED)
                return
            }

            request.setAttribute(BusinessAuthContext.PRINCIPAL_ATTRIBUTE, principal)
            filterChain.doFilter(request, response)
        } catch (exception: ApiException) {
            errorResponseWriter.write(response, exception.errorCode, exception.message)
        }
    }

    private fun requiresBusinessAuthentication(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        if (!path.startsWith("/api/business/")) {
            return false
        }
        if (request.method.equals("OPTIONS", ignoreCase = true)) {
            return false
        }
        return !(request.method == "POST" && path == "/api/business/auth/login")
    }
}
