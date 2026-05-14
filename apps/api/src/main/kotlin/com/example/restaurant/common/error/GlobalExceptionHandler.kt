package com.example.restaurant.common.error

import com.example.restaurant.common.api.ApiErrorResponse
import com.example.restaurant.common.trace.TraceContext
import jakarta.validation.ConstraintViolationException
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.HttpRequestMethodNotSupportedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(exception: ApiException): ResponseEntity<ApiErrorResponse> =
        errorResponse(exception.errorCode, exception.message)

    @ExceptionHandler(
        MethodArgumentNotValidException::class,
        ConstraintViolationException::class,
    )
    fun handleValidationException(): ResponseEntity<ApiErrorResponse> =
        errorResponse(ErrorCode.VALIDATION_ERROR)

    @ExceptionHandler(
        HttpMessageNotReadableException::class,
        MissingServletRequestParameterException::class,
    )
    fun handleBadRequestException(): ResponseEntity<ApiErrorResponse> =
        errorResponse(ErrorCode.BAD_REQUEST)

    @ExceptionHandler(HttpRequestMethodNotSupportedException::class)
    fun handleMethodNotAllowedException(): ResponseEntity<ApiErrorResponse> =
        errorResponse(ErrorCode.METHOD_NOT_ALLOWED)

    @ExceptionHandler(Exception::class)
    fun handleException(): ResponseEntity<ApiErrorResponse> =
        errorResponse(ErrorCode.INTERNAL_SERVER_ERROR)

    private fun errorResponse(
        errorCode: ErrorCode,
        message: String = errorCode.defaultMessage,
    ): ResponseEntity<ApiErrorResponse> =
        ResponseEntity
            .status(errorCode.status)
            .body(
                ApiErrorResponse(
                    code = errorCode.code,
                    message = message,
                    traceId = TraceContext.currentTraceId(),
                ),
            )
}
