package com.example.restaurant.restaurant

import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/public/files")
class PublicFileController(
    private val storedFileRepository: StoredFileRepository,
    private val fileStorage: FileStorage,
) {
    @GetMapping("/{fileId}")
    fun publicFile(@PathVariable fileId: Long): ResponseEntity<ByteArray> {
        val file = storedFileRepository.findById(fileId)
            .orElseThrow { ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.") }

        if (file.visibility != StoredFileVisibility.PUBLIC) {
            throw ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.")
        }

        val content = fileStorage.read(file.storageKey)
            ?: throw ApiException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.")

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
            .contentLength(content.size.toLong())
            .contentType(MediaType.parseMediaType(file.contentType))
            .body(content)
    }
}
