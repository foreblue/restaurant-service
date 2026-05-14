package com.example.restaurant.common.error

import com.example.restaurant.common.api.ApiErrorResponse
import com.example.restaurant.common.trace.TraceContext
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.stereotype.Component

@Component
class ApiErrorResponseWriter {
    private val objectMapper = jacksonObjectMapper()

    fun write(
        response: HttpServletResponse,
        errorCode: ErrorCode,
        message: String = errorCode.defaultMessage,
    ) {
        if (response.isCommitted) {
            return
        }

        response.status = errorCode.status.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        objectMapper.writeValue(
            response.outputStream,
            ApiErrorResponse(
                code = errorCode.code,
                message = message,
                traceId = TraceContext.currentTraceId(),
            ),
        )
    }
}
