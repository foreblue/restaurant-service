package com.example.restaurant

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessUserRole
import com.example.restaurant.auth.BusinessUserStatus
import com.example.restaurant.auth.BusinessPasswordResetNotificationRepository
import com.example.restaurant.auth.BusinessPasswordResetTokenEntity
import com.example.restaurant.auth.BusinessPasswordResetTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.audit.AuditLogRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.common.trace.TraceContext
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.FileStorage
import com.example.restaurant.restaurant.FileStorageSaveRequest
import com.example.restaurant.restaurant.ReservationPageEntity
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.example.restaurant.restaurant.RestaurantStatus
import com.example.restaurant.restaurant.StoredFileEntity
import com.example.restaurant.restaurant.StoredFilePurpose
import com.example.restaurant.restaurant.StoredFileRepository
import com.example.restaurant.restaurant.StoredFileVisibility
import com.example.restaurant.restaurantapplication.RestaurantApplicationEntity
import com.example.restaurant.restaurantapplication.RestaurantApplicationRepository
import com.example.restaurant.restaurantapplication.RestaurantApplicationStatus
import com.jayway.jsonpath.JsonPath
import jakarta.servlet.http.Cookie
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.testcontainers.containers.MySQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class RestaurantApiApplicationTests {
    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: BusinessUserRepository

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    @Autowired
    private lateinit var reservationLookupTokenRepository: ReservationLookupTokenRepository

    @Autowired
    private lateinit var reservationLookupTokenService: ReservationLookupTokenService

    @Autowired
    private lateinit var passwordResetTokenRepository: BusinessPasswordResetTokenRepository

    @Autowired
    private lateinit var passwordResetNotificationRepository: BusinessPasswordResetNotificationRepository

    @Autowired
    private lateinit var storedFileRepository: StoredFileRepository

    @Autowired
    private lateinit var restaurantRepository: RestaurantRepository

    @Autowired
    private lateinit var restaurantApplicationRepository: RestaurantApplicationRepository

    @Autowired
    private lateinit var reservationPageRepository: ReservationPageRepository

    @Autowired
    private lateinit var reservationProductRepository: ReservationProductRepository

    @Autowired
    private lateinit var fileStorage: FileStorage

    @Autowired
    private lateinit var auditLogRepository: AuditLogRepository

    @Test
    fun contextLoads() {
        assertThat(mysql.isRunning).isEqualTo(true)
    }

    @Test
    fun flywayMigrationIsApplied() {
        val versions = jdbcTemplate.queryForList(
            "select version from flyway_schema_history where success = 1",
            String::class.java,
        )
        val schemaVersion = jdbcTemplate.queryForObject(
            "select metadata_value from app_schema_metadata where metadata_key = 'schema_version'",
            String::class.java,
        )

        assertThat(versions).contains("1")
        assertThat(schemaVersion).isEqualTo("1")
    }

    @Test
    fun mysqlServerDefaultsUseExpectedCharsetAndTimezone() {
        val serverDefaults = jdbcTemplate.queryForMap(
            "select @@character_set_server as charset_name, @@collation_server as collation_name, @@global.time_zone as time_zone",
        )

        assertThat(serverDefaults["charset_name"]).isEqualTo("utf8mb4")
        assertThat(serverDefaults["collation_name"]).isEqualTo("utf8mb4_0900_ai_ci")
        assertThat(serverDefaults["time_zone"]).isIn("+00:00", "UTC")
    }

    @Test
    fun apiExceptionResponseContainsCodeMessageAndTraceId() {
        mockMvc.get("/test/foundation/api-exception") {
            header(TraceContext.TRACE_ID_HEADER, "trace-test-1")
        }.andExpect {
            status { isBadRequest() }
            header { string(TraceContext.TRACE_ID_HEADER, "trace-test-1") }
            jsonPath("$.code") { value("BAD_REQUEST") }
            jsonPath("$.message") { value("잘못된 요청입니다.") }
            jsonPath("$.traceId") { value("trace-test-1") }
        }
    }

    @Test
    fun validationExceptionResponseContainsTraceId() {
        mockMvc.post("/test/foundation/validation") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": ""}"""
            header(TraceContext.TRACE_ID_HEADER, "trace-test-2")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("요청 값이 유효하지 않습니다.") }
            jsonPath("$.traceId") { value("trace-test-2") }
        }
    }

    @Test
    fun unhandledExceptionResponseContainsGeneratedTraceId() {
        mockMvc.get("/test/foundation/unhandled").andExpect {
            status { isInternalServerError() }
            header { exists(TraceContext.TRACE_ID_HEADER) }
            jsonPath("$.code") { value("INTERNAL_SERVER_ERROR") }
            jsonPath("$.message") { value("서버 오류가 발생했습니다.") }
            jsonPath("$.traceId") { isNotEmpty() }
        }
    }

    @Test
    fun notFoundResponseUsesCommonErrorShape() {
        mockMvc.get("/test/foundation/missing") {
            header(TraceContext.TRACE_ID_HEADER, "trace-test-3")
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
            jsonPath("$.message") { value("요청한 리소스를 찾을 수 없습니다.") }
            jsonPath("$.traceId") { value("trace-test-3") }
        }
    }

    @Test
    fun actuatorHealthIsExposed() {
        mockMvc.get("/actuator/health").andExpect {
            status { isOk() }
            jsonPath("$.status") { value("UP") }
        }
    }

    @Test
    fun openApiDocsAreExposed() {
        mockMvc.get("/v3/api-docs").andExpect {
            status { isOk() }
            jsonPath("$.openapi") { exists() }
            jsonPath("$.info.title") { value("Restaurant Service API") }
            jsonPath("$.paths['/api/public/restaurants/{slug}'].get.summary") {
                value("slug 기준 공개 예약 페이지 조회")
            }
            jsonPath("$.paths['/api/public/restaurants/{restaurantId}/reservation-page'].get.summary") {
                value("restaurantId 기준 공개 예약 페이지 조회")
            }
        }
    }

    @Test
    fun initialBusinessUserIsSeededWithHashedPassword() {
        val user = userRepository.findByEmail("owner@example.com")

        assertThat(user).isNotNull
        assertThat(user!!.passwordHash).startsWith("$2")
        assertThat(user.status).isEqualTo(BusinessUserStatus.ACTIVE)
    }

    @Test
    fun unauthenticatedBusinessApiReturnsAuthenticationError() {
        mockMvc.get("/api/business/me") {
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-1")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
            jsonPath("$.message") { value("인증이 필요합니다.") }
            jsonPath("$.traceId") { value("auth-trace-1") }
        }
    }

    @Test
    fun adminApiRequiresAdminSession() {
        mockMvc.get("/api/admin/restaurant-applications") {
            header(TraceContext.TRACE_ID_HEADER, "admin-trace-1")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
            jsonPath("$.message") { value("인증이 필요합니다.") }
            jsonPath("$.traceId") { value("admin-trace-1") }
        }

        val ownerCookie = loginAndExtractSessionCookie()
        mockMvc.get("/api/admin/restaurant-applications") {
            cookie(ownerCookie)
            header(TraceContext.TRACE_ID_HEADER, "admin-trace-2")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
            jsonPath("$.message") { value("접근 권한이 없습니다.") }
            jsonPath("$.traceId") { value("admin-trace-2") }
        }
    }

    @Test
    fun invalidLoginReturnsInvalidCredentials() {
        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "owner@example.com", "password": "wrong-password"}"""
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-2")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_CREDENTIALS") }
            jsonPath("$.message") { value("이메일 또는 비밀번호가 올바르지 않습니다.") }
            jsonPath("$.traceId") { value("auth-trace-2") }
        }
    }

    @Test
    fun suspendedLoginReturnsAccessDenied() {
        userRepository.save(
            BusinessUserEntity(
                email = "suspended@example.com",
                passwordHash = passwordEncoder.encode("SuspendedPassword123!")
                    ?: error("Password encoder returned null."),
                displayName = "Suspended Owner",
                status = BusinessUserStatus.SUSPENDED,
            ),
        )

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "suspended@example.com", "password": "SuspendedPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-3")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
            jsonPath("$.message") { value("접근 권한이 없습니다.") }
            jsonPath("$.traceId") { value("auth-trace-3") }
        }
    }

    @Test
    fun loginIssuesHttpOnlyCookieAndCurrentUserCanBeRead() {
        val sessionCookie = loginAndExtractSessionCookie()

        mockMvc.get("/api/business/me") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { exists() }
            jsonPath("$.email") { value("owner@example.com") }
            jsonPath("$.displayName") { value("Initial Owner") }
            jsonPath("$.role") { value("OWNER") }
            jsonPath("$.status") { value("ACTIVE") }
            jsonPath("$.restaurant.id") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.restaurant.status") { value("NOT_LINKED") }
        }
    }

    @Test
    fun logoutRevokesSessionCookie() {
        val sessionCookie = loginAndExtractSessionCookie()

        mockMvc.post("/api/business/auth/logout") {
            cookie(sessionCookie)
        }.andExpect {
            status { isNoContent() }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")) }
        }

        mockMvc.get("/api/business/me") {
            cookie(sessionCookie)
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
        }
    }

    @Test
    fun passwordResetRequestCanIssueTokenAndConfirmationChangesPassword() {
        val owner = createBusinessUser("reset-owner@example.com")

        val requestResult = mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "RESET-OWNER@example.com"}"""
            header("X-Forwarded-For", "198.51.100.10")
            header("User-Agent", "password-reset-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
            jsonPath("$.resetToken") { isNotEmpty() }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }.andReturn()

        val resetToken = JsonPath.read<String>(requestResult.response.contentAsString, "$.resetToken")
        val savedToken = passwordResetTokenRepository.findAll().single { it.user.id == owner.id }
        assertThat(savedToken.tokenHash).hasSize(64)
        assertThat(savedToken.tokenHash).isNotEqualTo(resetToken)
        assertThat(savedToken.tokenHash).isEqualTo(TokenHash.sha256Hex(resetToken))

        val notification = passwordResetNotificationRepository.findByResetTokenId(savedToken.id).single()
        assertThat(notification.recipientEmail).isEqualTo(owner.email)
        assertThat(notification.deliveryPayload)
            .contains("BUSINESS_PASSWORD_RESET")
            .contains("resetTokenId")
            .contains(savedToken.id.toString())
            .doesNotContain(resetToken)

        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "$resetToken", "newPassword": "NewPassword123!"}"""
            header("X-Forwarded-For", "198.51.100.11")
            header("User-Agent", "password-reset-confirm-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.passwordChanged") { value(true) }
        }

        val updatedOwner = userRepository.findByEmail(owner.email) ?: error("Owner should exist.")
        assertThat(passwordEncoder.matches("NewPassword123!", updatedOwner.passwordHash)).isTrue()
        assertThat(passwordResetTokenRepository.findById(savedToken.id).orElseThrow().usedAt).isNotNull()

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "${owner.email}", "password": "CorrectPassword123!"}"""
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_CREDENTIALS") }
        }

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "${owner.email}", "password": "NewPassword123!"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email") { value(owner.email) }
        }

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("business_user", owner.id)
        assertThat(auditLogs.map { it.action })
            .contains("BUSINESS_PASSWORD_RESET_REQUESTED", "BUSINESS_PASSWORD_RESET_COMPLETED")
        assertThat(auditLogs.single { it.action == "BUSINESS_PASSWORD_RESET_REQUESTED" }.ipAddress)
            .isEqualTo("198.51.100.10")
    }

    @Test
    fun passwordResetRequestDoesNotCreateAnotherTokenDuringRetryInterval() {
        val owner = createBusinessUser("reset-rate-limit@example.com")

        mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "reset-rate-limit@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
        }

        mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "reset-rate-limit@example.com"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-rate-limit")
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
        }

        val savedTokens = passwordResetTokenRepository.findAll().filter { it.user.id == owner.id }
        assertThat(savedTokens).hasSize(1)
        assertThat(passwordResetNotificationRepository.findByResetTokenId(savedTokens.single().id)).hasSize(1)
    }

    @Test
    fun passwordResetConfirmationRejectsInvalidExpiredAndUsedTokens() {
        val owner = createBusinessUser("reset-invalid@example.com")
        val now = Instant.now()

        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "missing-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-invalid")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_INVALID") }
            jsonPath("$.traceId") { value("password-reset-invalid") }
        }

        passwordResetTokenRepository.saveAndFlush(
            BusinessPasswordResetTokenEntity(
                user = owner,
                tokenHash = TokenHash.sha256Hex("expired-token"),
                requestedAt = now.minusSeconds(3_600),
                expiresAt = now.minusSeconds(1),
            ),
        )
        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "expired-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-expired")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_EXPIRED") }
            jsonPath("$.traceId") { value("password-reset-expired") }
        }

        passwordResetTokenRepository.saveAndFlush(
            BusinessPasswordResetTokenEntity(
                user = owner,
                tokenHash = TokenHash.sha256Hex("used-token"),
                requestedAt = now,
                expiresAt = now.plusSeconds(1_800),
                usedAt = now,
            ),
        )
        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "used-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-used")
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_USED") }
            jsonPath("$.traceId") { value("password-reset-used") }
        }
    }

    @Test
    fun publicReservationLookupTokenCanBeIssuedWithoutBusinessSession() {
        val result = mockMvc.post("/api/public/reservation-lookup-tokens") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"reservationNumber": " r-20260515-1 ", "phoneNumber": "010-1234-5678"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.lookupToken") { isNotEmpty() }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }.andReturn()

        val lookupToken = JsonPath.read<String>(result.response.contentAsString, "$.lookupToken")
        val savedToken = reservationLookupTokenRepository.findAll()
            .single { it.reservationNumber == "R-20260515-1" }

        assertThat(savedToken.tokenHash).hasSize(64)
        assertThat(savedToken.tokenHash).isNotEqualTo(lookupToken)
        assertThat(savedToken.phoneNumberHash).hasSize(64)
        assertThat(savedToken.phoneNumberHash).isNotEqualTo("010-1234-5678")
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-1", lookupToken)).isTrue()
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-2", lookupToken)).isFalse()
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-1", "wrong-token")).isFalse()
    }

    @Test
    fun publicReservationLookupTokenRejectsInvalidPhoneNumber() {
        mockMvc.post("/api/public/reservation-lookup-tokens") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"reservationNumber": "r-20260515-2", "phoneNumber": "no-digits"}"""
            header(TraceContext.TRACE_ID_HEADER, "lookup-trace-1")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("BAD_REQUEST") }
            jsonPath("$.message") { value("전화번호가 유효하지 않습니다.") }
            jsonPath("$.traceId") { value("lookup-trace-1") }
        }
    }

    @Test
    fun restaurantDomainRepositoriesPersistStoreApplicationPageAndFileMetadata() {
        val owner = createBusinessUser("restaurant-owner@example.com")
        val coverImage = storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = "restaurant-cover-images/cover-1.webp",
                originalFilename = "cover.webp",
                contentType = "image/webp",
                byteSize = 1024,
                checksumSha256 = "a".repeat(64),
                visibility = StoredFileVisibility.PUBLIC,
                purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
                createdBy = owner,
            ),
        )
        val businessLicense = storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = "business-licenses/license-1.pdf",
                originalFilename = "license.pdf",
                contentType = "application/pdf",
                byteSize = 2048,
                checksumSha256 = "b".repeat(64),
                visibility = StoredFileVisibility.PRIVATE,
                purpose = StoredFilePurpose.BUSINESS_LICENSE,
                createdBy = owner,
            ),
        )
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = "스시윤",
                slug = null,
                description = "예약제 스시야",
                phone = "02-1234-5678",
                addressLine1 = "서울시 강남구 테헤란로 1",
                addressLine2 = "2층",
                postalCode = "06123",
                cuisineTypesJson = """["sushi","omakase"]""",
                coverImageFile = coverImage,
                status = RestaurantStatus.DRAFT,
            ),
        )
        restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = restaurant,
                businessRegistrationNo = "1234567890",
                businessName = "스시윤",
                representativeName = "윤대표",
                businessAddress = "서울시 강남구 테헤란로 1",
                businessLicenseFile = businessLicense,
                managerName = "윤매니저",
                managerPhone = "010-1111-2222",
                managerEmail = "manager@example.com",
                status = RestaurantApplicationStatus.DRAFT,
            ),
        )
        reservationPageRepository.saveAndFlush(
            ReservationPageEntity(
                restaurant = restaurant,
                slug = "sushi-yoon",
                status = ReservationPageStatus.PRIVATE,
            ),
        )

        assertThat(restaurantRepository.findByOwnerId(owner.id)?.name).isEqualTo("스시윤")
        assertThat(restaurantRepository.findByOwnerId(owner.id)?.status).isEqualTo(RestaurantStatus.DRAFT)
        assertThat(storedFileRepository.findByStorageKey("business-licenses/license-1.pdf")?.visibility)
            .isEqualTo(StoredFileVisibility.PRIVATE)
        assertThat(
            restaurantApplicationRepository
                .findTopByRestaurantIdOrderByCreatedAtDesc(restaurant.id)
                ?.businessRegistrationNo,
        ).isEqualTo("1234567890")
        assertThat(reservationPageRepository.findBySlug("sushi-yoon")?.status)
            .isEqualTo(ReservationPageStatus.PRIVATE)
    }

    @Test
    fun restaurantRepositoryEnforcesSingleRestaurantPerOwner() {
        val owner = createBusinessUser("single-restaurant-owner@example.com")
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = "첫번째 매장",
                phone = "02-1000-0001",
                addressLine1 = "서울시 중구 1",
                cuisineTypesJson = """["korean"]""",
            ),
        )

        assertThatThrownBy {
            restaurantRepository.saveAndFlush(
                RestaurantEntity(
                    owner = owner,
                    name = "두번째 매장",
                    phone = "02-1000-0002",
                    addressLine1 = "서울시 중구 2",
                    cuisineTypesJson = """["korean"]""",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun restaurantSlugsAreUniqueButNullable() {
        val firstOwner = createBusinessUser("nullable-slug-owner-1@example.com")
        val secondOwner = createBusinessUser("nullable-slug-owner-2@example.com")
        val thirdOwner = createBusinessUser("duplicate-slug-owner-1@example.com")
        val fourthOwner = createBusinessUser("duplicate-slug-owner-2@example.com")

        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = firstOwner,
                name = "슬러그 없음 1",
                phone = "02-2000-0001",
                addressLine1 = "서울시 용산구 1",
                cuisineTypesJson = """["dining"]""",
            ),
        )
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = secondOwner,
                name = "슬러그 없음 2",
                phone = "02-2000-0002",
                addressLine1 = "서울시 용산구 2",
                cuisineTypesJson = """["dining"]""",
            ),
        )
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = thirdOwner,
                name = "슬러그 있음 1",
                slug = "unique-restaurant",
                phone = "02-2000-0003",
                addressLine1 = "서울시 용산구 3",
                cuisineTypesJson = """["dining"]""",
            ),
        )

        assertThatThrownBy {
            restaurantRepository.saveAndFlush(
                RestaurantEntity(
                    owner = fourthOwner,
                    name = "슬러그 있음 2",
                    slug = "unique-restaurant",
                    phone = "02-2000-0004",
                    addressLine1 = "서울시 용산구 4",
                    cuisineTypesJson = """["dining"]""",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun reservationPageSlugsAreUniqueButNullable() {
        val firstRestaurant = createRestaurantForTest(
            owner = createBusinessUser("nullable-page-slug-owner-1@example.com"),
            name = "예약 페이지 슬러그 없음 1",
        )
        val secondRestaurant = createRestaurantForTest(
            owner = createBusinessUser("nullable-page-slug-owner-2@example.com"),
            name = "예약 페이지 슬러그 없음 2",
        )
        val thirdRestaurant = createRestaurantForTest(
            owner = createBusinessUser("duplicate-page-slug-owner-1@example.com"),
            name = "예약 페이지 슬러그 있음 1",
        )
        val fourthRestaurant = createRestaurantForTest(
            owner = createBusinessUser("duplicate-page-slug-owner-2@example.com"),
            name = "예약 페이지 슬러그 있음 2",
        )

        reservationPageRepository.saveAndFlush(ReservationPageEntity(restaurant = firstRestaurant))
        reservationPageRepository.saveAndFlush(ReservationPageEntity(restaurant = secondRestaurant))
        reservationPageRepository.saveAndFlush(
            ReservationPageEntity(
                restaurant = thirdRestaurant,
                slug = "unique-page",
            ),
        )

        assertThatThrownBy {
            reservationPageRepository.saveAndFlush(
                ReservationPageEntity(
                    restaurant = fourthRestaurant,
                    slug = "unique-page",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun localFileStorageStoresAndReadsFileWithoutExternalProvider() {
        val result = fileStorage.save(
            FileStorageSaveRequest(
                originalFilename = "cover image.webp",
                contentType = "image/webp",
                content = "cover".encodeToByteArray(),
                visibility = StoredFileVisibility.PUBLIC,
                purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            ),
        )

        assertThat(result.storageKey).startsWith("restaurant_cover_image/")
        assertThat(result.byteSize).isEqualTo(5)
        assertThat(result.checksumSha256).hasSize(64)
        assertThat(fileStorage.read(result.storageKey)?.decodeToString()).isEqualTo("cover")
        assertThat(fileStorage.publicUrl(result.storageKey)).isNull()
    }

    @Test
    fun businessFileUploadPersistsMetadataAndCanBeLinkedToApplication() {
        val owner = createBusinessUser("file-upload-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)

        val imageResult = mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.jpg", "image/jpeg", jpegBytes()))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isCreated())
            .andExpect(jsonPath("$.purpose").value("restaurant_image"))
            .andExpect(jsonPath("$.visibility").value("PUBLIC"))
            .andExpect(jsonPath("$.originalFilename").value("cover.jpg"))
            .andReturn()
        val imageFileId = JsonPath.read<Int>(imageResult.response.contentAsString, "$.id").toLong()

        val licenseResult = mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "license.pdf", "application/pdf", pdfBytes()))
                .param("purpose", "business_license")
                .cookie(sessionCookie),
        ).andExpect(status().isCreated())
            .andExpect(jsonPath("$.purpose").value("business_license"))
            .andExpect(jsonPath("$.visibility").value("PRIVATE"))
            .andExpect(jsonPath("$.publicUrl").value(org.hamcrest.Matchers.nullValue()))
            .andReturn()
        val licenseFileId = JsonPath.read<Int>(licenseResult.response.contentAsString, "$.id").toLong()

        val imageFile = storedFileRepository.findById(imageFileId).orElseThrow()
        val licenseFile = storedFileRepository.findById(licenseFileId).orElseThrow()
        assertThat(imageFile.createdBy?.id).isEqualTo(owner.id)
        assertThat(imageFile.purpose).isEqualTo(StoredFilePurpose.RESTAURANT_COVER_IMAGE)
        assertThat(imageFile.visibility).isEqualTo(StoredFileVisibility.PUBLIC)
        assertThat(licenseFile.createdBy?.id).isEqualTo(owner.id)
        assertThat(licenseFile.purpose).isEqualTo(StoredFilePurpose.BUSINESS_LICENSE)
        assertThat(licenseFile.visibility).isEqualTo(StoredFileVisibility.PRIVATE)

        mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "7171717171",
                coverImageFileId = imageFileId,
                businessLicenseFileId = licenseFileId,
                managerEmail = "uploaded-file-owner@example.com",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.restaurant.coverImageFileId") { value(imageFileId.toInt()) }
            jsonPath("$.businessLicenseFileId") { value(licenseFileId.toInt()) }
        }
    }

    @Test
    fun businessFileUploadRejectsUnsupportedTypeAndOversizedFiles() {
        val owner = createBusinessUser("file-upload-reject@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)

        mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.txt", "text/plain", "plain".encodeToByteArray()))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))

        mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.jpg", "image/jpeg", ByteArray(5 * 1024 * 1024 + 1)))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
    }

    @Test
    fun restaurantApplicationRejectsFilesUploadedByAnotherOwner() {
        val owner = createBusinessUser("file-owner-check@example.com")
        val otherOwner = createBusinessUser("file-other-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val otherCoverImage = createStoredFile(
            storageKey = "restaurant-cover-images/other-owner.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = otherOwner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/owner-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )

        mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "8181818181",
                coverImageFileId = otherCoverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "file-owner-check@example.com",
            )
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }
    }

    @Test
    fun businessRestaurantApplicationCanBeCreatedUpdatedSubmittedAndRead() {
        val owner = createBusinessUser("application-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie("application-owner@example.com")
        val coverImage = createStoredFile(
            storageKey = "restaurant-cover-images/application-cover.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = owner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/application-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )

        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "1111111111",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "before@example.com",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("DRAFT") }
            jsonPath("$.restaurant.status") { value("DRAFT") }
            jsonPath("$.restaurant.name") { value("스시온") }
            jsonPath("$.contactVerified") { value(true) }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.put("/api/business/restaurant-applications/$applicationId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "1111111111",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                restaurantDescription = "수정된 소개",
                managerEmail = "updated@example.com",
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.restaurant.description") { value("수정된 소개") }
            jsonPath("$.managerEmail") { value("updated@example.com") }
        }

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
            header("X-Forwarded-For", "203.0.113.10")
            header("User-Agent", "restaurant-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.restaurant.status") { value("APPROVAL_REQUESTED") }
            jsonPath("$.submittedAt") { isNotEmpty() }
        }

        mockMvc.get("/api/business/restaurant-applications/current") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(applicationId.toInt()) }
            jsonPath("$.status") { value("SUBMITTED") }
        }

        mockMvc.put("/api/business/restaurant-applications/$applicationId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"managerEmail": "submitted-update@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.managerEmail") { value("submitted-update@example.com") }
            jsonPath("$.restaurant.description") { value("수정된 소개") }
        }

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", applicationId)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_SUBMITTED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_SUBMITTED" }.ipAddress)
            .isEqualTo("203.0.113.10")
    }

    @Test
    fun adminCanListReadAndApproveSubmittedRestaurantApplication() {
        val admin = createBusinessUser("admin-approve@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val owner = createBusinessUser("approval-owner@example.com")
        val application = createSubmittedRestaurantApplication(
            owner = owner,
            businessRegistrationNo = "3333333333",
            restaurantName = "Blue Table",
        )

        mockMvc.get("/api/admin/restaurant-applications?status=SUBMITTED") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(application.id.toInt()) }
            jsonPath("$[0].status") { value("SUBMITTED") }
        }

        mockMvc.get("/api/admin/restaurant-applications/${application.id}") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(application.id.toInt()) }
            jsonPath("$.restaurant.name") { value("Blue Table") }
        }

        mockMvc.post("/api/admin/restaurant-applications/${application.id}/approve") {
            cookie(adminCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reviewNote": "확인 완료"}"""
            header("X-Forwarded-For", "203.0.113.20")
            header("User-Agent", "admin-approve-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("APPROVED") }
            jsonPath("$.restaurant.status") { value("APPROVED") }
            jsonPath("$.restaurant.slug") { value("blue-table") }
            jsonPath("$.restaurant.reservationPage.slug") { value("blue-table") }
            jsonPath("$.restaurant.reservationPage.status") { value("PRIVATE") }
            jsonPath("$.reviewedAt") { isNotEmpty() }
            jsonPath("$.reviewNote") { value("확인 완료") }
        }

        val approvedRestaurant = restaurantRepository.findById(application.restaurant.id).orElseThrow()
        assertThat(approvedRestaurant.status).isEqualTo(RestaurantStatus.APPROVED)
        assertThat(approvedRestaurant.approvedAt).isNotNull()
        assertThat(reservationPageRepository.findByRestaurantId(approvedRestaurant.id)?.slug)
            .isEqualTo("blue-table")
        assertThat(userRepository.findByEmail(owner.email)?.linkedRestaurantStatus)
            .isEqualTo(RestaurantStatus.APPROVED.name)

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", application.id)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_APPROVED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_APPROVED" }.ipAddress)
            .isEqualTo("203.0.113.20")
    }

    @Test
    fun adminCanRejectAndOwnerCanResubmitRestaurantApplication() {
        val admin = createBusinessUser("admin-reject@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val owner = createBusinessUser("rejection-owner@example.com")
        val ownerCookie = loginAndExtractSessionCookie(owner.email)
        val application = createSubmittedRestaurantApplication(
            owner = owner,
            businessRegistrationNo = "4444444444",
            restaurantName = "Rejectable Table",
        )

        mockMvc.post("/api/admin/restaurant-applications/${application.id}/reject") {
            cookie(adminCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"rejectionReason": "서류 보완 필요", "reviewNote": "사업자등록증 확인 실패"}"""
            header("X-Forwarded-For", "203.0.113.21")
            header("User-Agent", "admin-reject-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("REJECTED") }
            jsonPath("$.restaurant.status") { value("REJECTED") }
            jsonPath("$.rejectionReason") { value("서류 보완 필요") }
            jsonPath("$.reviewNote") { value("사업자등록증 확인 실패") }
        }

        assertThat(userRepository.findByEmail(owner.email)?.linkedRestaurantStatus)
            .isEqualTo(RestaurantStatus.REJECTED.name)
        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", application.id)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_REJECTED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_REJECTED" }.ipAddress)
            .isEqualTo("203.0.113.21")

        mockMvc.post("/api/business/restaurant-applications/${application.id}/submit") {
            cookie(ownerCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.restaurant.status") { value("APPROVAL_REQUESTED") }
            jsonPath("$.rejectionReason") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.reviewedAt") { value(org.hamcrest.Matchers.nullValue()) }
        }
    }

    @Test
    fun businessOwnerCanConfigureHoursHolidaysPublishAndReadPublicRestaurant() {
        val owner = createBusinessUser("settings-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Public Table")

        mockMvc.get("/api/business/restaurants/current") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(restaurant.id.toInt()) }
            jsonPath("$.status") { value("APPROVED") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "Public Table",
              "description": "예약제 다이닝",
              "phone": "02-7777-1000",
              "addressLine1": "서울시 공개구 1",
              "addressLine2": "2층",
              "postalCode": "04500",
              "cuisineTypes": ["dining", "wine"]
            }
            """.trimIndent()
            header("X-Forwarded-For", "203.0.113.30")
            header("User-Agent", "restaurant-settings-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.description") { value("예약제 다이닝") }
            jsonPath("$.cuisineTypes[1]") { value("wine") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "11:30:00", "closesAt": "15:00:00"},
                {"dayOfWeek": "MONDAY", "opensAt": "17:30:00", "closesAt": "22:00:00"},
                {"dayOfWeek": "TUESDAY", "closed": true}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$[0].sequence") { value(1) }
            jsonPath("$[1].sequence") { value(2) }
            jsonPath("$[2].closed") { value(true) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "12:00:00", "closesAt": "21:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$[0].sequence") { value(1) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/holiday-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "rules": [
                {"type": "WEEKLY", "dayOfWeek": "TUESDAY", "reason": "정기 휴무"},
                {"type": "TEMPORARY_DATE", "date": "2026-06-01", "reason": "워크숍"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].reason") { isNotEmpty() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "public-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.slug") { value("public-table") }
            jsonPath("$.status") { value("PUBLIC") }
            jsonPath("$.publicUrl") { value("/r/public-table") }
            jsonPath("$.publishable") { value(true) }
        }

        mockMvc.get("/api/public/restaurants/public-table").andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Public Table") }
            jsonPath("$.reservationPage.status") { value("PUBLIC") }
            jsonPath("$.reservationPage.publicUrl") { value("/r/public-table") }
            jsonPath("$.reservationPage.reservationAvailable") { value(true) }
            jsonPath("$.businessHours[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$.holidayRules[0].reason") { isNotEmpty() }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-page").andExpect {
            status { isOk() }
            jsonPath("$.id") { value(restaurant.id.toInt()) }
            jsonPath("$.slug") { value("public-table") }
            jsonPath("$.reservationPage.status") { value("PUBLIC") }
            jsonPath("$.reservationPage.publicUrl") { value("/r/public-table") }
            jsonPath("$.reservationPage.reservationAvailable") { value(true) }
        }

        val restaurantLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant", restaurant.id)
        assertThat(restaurantLogs.map { it.action })
            .contains("RESTAURANT_UPDATED", "BUSINESS_HOURS_UPDATED", "HOLIDAY_RULES_UPDATED")
        val pageId = reservationPageRepository.findByRestaurantId(restaurant.id)?.id
            ?: error("Reservation page should exist.")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_page", pageId).map { it.action })
            .contains("RESERVATION_PAGE_UPDATED")
    }

    @Test
    fun reservationPagePublishRequiresApprovedOwnedRestaurantAndBusinessHours() {
        val owner = createBusinessUser("settings-blocked-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val otherOwner = createBusinessUser("settings-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Hidden Table", "hidden-table")

        mockMvc.get("/api/public/restaurants/hidden-table").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-page").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "hidden-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value(org.hamcrest.Matchers.containsString("businessHours")) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"hours": [{"dayOfWeek": "MONDAY", "opensAt": "11:00:00", "closesAt": "12:00:00"}]}"""
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "11:00:00", "closesAt": "13:00:00"},
                {"dayOfWeek": "MONDAY", "opensAt": "12:30:00", "closesAt": "14:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("같은 요일의 영업 구간은 겹칠 수 없습니다.") }
        }
    }

    @Test
    fun businessOwnerCanManageReservationProductsAndPublicOnlyVisibleProducts() {
        val owner = createBusinessUser("product-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Product Table", "product-table")

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        val createResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "디너 코스",
              "description": "계절 메뉴 코스",
              "priceAmount": 80000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["FRIDAY", "SATURDAY"],
              "availableStartTime": "18:00:00",
              "availableEndTime": "21:00:00",
              "slotCapacity": 8
            }
            """.trimIndent()
            header("X-Forwarded-For", "203.0.113.40")
            header("User-Agent", "reservation-product-test")
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("디너 코스") }
            jsonPath("$.visible") { value(true) }
            jsonPath("$.status") { value("ACTIVE") }
            jsonPath("$.availableDays[0]") { value("FRIDAY") }
            jsonPath("$.slotCapacity") { value(8) }
            jsonPath("$.paymentPolicyType") { value("NONE") }
        }.andReturn()
        val productId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        val otherOwner = createBusinessUser("product-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        mockMvc.put("/api/business/reservation-products/$productId") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "권한 없음"}"""
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.get("/api/business/reservation-products") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(productId.toInt()) }
            jsonPath("$[0].name") { value("디너 코스") }
        }

        mockMvc.put("/api/business/reservation-products/$productId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "런치 코스",
              "description": "점심 메뉴",
              "priceAmount": 50000,
              "visible": false,
              "minPartySize": 2,
              "maxPartySize": 6,
              "availableDays": ["SUNDAY"],
              "availableStartTime": "12:00:00",
              "availableEndTime": "14:00:00",
              "slotCapacity": 5
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("런치 코스") }
            jsonPath("$.visible") { value(false) }
            jsonPath("$.availableDays[0]") { value("SUNDAY") }
        }

        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: error("Reservation page should exist.")
        page.status = ReservationPageStatus.PUBLIC
        page.publishedAt = Instant.now()
        reservationPageRepository.saveAndFlush(page)

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isOk() }
            jsonPath("$.products.length()") { value(0) }
        }

        val visibleResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "오마카세",
              "description": "카운터 코스",
              "priceAmount": 120000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 2,
              "slotCapacity": 3
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.availableDays.length()") { value(7) }
        }.andReturn()
        val visibleProductId = JsonPath.read<Int>(visibleResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isOk() }
            jsonPath("$.products.length()") { value(1) }
            jsonPath("$.products[0].id") { value(visibleProductId.toInt()) }
            jsonPath("$.products[0].displayPrice") { value(120000) }
            jsonPath("$.products[0].requiresPayment") { value(false) }
        }

        mockMvc.delete("/api/business/reservation-products/$visibleProductId") {
            cookie(sessionCookie)
        }.andExpect {
            status { isNoContent() }
        }

        assertThat(reservationProductRepository.findById(visibleProductId).orElseThrow().status)
            .isEqualTo(ReservationProductStatus.DELETED)
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", productId).map { it.action })
            .contains("RESERVATION_PRODUCT_CREATED", "RESERVATION_PRODUCT_UPDATED")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", visibleProductId).map { it.action })
            .contains("RESERVATION_PRODUCT_CREATED", "RESERVATION_PRODUCT_DELETED")
    }

    @Test
    fun reservationProductRejectsInvalidPartyRange() {
        val owner = createBusinessUser("product-invalid-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        createApprovedRestaurantForSettings(owner, "Invalid Product Table")

        mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "대관 상품", "minPartySize": 1, "maxPartySize": 30, "slotCapacity": 1}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("단체 예약 상품은 MVP 범위에서 제외됩니다.") }
        }
    }

    @Test
    fun publicAvailabilityUsesHoursHolidaysProductPolicyAndCapacity() {
        val owner = createBusinessUser("availability-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Availability Table", "availability-table")
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(3)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "$targetDay", "opensAt": "11:00:00", "closesAt": "13:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/holiday-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "rules": [
                {
                  "type": "TEMPORARY_TIME",
                  "date": "$targetDate",
                  "startTime": "11:30:00",
                  "endTime": "12:30:00",
                  "reason": "브레이크"
                }
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "availability-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "가능 시간 코스",
              "priceAmount": 70000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "13:00:00",
              "slotCapacity": 4
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/dates") {
            param("productId", productId.toString())
            param("from", targetDate.toString())
            param("to", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.dates.length()") { value(1) }
            jsonPath("$.dates[0].date") { value(targetDate.toString()) }
            jsonPath("$.dates[0].available") { value(true) }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(2) }
            jsonPath("$.times[0].startTime") { value("11:00:00") }
            jsonPath("$.times[0].endTime") { value("11:30:00") }
            jsonPath("$.times[0].remainingCapacity") { value(4) }
            jsonPath("$.times[1].startTime") { value("12:30:00") }
            jsonPath("$.times[1].endTime") { value("13:00:00") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/dates") {
            param("productId", productId.toString())
            param("from", targetDate.toString())
            param("to", targetDate.toString())
            param("partySize", "5")
        }.andExpect {
            status { isOk() }
            jsonPath("$.dates.length()") { value(0) }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.plusDays(1).toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(0) }
        }
    }

    @Test
    fun publicAvailabilityHidesPrivateOrHiddenProducts() {
        val owner = createBusinessUser("availability-hidden-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Hidden Availability Table", "hidden-availability")

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "숨김 상품", "visible": false, "slotCapacity": 1}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(1).toString())
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }
    }

    @Test
    fun businessRestaurantApplicationSubmitRejectsMissingRequiredFields() {
        val sessionCookie = loginAndExtractSessionCookie(
            createBusinessUser("application-missing-required@example.com").email,
        )
        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"restaurantName": "미완성 매장"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("DRAFT") }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") {
                value(org.hamcrest.Matchers.containsString("승인 요청 필수 정보가 부족합니다"))
            }
        }
    }

    @Test
    fun businessRestaurantApplicationSubmitRejectsApprovedBusinessRegistrationDuplicate() {
        val approvedOwner = createBusinessUser("approved-business-owner@example.com")
        val approvedRestaurant = createRestaurantForTest(
            owner = approvedOwner,
            name = "승인 완료 매장",
        )
        restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = approvedRestaurant,
                businessRegistrationNo = "2222222222",
                status = RestaurantApplicationStatus.APPROVED,
            ),
        )

        val owner = createBusinessUser("duplicate-business-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val coverImage = createStoredFile(
            storageKey = "restaurant-cover-images/duplicate-cover.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = owner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/duplicate-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )
        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "2222222222",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "duplicate@example.com",
            )
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("이미 승인된 사업자등록번호입니다.") }
        }
    }

    companion object {
        @Container
        @JvmField
        val mysql = MySQLContainer<Nothing>(DockerImageName.parse("mysql:8.4")).apply {
            withDatabaseName("restaurant_service_test")
            withUsername("restaurant_app")
            withPassword("restaurant_app")
            withCommand(
                "--character-set-server=utf8mb4",
                "--collation-server=utf8mb4_0900_ai_ci",
                "--default-time-zone=+00:00",
            )
        }

        @DynamicPropertySource
        @JvmStatic
        fun databaseProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { mysqlJdbcUrl() }
            registry.add("spring.datasource.username") { mysql.username }
            registry.add("spring.datasource.password") { mysql.password }
            registry.add("app.auth.initial-owner.enabled") { "true" }
            registry.add("app.auth.initial-owner.email") { "owner@example.com" }
            registry.add("app.auth.initial-owner.password") { "CorrectPassword123!" }
            registry.add("app.auth.initial-owner.display-name") { "Initial Owner" }
            registry.add("app.auth.session.cookie-secure") { "true" }
            registry.add("app.auth.password-reset.expose-token-in-response") { "true" }
        }

        private fun mysqlJdbcUrl(): String {
            val separator = if (mysql.jdbcUrl.contains("?")) "&" else "?"
            return "${mysql.jdbcUrl}${separator}connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true"
        }
    }

    @TestConfiguration
    class FoundationTestConfiguration {
        @Bean
        fun foundationTestController(): FoundationTestController = FoundationTestController()
    }

    @RestController
    class FoundationTestController {
        @GetMapping("/test/foundation/api-exception")
        fun apiException(): Nothing = throw ApiException(ErrorCode.BAD_REQUEST, "잘못된 요청입니다.")

        @GetMapping("/test/foundation/unhandled")
        fun unhandled(): Nothing = throw IllegalStateException("unexpected")

        @PostMapping("/test/foundation/validation")
        fun validation(
            @Valid @RequestBody request: FoundationValidationRequest,
        ): FoundationValidationRequest = request
    }

    data class FoundationValidationRequest(
        @field:NotBlank
        val name: String,
    )

    private fun loginAndExtractSessionCookie(
        email: String = "owner@example.com",
        password: String = "CorrectPassword123!",
    ): Cookie {
        val result = mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "$email", "password": "$password"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email") { value(email) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("HttpOnly")) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Secure")) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("SameSite=Lax")) }
        }.andReturn()

        val setCookie = result.response.getHeader(HttpHeaders.SET_COOKIE)
            ?: error("Set-Cookie header is missing.")
        val token = setCookie
            .substringAfter("BUSINESS_SESSION=")
            .substringBefore(";")
        return Cookie("BUSINESS_SESSION", token)
    }

    private fun jpegBytes(): ByteArray =
        byteArrayOf(0xff.toByte(), 0xd8.toByte(), 0xff.toByte(), 0xe0.toByte()) +
            "test-jpeg".encodeToByteArray()

    private fun pdfBytes(): ByteArray =
        "%PDF-1.7\nrestaurant-service-test".encodeToByteArray()

    private fun createBusinessUser(
        email: String,
        role: BusinessUserRole = BusinessUserRole.OWNER,
    ): BusinessUserEntity =
        userRepository.saveAndFlush(
            BusinessUserEntity(
                email = email,
                passwordHash = passwordEncoder.encode("CorrectPassword123!")
                    ?: error("Password encoder returned null."),
                displayName = email.substringBefore("@"),
                role = role,
                status = BusinessUserStatus.ACTIVE,
            ),
        )

    private fun createRestaurantForTest(
        owner: BusinessUserEntity,
        name: String,
        slug: String? = null,
    ): RestaurantEntity =
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = name,
                slug = slug,
                phone = "02-9999-0000",
                addressLine1 = "서울시 테스트구 1",
                cuisineTypesJson = """["dining"]""",
            ),
        )

    private fun createStoredFile(
        storageKey: String,
        purpose: StoredFilePurpose,
        visibility: StoredFileVisibility,
        createdBy: BusinessUserEntity,
    ): StoredFileEntity =
        storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = storageKey,
                originalFilename = storageKey.substringAfterLast('/'),
                contentType = if (purpose == StoredFilePurpose.BUSINESS_LICENSE) "application/pdf" else "image/webp",
                byteSize = 1024,
                checksumSha256 = storageKey.hashCode().toUInt().toString(16).padStart(64, '0').takeLast(64),
                visibility = visibility,
                purpose = purpose,
                createdBy = createdBy,
            ),
        )

    private fun createSubmittedRestaurantApplication(
        owner: BusinessUserEntity,
        businessRegistrationNo: String,
        restaurantName: String,
    ): RestaurantApplicationEntity {
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/$businessRegistrationNo.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = restaurantName,
                phone = "02-7777-0000",
                addressLine1 = "서울시 테스트구 승인로 1",
                cuisineTypesJson = """["dining"]""",
                status = RestaurantStatus.APPROVAL_REQUESTED,
            ),
        )
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name
        userRepository.saveAndFlush(owner)

        return restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = restaurant,
                businessRegistrationNo = businessRegistrationNo,
                businessName = restaurantName,
                representativeName = "대표자",
                businessAddress = "서울시 테스트구 승인로 1",
                businessLicenseFile = businessLicense,
                managerName = "매니저",
                managerPhone = "010-7777-0000",
                managerEmail = "${businessRegistrationNo}@example.com",
                contactVerifiedAt = Instant.now(),
                status = RestaurantApplicationStatus.SUBMITTED,
                submittedAt = Instant.now(),
            ),
        )
    }

    private fun createApprovedRestaurantForSettings(
        owner: BusinessUserEntity,
        restaurantName: String,
        slug: String? = null,
    ): RestaurantEntity {
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = restaurantName,
                slug = slug,
                description = "승인된 매장",
                phone = "02-7777-1000",
                addressLine1 = "서울시 공개구 1",
                cuisineTypesJson = """["dining"]""",
                status = RestaurantStatus.APPROVED,
                approvedAt = Instant.now(),
            ),
        )
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name
        userRepository.saveAndFlush(owner)
        if (slug != null) {
            reservationPageRepository.saveAndFlush(
                ReservationPageEntity(
                    restaurant = restaurant,
                    slug = slug,
                    status = ReservationPageStatus.PRIVATE,
                ),
            )
        }
        return restaurant
    }

    private fun fullRestaurantApplicationJson(
        businessRegistrationNo: String,
        coverImageFileId: Long,
        businessLicenseFileId: Long,
        restaurantDescription: String = "예약제 다이닝",
        managerEmail: String,
    ): String =
        """
        {
          "restaurantName": "스시온",
          "restaurantDescription": "$restaurantDescription",
          "restaurantPhone": "02-555-1000",
          "addressLine1": "서울시 강남구 선릉로 10",
          "addressLine2": "3층",
          "postalCode": "06100",
          "cuisineTypes": ["sushi", "omakase"],
          "coverImageFileId": $coverImageFileId,
          "businessRegistrationNo": "$businessRegistrationNo",
          "businessName": "스시온",
          "representativeName": "김대표",
          "businessAddress": "서울시 강남구 선릉로 10",
          "businessLicenseFileId": $businessLicenseFileId,
          "managerName": "김매니저",
          "managerPhone": "010-3333-4444",
          "managerEmail": "$managerEmail",
          "contactVerified": true
        }
        """.trimIndent()
}
