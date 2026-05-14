package com.example.restaurant.audit

import com.example.restaurant.auth.BusinessUserEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "audit_logs")
class AuditLogEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    val actorUser: BusinessUserEntity? = null,

    @Column(name = "actor_role", nullable = false, length = 50)
    val actorRole: String,

    @Column(nullable = false, length = 100)
    val action: String,

    @Column(name = "target_type", nullable = false, length = 100)
    val targetType: String,

    @Column(name = "target_id", nullable = false)
    val targetId: Long,

    @Column(name = "before_value", columnDefinition = "json")
    val beforeValue: String? = null,

    @Column(name = "after_value", columnDefinition = "json")
    val afterValue: String? = null,

    @Column(name = "ip_address", length = 64)
    val ipAddress: String? = null,

    @Column(name = "user_agent", length = 512)
    val userAgent: String? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,
)
