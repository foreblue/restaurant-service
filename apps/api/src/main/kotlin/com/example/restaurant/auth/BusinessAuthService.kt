package com.example.restaurant.auth

import com.example.restaurant.audit.AuditLogService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.springframework.http.ResponseCookie
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.util.Base64

@Service
class BusinessAuthService(
    private val properties: BusinessAuthProperties,
    private val userRepository: BusinessUserRepository,
    private val sessionRepository: BusinessSessionRepository,
    private val passwordResetTokenRepository: BusinessPasswordResetTokenRepository,
    private val passwordResetNotificationRepository: BusinessPasswordResetNotificationRepository,
    private val auditLogService: AuditLogService,
    private val passwordEncoder: PasswordEncoder,
    private val clock: Clock,
) {
    private val secureRandom = SecureRandom()
    private val objectMapper = jacksonObjectMapper()

    @Transactional
    fun login(request: BusinessLoginRequest): LoginResult {
        val email = request.email.trim().lowercase()
        val user = userRepository.findByEmail(email)

        if (user == null || !passwordEncoder.matches(request.password, user.passwordHash)) {
            throw ApiException(ErrorCode.INVALID_CREDENTIALS)
        }
        if (user.status != BusinessUserStatus.ACTIVE) {
            throw ApiException(ErrorCode.ACCESS_DENIED)
        }

        val token = generateToken()
        val now = Instant.now(clock)
        sessionRepository.save(
            BusinessSessionEntity(
                user = user,
                tokenHash = TokenHash.sha256Hex(token),
                expiresAt = now.plusSeconds(properties.session.ttlSeconds),
                lastUsedAt = now,
            ),
        )

        return LoginResult(token = token, user = user.toMeResponse())
    }

    @Transactional
    fun authenticate(token: String?): BusinessPrincipal? {
        if (token.isNullOrBlank()) {
            return null
        }

        val now = Instant.now(clock)
        val session = sessionRepository.findByTokenHashAndRevokedAtIsNull(TokenHash.sha256Hex(token))
            ?: return null

        if (!session.expiresAt.isAfter(now)) {
            session.revokedAt = now
            return null
        }

        val user = session.user
        if (user.status != BusinessUserStatus.ACTIVE) {
            throw ApiException(ErrorCode.ACCESS_DENIED)
        }

        session.lastUsedAt = now
        return BusinessPrincipal(
            userId = user.id,
            email = user.email,
            displayName = user.displayName,
            role = user.role,
        )
    }

    @Transactional
    fun logout(token: String?) {
        if (token.isNullOrBlank()) {
            return
        }

        sessionRepository.findByTokenHashAndRevokedAtIsNull(TokenHash.sha256Hex(token))
            ?.revokedAt = Instant.now(clock)
    }

    @Transactional
    fun requestPasswordReset(
        request: PasswordResetRequestRequest,
        metadata: BusinessAuthRequestMetadata,
    ): PasswordResetRequestResponse {
        val email = request.email.trim().lowercase()
        val user = userRepository.findByEmail(email)

        if (user == null || user.status != BusinessUserStatus.ACTIVE) {
            return PasswordResetRequestResponse(accepted = true)
        }

        val now = Instant.now(clock)
        val latestActiveToken = passwordResetTokenRepository
            .findFirstByUserIdAndUsedAtIsNullOrderByRequestedAtDesc(user.id)
        if (
            latestActiveToken != null &&
            latestActiveToken.requestedAt.plusSeconds(properties.passwordReset.requestIntervalSeconds).isAfter(now)
        ) {
            return PasswordResetRequestResponse(accepted = true)
        }

        val token = generateToken()
        val expiresAt = now.plusSeconds(properties.passwordReset.ttlSeconds)
        val resetToken = passwordResetTokenRepository.save(
            BusinessPasswordResetTokenEntity(
                user = user,
                tokenHash = TokenHash.sha256Hex(token),
                requestedAt = now,
                expiresAt = expiresAt,
            ),
        )

        passwordResetNotificationRepository.save(
            BusinessPasswordResetNotificationEntity(
                resetToken = resetToken,
                recipientEmail = user.email,
                deliveryPayload = objectMapper.writeValueAsString(
                    mapOf(
                        "type" to "BUSINESS_PASSWORD_RESET",
                        "recipientEmail" to user.email,
                        "resetTokenId" to resetToken.id,
                        "expiresAt" to expiresAt.toString(),
                    ),
                ),
            ),
        )

        auditLogService.record(
            actorUser = user,
            actorRole = "PASSWORD_RESET",
            action = "BUSINESS_PASSWORD_RESET_REQUESTED",
            targetType = "business_user",
            targetId = user.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "expiresAt" to expiresAt.toString(),
                    "notificationStatus" to PasswordResetNotificationStatus.RECORDED.name,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return PasswordResetRequestResponse(
            accepted = true,
            resetToken = token.takeIf { properties.passwordReset.exposeTokenInResponse },
            expiresAt = expiresAt.takeIf { properties.passwordReset.exposeTokenInResponse },
        )
    }

    @Transactional
    fun confirmPasswordReset(
        request: PasswordResetConfirmationRequest,
        metadata: BusinessAuthRequestMetadata,
    ): PasswordResetConfirmationResponse {
        val now = Instant.now(clock)
        val resetToken = passwordResetTokenRepository.findByTokenHashForUpdate(TokenHash.sha256Hex(request.token.trim()))
            ?: throw ApiException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID)

        if (resetToken.usedAt != null) {
            throw ApiException(ErrorCode.PASSWORD_RESET_TOKEN_USED)
        }
        if (!resetToken.expiresAt.isAfter(now)) {
            throw ApiException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED)
        }

        val user = resetToken.user
        if (user.status != BusinessUserStatus.ACTIVE) {
            throw ApiException(ErrorCode.ACCESS_DENIED)
        }

        user.passwordHash = passwordEncoder.encode(request.newPassword)
            ?: error("Password encoder returned null.")
        resetToken.usedAt = now
        sessionRepository.revokeActiveSessionsForUser(user.id, now)

        auditLogService.record(
            actorUser = user,
            actorRole = "PASSWORD_RESET",
            action = "BUSINESS_PASSWORD_RESET_COMPLETED",
            targetType = "business_user",
            targetId = user.id,
            afterValue = objectMapper.writeValueAsString(
                mapOf(
                    "resetTokenId" to resetToken.id,
                    "revokedSessions" to true,
                ),
            ),
            ipAddress = metadata.ipAddress,
            userAgent = metadata.userAgent,
        )

        return PasswordResetConfirmationResponse(passwordChanged = true)
    }

    @Transactional(readOnly = true)
    fun currentUser(principal: BusinessPrincipal): BusinessMeResponse {
        val user = userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }
        if (user.status != BusinessUserStatus.ACTIVE) {
            throw ApiException(ErrorCode.ACCESS_DENIED)
        }
        return user.toMeResponse()
    }

    fun sessionCookie(token: String): String =
        ResponseCookie.from(properties.session.cookieName, token)
            .httpOnly(true)
            .secure(properties.session.cookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(properties.session.ttlSeconds))
            .build()
            .toString()

    fun expiredSessionCookie(): String =
        ResponseCookie.from(properties.session.cookieName, "")
            .httpOnly(true)
            .secure(properties.session.cookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ZERO)
            .build()
            .toString()

    fun sessionCookieName(): String = properties.session.cookieName

    private fun generateToken(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun BusinessUserEntity.toMeResponse(): BusinessMeResponse =
        BusinessMeResponse(
            id = id,
            email = email,
            displayName = displayName,
            role = role.name,
            status = status.name,
            restaurant = LinkedRestaurantResponse(
                id = linkedRestaurantId,
                status = linkedRestaurantStatus ?: "NOT_LINKED",
            ),
        )

    data class LoginResult(
        val token: String,
        val user: BusinessMeResponse,
    )
}
