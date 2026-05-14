package com.example.restaurant.auth

import jakarta.servlet.http.HttpServletRequest

object BusinessAuthContext {
    const val PRINCIPAL_ATTRIBUTE = "businessPrincipal"

    fun principal(request: HttpServletRequest): BusinessPrincipal =
        request.getAttribute(PRINCIPAL_ATTRIBUTE) as? BusinessPrincipal
            ?: throw IllegalStateException("Business principal is not available.")
}
