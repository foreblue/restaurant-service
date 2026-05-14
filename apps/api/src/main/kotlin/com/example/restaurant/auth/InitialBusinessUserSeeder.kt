package com.example.restaurant.auth

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class InitialBusinessUserSeeder(
    private val properties: BusinessAuthProperties,
    private val userRepository: BusinessUserRepository,
    private val passwordEncoder: PasswordEncoder,
) : ApplicationRunner {
    private val log = LoggerFactory.getLogger(InitialBusinessUserSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        val initialOwner = properties.initialOwner
        if (!initialOwner.enabled) {
            return
        }
        require(initialOwner.password.isNotBlank()) {
            "INITIAL_OWNER_PASSWORD must be set when initial owner seeding is enabled."
        }

        val normalizedEmail = initialOwner.email.trim().lowercase()
        if (userRepository.existsByEmail(normalizedEmail)) {
            return
        }

        userRepository.save(
            BusinessUserEntity(
                email = normalizedEmail,
                passwordHash = passwordEncoder.encode(initialOwner.password)
                    ?: error("Password encoder returned null."),
                displayName = initialOwner.displayName,
            ),
        )
        log.info("initial business owner seeded email={}", normalizedEmail)
    }
}
