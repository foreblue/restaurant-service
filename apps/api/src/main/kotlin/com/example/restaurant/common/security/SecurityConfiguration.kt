package com.example.restaurant.common.security

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

@ConfigurationProperties(prefix = "app.cors")
data class CorsProperties(
    val allowedOriginPatterns: List<String> = listOf(
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://10.*:*",
        "http://172.*:*",
        "http://192.168.*:*",
    ),
    val allowedMethods: List<String> = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"),
    val allowedHeaders: List<String> = listOf(
        "Accept",
        "Content-Type",
        "Idempotency-Key",
        "X-Reservation-Lookup-Token",
        "X-Trace-Id",
    ),
    val exposedHeaders: List<String> = listOf("X-Trace-Id"),
    val allowCredentials: Boolean = true,
    val maxAgeSeconds: Long = 3_600,
)

@Configuration
class SecurityConfiguration(
    private val corsProperties: CorsProperties,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .logout { it.disable() }
            .authorizeHttpRequests { requests ->
                requests.anyRequest().permitAll()
            }
            .build()

    @Bean
    fun corsFilterRegistration(
        corsConfigurationSource: CorsConfigurationSource,
    ): FilterRegistrationBean<CorsFilter> =
        FilterRegistrationBean(CorsFilter(corsConfigurationSource)).apply {
            order = Ordered.HIGHEST_PRECEDENCE + 10
        }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOriginPatterns = corsProperties.allowedOriginPatterns
            allowedMethods = corsProperties.allowedMethods
            allowedHeaders = corsProperties.allowedHeaders
            exposedHeaders = corsProperties.exposedHeaders
            allowCredentials = corsProperties.allowCredentials
            maxAge = corsProperties.maxAgeSeconds
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }
}
