package com.example.restaurant

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessUserStatus
import com.example.restaurant.auth.ReservationLookupTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.common.trace.TraceContext
import com.jayway.jsonpath.JsonPath
import jakarta.servlet.http.Cookie
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
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
}
