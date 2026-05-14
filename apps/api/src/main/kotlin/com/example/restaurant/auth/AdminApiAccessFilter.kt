package com.example.restaurant.auth

import com.example.restaurant.common.error.ApiErrorResponseWriter
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
class AdminApiAccessFilter(
    private val authService: BusinessAuthService,
    private val errorResponseWriter: ApiErrorResponseWriter,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        if (!requiresAdminAuthentication(request)) {
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
            if (principal.role != BusinessUserRole.ADMIN) {
                errorResponseWriter.write(response, ErrorCode.ACCESS_DENIED)
                return
            }

            request.setAttribute(BusinessAuthContext.PRINCIPAL_ATTRIBUTE, principal)
            filterChain.doFilter(request, response)
        } catch (exception: ApiException) {
            errorResponseWriter.write(response, exception.errorCode, exception.message)
        }
    }

    private fun requiresAdminAuthentication(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        return path == "/api/admin" || path.startsWith("/api/admin/")
    }
}
