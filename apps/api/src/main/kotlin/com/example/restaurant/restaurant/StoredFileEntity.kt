package com.example.restaurant.restaurant

import com.example.restaurant.auth.BusinessUserEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "stored_files")
class StoredFileEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "storage_key", nullable = false, unique = true, length = 512)
    val storageKey: String,

    @Column(name = "original_filename", nullable = false)
    val originalFilename: String,

    @Column(name = "content_type", nullable = false, length = 100)
    val contentType: String,

    @Column(name = "byte_size", nullable = false)
    val byteSize: Long,

    @Column(name = "checksum_sha256", length = 64)
    val checksumSha256: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val visibility: StoredFileVisibility,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    val purpose: StoredFilePurpose,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    val createdBy: BusinessUserEntity? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,
)
