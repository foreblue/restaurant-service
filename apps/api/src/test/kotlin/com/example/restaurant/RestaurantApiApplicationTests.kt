package com.example.restaurant

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessUserStatus
import com.example.restaurant.auth.ReservationLookupTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.common.trace.TraceContext
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
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.testcontainers.containers.MySQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

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
    private lateinit var storedFileRepository: StoredFileRepository

    @Autowired
    private lateinit var restaurantRepository: RestaurantRepository

    @Autowired
    private lateinit var restaurantApplicationRepository: RestaurantApplicationRepository

    @Autowired
    private lateinit var reservationPageRepository: ReservationPageRepository

    @Autowired
    private lateinit var fileStorage: FileStorage

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
    fun adminApiReturnsAccessDeniedUntilAdminAuthIsImplemented() {
        mockMvc.get("/api/admin/restaurants") {
            header(TraceContext.TRACE_ID_HEADER, "admin-trace-1")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
            jsonPath("$.message") { value("접근 권한이 없습니다.") }
            jsonPath("$.traceId") { value("admin-trace-1") }
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

    private fun loginAndExtractSessionCookie(): Cookie {
        val result = mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "owner@example.com", "password": "CorrectPassword123!"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email") { value("owner@example.com") }
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

    private fun createBusinessUser(email: String): BusinessUserEntity =
        userRepository.saveAndFlush(
            BusinessUserEntity(
                email = email,
                passwordHash = passwordEncoder.encode("CorrectPassword123!")
                    ?: error("Password encoder returned null."),
                displayName = email.substringBefore("@"),
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
}
