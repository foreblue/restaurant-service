package com.example.restaurant.auth

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
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
class AdminApiAccessFilter(
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

        errorResponseWriter.write(response, ErrorCode.ACCESS_DENIED)
    }

    private fun requiresAdminAuthentication(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        return path == "/api/admin" || path.startsWith("/api/admin/")
    }
}
