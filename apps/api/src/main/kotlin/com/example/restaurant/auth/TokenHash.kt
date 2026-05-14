package com.example.restaurant.auth

import java.security.MessageDigest

object TokenHash {
    fun sha256Hex(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(token.toByteArray(Charsets.UTF_8))
        return digest.joinToString(separator = "") { "%02x".format(it.toInt() and 0xff) }
    }
}
