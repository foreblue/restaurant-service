package com.example.restaurant.member

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Profile("local")
class LocalCustomerMemberSeeder(
    private val memberRepository: CustomerMemberRepository,
) : ApplicationRunner {
    private val log = LoggerFactory.getLogger(LocalCustomerMemberSeeder::class.java)

    @Transactional
    override fun run(args: ApplicationArguments) {
        testMembers.forEach { seed ->
            val existing = memberRepository.findByEmail(seed.email)
            if (existing == null) {
                memberRepository.save(seed.toEntity())
            } else {
                existing.name = seed.name
                existing.phoneNumber = seed.phoneNumber
                existing.allergyNote = seed.allergyNote
                existing.anniversaryType = seed.anniversaryType
                existing.anniversaryDate = seed.anniversaryDate
                existing.marketingOptIn = seed.marketingOptIn
                existing.status = CustomerMemberStatus.ACTIVE
            }
        }
        log.info("local customer members seeded count={}", testMembers.size)
    }

    private fun TestMemberSeed.toEntity(): CustomerMemberEntity =
        CustomerMemberEntity(
            email = email,
            name = name,
            phoneNumber = phoneNumber,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            marketingOptIn = marketingOptIn,
            status = CustomerMemberStatus.ACTIVE,
        )

    private data class TestMemberSeed(
        val email: String,
        val name: String,
        val phoneNumber: String,
        val allergyNote: String? = null,
        val anniversaryType: String? = null,
        val anniversaryDate: String? = null,
        val marketingOptIn: Boolean = false,
    )

    private companion object {
        private val testMembers = listOf(
            TestMemberSeed(
                email = "minji.member@example.com",
                name = "김민지",
                phoneNumber = "01010001001",
                allergyNote = "갑각류",
                anniversaryType = "BIRTHDAY",
                anniversaryDate = "05-17",
                marketingOptIn = true,
            ),
            TestMemberSeed(
                email = "jisoo.member@example.com",
                name = "박지수",
                phoneNumber = "01010001002",
                anniversaryType = "WEDDING_ANNIVERSARY",
                anniversaryDate = "10-03",
            ),
            TestMemberSeed(
                email = "doyun.member@example.com",
                name = "이도윤",
                phoneNumber = "01010001003",
                allergyNote = "견과류",
            ),
            TestMemberSeed(
                email = "hana.member@example.com",
                name = "최하나",
                phoneNumber = "01010001004",
                allergyNote = "유제품",
                anniversaryType = "OTHER",
                anniversaryDate = "12-24",
            ),
        )
    }
}
