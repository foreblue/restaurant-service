package com.example.restaurant.restaurant

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.security.MessageDigest
import java.util.UUID

@ConfigurationProperties(prefix = "app.file-storage.local")
data class LocalFileStorageProperties(
    val rootPath: String = "/tmp/restaurant-service-files",
    val publicBaseUrl: String = "",
)

@Component
class LocalFileStorage(
    private val properties: LocalFileStorageProperties,
) : FileStorage {
    override fun save(request: FileStorageSaveRequest): FileStorageResult {
        val storageKey = buildStorageKey(request)
        val targetPath = resolveStorageKey(storageKey)
        Files.createDirectories(targetPath.parent)
        Files.write(targetPath, request.content)

        return FileStorageResult(
            storageKey = storageKey,
            originalFilename = request.originalFilename,
            contentType = request.contentType,
            byteSize = request.content.size.toLong(),
            checksumSha256 = sha256Hex(request.content),
            visibility = request.visibility,
            purpose = request.purpose,
        )
    }

    override fun read(storageKey: String): ByteArray? {
        val path = resolveStorageKey(storageKey)
        if (!Files.exists(path)) {
            return null
        }
        return Files.readAllBytes(path)
    }

    override fun publicUrl(storageKey: String): String? {
        val baseUrl = properties.publicBaseUrl.trimEnd('/')
        if (baseUrl.isBlank()) {
            return null
        }
        return "$baseUrl/$storageKey"
    }

    private fun buildStorageKey(request: FileStorageSaveRequest): String {
        val safeFilename = request.originalFilename
            .substringAfterLast('/')
            .substringAfterLast('\\')
            .replace(Regex("[^A-Za-z0-9._-]"), "-")
            .ifBlank { "file" }
        return "${request.purpose.name.lowercase()}/${UUID.randomUUID()}-$safeFilename"
    }

    private fun resolveStorageKey(storageKey: String): Path {
        require(!storageKey.contains("..")) { "storageKey must not contain path traversal." }
        val root = Path.of(properties.rootPath).toAbsolutePath().normalize()
        val resolved = root.resolve(storageKey).normalize()
        require(resolved.startsWith(root)) { "storageKey must stay under the configured root." }
        return resolved
    }

    private fun sha256Hex(content: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(content)
        return digest.joinToString(separator = "") { "%02x".format(it.toInt() and 0xff) }
    }
}
