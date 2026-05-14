package com.example.restaurant.common.trace

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID
import kotlin.time.DurationUnit
import kotlin.time.toDuration

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class TraceIdFilter : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(TraceIdFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val traceId = request.getHeader(TraceContext.TRACE_ID_HEADER)
            ?.takeIf { it.isNotBlank() }
            ?: UUID.randomUUID().toString()
        val startedAt = System.nanoTime()

        MDC.put(TraceContext.MDC_KEY, traceId)
        response.setHeader(TraceContext.TRACE_ID_HEADER, traceId)

        try {
            filterChain.doFilter(request, response)
        } finally {
            val durationMs = (System.nanoTime() - startedAt)
                .toDuration(DurationUnit.NANOSECONDS)
                .inWholeMilliseconds
            log.info(
                "http request completed method={} path={} status={} durationMs={}",
                request.method,
                request.requestURI,
                response.status,
                durationMs,
            )
            MDC.remove(TraceContext.MDC_KEY)
        }
    }
}
