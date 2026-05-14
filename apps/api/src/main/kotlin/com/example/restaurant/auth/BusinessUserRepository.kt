package com.example.restaurant.auth

import org.springframework.data.jpa.repository.JpaRepository

interface BusinessUserRepository : JpaRepository<BusinessUserEntity, Long> {
    fun findByEmail(email: String): BusinessUserEntity?

    fun existsByEmail(email: String): Boolean
}
