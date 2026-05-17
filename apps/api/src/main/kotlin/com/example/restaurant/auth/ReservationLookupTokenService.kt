package com.example.restaurant.auth

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.reservation.ReservationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Clock
import java.time.Instant
import java.util.Base64

@Service
class ReservationLookupTokenService(
    private val properties: BusinessAuthProperties,
    private val repository: ReservationLookupTokenRepository,
    private val reservationRepository: ReservationRepository,
    private val clock: Clock,
) {
    private val secureRandom = SecureRandom()

    @Transactional
    fun issueToken(request: ReservationLookupTokenRequest): ReservationLookupTokenResponse {
        val reservationNumber = normalizeReservationNumber(request.reservationNumber)
        val phoneNumber = normalizePhoneNumber(request.phoneNumber)
        if (phoneNumber.isBlank()) {
            throw ApiException(ErrorCode.BAD_REQUEST, "전화번호가 유효하지 않습니다.")
        }
        val reservation = reservationRepository.findByReservationNumber(reservationNumber)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다.")
        if (normalizePhoneNumber(reservation.customer.phoneNumber) != phoneNumber) {
            throw ApiException(ErrorCode.ACCESS_DENIED, "예약자 전화번호가 일치하지 않습니다.")
        }

        val token = generateToken()
        val expiresAt = Instant.now(clock).plusSeconds(properties.reservationLookup.ttlSeconds)

        repository.save(
            ReservationLookupTokenEntity(
                reservationNumber = reservationNumber,
                phoneNumberHash = TokenHash.sha256Hex(phoneNumber),
                tokenHash = TokenHash.sha256Hex(token),
                expiresAt = expiresAt,
            ),
        )

        return ReservationLookupTokenResponse(
            reservationId = reservation.id,
            lookupToken = token,
            expiresAt = expiresAt,
        )
    }

    @Transactional
    fun hasLookupAccess(
        reservationNumber: String,
        lookupToken: String,
    ): Boolean {
        val token = repository.findByTokenHashAndRevokedAtIsNull(TokenHash.sha256Hex(lookupToken))
            ?: return false
        val now = Instant.now(clock)

        if (!token.expiresAt.isAfter(now)) {
            token.revokedAt = now
            return false
        }
        if (token.reservationNumber != normalizeReservationNumber(reservationNumber)) {
            return false
        }

        token.lastUsedAt = now
        return true
    }

    private fun generateToken(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }

    private fun normalizeReservationNumber(reservationNumber: String): String =
        reservationNumber.trim().uppercase()

    private fun normalizePhoneNumber(phoneNumber: String): String =
        phoneNumber.filter { it.isDigit() }
}
