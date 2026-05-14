package com.example.restaurant.common.openapi

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfiguration {
    @Bean
    fun restaurantServiceOpenApi(): OpenAPI =
        OpenAPI()
            .info(
                Info()
                    .title("Restaurant Service API")
                    .version("0.0.1")
                    .description("식당 예약 플랫폼 API"),
            )
}
