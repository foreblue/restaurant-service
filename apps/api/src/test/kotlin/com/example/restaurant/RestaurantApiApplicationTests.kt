package com.example.restaurant

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.common.trace.TraceContext
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
import org.springframework.http.MediaType
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
}
