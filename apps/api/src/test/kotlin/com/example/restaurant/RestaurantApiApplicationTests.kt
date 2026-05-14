package com.example.restaurant

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.MySQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class RestaurantApiApplicationTests {
    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

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
}
