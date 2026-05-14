package com.example.restaurant.restaurant

import org.springframework.data.jpa.repository.JpaRepository

interface StoredFileRepository : JpaRepository<StoredFileEntity, Long> {
    fun findByStorageKey(storageKey: String): StoredFileEntity?
}
