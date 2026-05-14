package com.example.restaurant.auth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.auth")
data class BusinessAuthProperties(
    val session: Session = Session(),
    val initialOwner: InitialOwner = InitialOwner(),
) {
    data class Session(
        val cookieName: String = "BUSINESS_SESSION",
        val ttlSeconds: Long = 28_800,
        val cookieSecure: Boolean = true,
    )

    data class InitialOwner(
        val enabled: Boolean = false,
        val email: String = "owner@example.com",
        val password: String = "",
        val displayName: String = "Initial Owner",
    )
}
