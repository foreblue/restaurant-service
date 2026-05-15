package com.example.restaurant.restaurant

import java.time.Instant

data class BusinessFileUploadResponse(
    val id: Long,
    val purpose: String,
    val visibility: StoredFileVisibility,
    val originalFilename: String,
    val contentType: String,
    val byteSize: Long,
    val checksumSha256: String?,
    val publicUrl: String?,
    val createdAt: Instant?,
)
