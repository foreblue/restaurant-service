package com.example.restaurant.common.error

import org.springframework.http.HttpStatus

enum class ErrorCode(
    val status: HttpStatus,
    val code: String,
    val defaultMessage: String,
) {
    AUTHENTICATION_REQUIRED(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "인증이 필요합니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "접근 권한이 없습니다."),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "요청을 처리할 수 없습니다."),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "요청 값이 유효하지 않습니다."),
    PASSWORD_RESET_TOKEN_INVALID(
        HttpStatus.BAD_REQUEST,
        "PASSWORD_RESET_TOKEN_INVALID",
        "비밀번호 재설정 토큰이 유효하지 않습니다.",
    ),
    PASSWORD_RESET_TOKEN_EXPIRED(
        HttpStatus.BAD_REQUEST,
        "PASSWORD_RESET_TOKEN_EXPIRED",
        "비밀번호 재설정 토큰이 만료되었습니다.",
    ),
    PASSWORD_RESET_TOKEN_USED(
        HttpStatus.CONFLICT,
        "PASSWORD_RESET_TOKEN_USED",
        "이미 사용된 비밀번호 재설정 토큰입니다.",
    ),
    NOT_FOUND(HttpStatus.NOT_FOUND, "NOT_FOUND", "요청한 리소스를 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "CONFLICT", "요청 상태가 충돌합니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메서드입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다."),
}
