package com.example.restaurant.restaurant

import com.example.restaurant.auth.BusinessPrincipal
import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.util.Locale

private const val MEBIBYTE = 1024L * 1024L

@Service
class BusinessFileService(
    private val userRepository: BusinessUserRepository,
    private val fileStorage: FileStorage,
    private val storedFileRepository: StoredFileRepository,
) {
    @Transactional
    fun upload(
        principal: BusinessPrincipal,
        purposeValue: String,
        file: MultipartFile,
    ): BusinessFileUploadResponse {
        val owner = userRepository.findById(principal.userId)
            .orElseThrow { ApiException(ErrorCode.AUTHENTICATION_REQUIRED) }
        val policy = BusinessFileUploadPolicy.fromPurposeValue(purposeValue)
        val originalFilename = file.originalFilename?.trim().orEmpty()
        val contentType = file.contentType?.lowercase(Locale.ROOT)?.trim().orEmpty()
        validateFile(file, originalFilename, contentType, policy)

        val storageResult = fileStorage.save(
            FileStorageSaveRequest(
                originalFilename = originalFilename,
                contentType = contentType,
                content = file.bytes,
                visibility = policy.visibility,
                purpose = policy.purpose,
            ),
        )
        val saved = storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = storageResult.storageKey,
                originalFilename = storageResult.originalFilename,
                contentType = storageResult.contentType,
                byteSize = storageResult.byteSize,
                checksumSha256 = storageResult.checksumSha256,
                visibility = storageResult.visibility,
                purpose = storageResult.purpose,
                createdBy = owner,
            ),
        )

        return saved.toUploadResponse(fileStorage)
    }

    private fun validateFile(
        file: MultipartFile,
        originalFilename: String,
        contentType: String,
        policy: BusinessFileUploadPolicy,
    ) {
        if (file.isEmpty || file.size <= 0) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "업로드할 파일이 비어 있습니다.")
        }
        if (file.size > policy.maxBytes) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "파일 크기는 ${policy.maxBytes / MEBIBYTE}MB를 초과할 수 없습니다.")
        }
        if (originalFilename.isBlank()) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "원본 파일명이 필요합니다.")
        }
        val extension = originalFilename.substringAfterLast('.', missingDelimiterValue = "")
            .lowercase(Locale.ROOT)
        if (extension !in policy.allowedExtensions) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "허용되지 않는 파일 확장자입니다.")
        }
        if (contentType !in policy.allowedContentTypes) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "허용되지 않는 파일 형식입니다.")
        }
        if (!hasExpectedFileSignature(contentType, file.bytes)) {
            throw ApiException(ErrorCode.VALIDATION_ERROR, "파일 내용과 형식이 일치하지 않습니다.")
        }
    }

    private fun hasExpectedFileSignature(contentType: String, bytes: ByteArray): Boolean =
        when (contentType) {
            "application/pdf" -> bytes.startsWith("%PDF-".encodeToByteArray())
            "image/jpeg" -> bytes.size >= 3 &&
                bytes[0] == 0xff.toByte() &&
                bytes[1] == 0xd8.toByte() &&
                bytes[2] == 0xff.toByte()
            "image/png" -> bytes.startsWith(
                byteArrayOf(
                    0x89.toByte(),
                    0x50,
                    0x4e,
                    0x47,
                    0x0d,
                    0x0a,
                    0x1a,
                    0x0a,
                ),
            )
            "image/webp" -> bytes.size >= 12 &&
                bytes.copyOfRange(0, 4).decodeToString() == "RIFF" &&
                bytes.copyOfRange(8, 12).decodeToString() == "WEBP"
            else -> false
        }

    private fun ByteArray.startsWith(prefix: ByteArray): Boolean {
        if (size < prefix.size) {
            return false
        }
        return prefix.indices.all { this[it] == prefix[it] }
    }
}

private data class BusinessFileUploadPolicy(
    val requestValue: String,
    val purpose: StoredFilePurpose,
    val visibility: StoredFileVisibility,
    val maxBytes: Long,
    val allowedContentTypes: Set<String>,
    val allowedExtensions: Set<String>,
) {
    companion object {
        private val values = listOf(
            BusinessFileUploadPolicy(
                requestValue = "business_license",
                purpose = StoredFilePurpose.BUSINESS_LICENSE,
                visibility = StoredFileVisibility.PRIVATE,
                maxBytes = 10L * MEBIBYTE,
                allowedContentTypes = setOf("application/pdf", "image/jpeg", "image/png"),
                allowedExtensions = setOf("pdf", "jpg", "jpeg", "png"),
            ),
            BusinessFileUploadPolicy(
                requestValue = "restaurant_image",
                purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
                visibility = StoredFileVisibility.PUBLIC,
                maxBytes = 5L * MEBIBYTE,
                allowedContentTypes = setOf("image/jpeg", "image/png", "image/webp"),
                allowedExtensions = setOf("jpg", "jpeg", "png", "webp"),
            ),
        )

        fun fromPurposeValue(value: String): BusinessFileUploadPolicy {
            val normalized = value.trim().lowercase(Locale.ROOT)
            return values.firstOrNull { it.requestValue == normalized }
                ?: throw ApiException(ErrorCode.VALIDATION_ERROR, "지원하지 않는 업로드 목적입니다.")
        }
    }
}

private fun StoredFileEntity.toUploadResponse(fileStorage: FileStorage): BusinessFileUploadResponse =
    BusinessFileUploadResponse(
        id = id,
        purpose = when (purpose) {
            StoredFilePurpose.BUSINESS_LICENSE -> "business_license"
            StoredFilePurpose.RESTAURANT_COVER_IMAGE -> "restaurant_image"
        },
        visibility = visibility,
        originalFilename = originalFilename,
        contentType = contentType,
        byteSize = byteSize,
        checksumSha256 = checksumSha256,
        storageKey = storageKey,
        publicUrl = if (visibility == StoredFileVisibility.PUBLIC) fileStorage.publicUrl(storageKey) else null,
        createdAt = createdAt,
    )
