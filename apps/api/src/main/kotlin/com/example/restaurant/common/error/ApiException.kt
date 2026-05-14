package com.example.restaurant.common.error

class ApiException(
    val errorCode: ErrorCode,
    override val message: String = errorCode.defaultMessage,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
