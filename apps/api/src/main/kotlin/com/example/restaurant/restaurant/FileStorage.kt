package com.example.restaurant.restaurant

data class FileStorageSaveRequest(
    val originalFilename: String,
    val contentType: String,
    val content: ByteArray,
    val visibility: StoredFileVisibility,
    val purpose: StoredFilePurpose,
)

data class FileStorageResult(
    val storageKey: String,
    val originalFilename: String,
    val contentType: String,
    val byteSize: Long,
    val checksumSha256: String,
    val visibility: StoredFileVisibility,
    val purpose: StoredFilePurpose,
)

interface FileStorage {
    fun save(request: FileStorageSaveRequest): FileStorageResult

    fun read(storageKey: String): ByteArray?

    fun publicUrl(storageKey: String): String?
}
