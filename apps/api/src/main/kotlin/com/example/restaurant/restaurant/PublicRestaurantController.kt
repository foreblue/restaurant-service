package com.example.restaurant.restaurant

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/restaurants")
@Tag(name = "Public Restaurants")
class PublicRestaurantController(
    private val restaurantSettingsService: RestaurantSettingsService,
) {
    @GetMapping
    @Operation(
        summary = "전체 매장 목록 조회",
        description = "고객 예약 진입 화면에 노출할 매장 목록을 반환합니다.",
    )
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "전체 매장 목록 조회 성공"),
        ],
    )
    fun publicRestaurants(): PublicRestaurantListResponse =
        restaurantSettingsService.publicRestaurants()

    @GetMapping("/{slug}")
    @Operation(
        summary = "slug 기준 공개 예약 페이지 조회",
        description = "공개 예약 페이지의 canonical endpoint입니다. 비공개, 승인 대기, 운영 중지, 공개 필수값 누락 상태는 404로 응답합니다.",
    )
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "공개 예약 페이지 조회 성공"),
            ApiResponse(responseCode = "404", description = "공개 예약 페이지 없음 또는 공개 불가 상태"),
        ],
    )
    fun publicRestaurant(
        @Parameter(description = "예약 페이지 slug")
        @PathVariable slug: String,
    ): PublicRestaurantResponse =
        restaurantSettingsService.publicRestaurant(slug)

    @GetMapping("/{restaurantId}/reservation-page")
    @Operation(
        summary = "restaurantId 기준 공개 예약 페이지 조회",
        description = "Customer FE 호환 endpoint입니다. 응답 계약과 404 정책은 slug 기준 canonical endpoint와 동일합니다.",
    )
    @ApiResponses(
        value = [
            ApiResponse(responseCode = "200", description = "공개 예약 페이지 조회 성공"),
            ApiResponse(responseCode = "404", description = "공개 예약 페이지 없음 또는 공개 불가 상태"),
        ],
    )
    fun publicReservationPageByRestaurantId(
        @Parameter(description = "매장 ID")
        @PathVariable restaurantId: Long,
    ): PublicRestaurantResponse =
        restaurantSettingsService.publicRestaurantById(restaurantId)
}
