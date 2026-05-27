package com.example.restaurant.member

import io.swagger.v3.oas.annotations.Operation
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/members")
class PublicMemberController(
    private val memberRepository: CustomerMemberRepository,
) {
    @Operation(summary = "예약 회원 목록 조회")
    @GetMapping
    fun list(): PublicMemberListResponse =
        PublicMemberListResponse(
            members = memberRepository.findByStatusOrderByIdAsc(CustomerMemberStatus.ACTIVE)
                .map { it.toResponse() },
        )

    @Operation(summary = "예약 회원 단건 조회")
    @GetMapping("/{memberId}")
    fun detail(
        @PathVariable memberId: Long,
    ): PublicMemberResponse {
        val member = memberRepository.findById(memberId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.") }
        if (member.status != CustomerMemberStatus.ACTIVE) {
            throw ApiException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.")
        }
        return member.toResponse()
    }

    private fun CustomerMemberEntity.toResponse(): PublicMemberResponse =
        PublicMemberResponse(
            id = id,
            name = name,
            phoneLast4 = phoneNumber.takeLast(4),
            email = email,
            allergyNote = allergyNote,
            anniversaryType = anniversaryType,
            anniversaryDate = anniversaryDate,
            marketingOptIn = marketingOptIn,
        )
}
