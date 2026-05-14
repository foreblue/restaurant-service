package com.example.restaurant.common.trace

import org.slf4j.MDC

object TraceContext {
    const val TRACE_ID_HEADER = "X-Trace-Id"
    const val MDC_KEY = "traceId"
    private const val UNKNOWN_TRACE_ID = "unknown"

    fun currentTraceId(): String = MDC.get(MDC_KEY) ?: UNKNOWN_TRACE_ID
}
