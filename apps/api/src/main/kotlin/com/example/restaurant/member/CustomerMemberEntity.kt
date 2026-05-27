package com.example.restaurant.member

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant

@Entity
@Table(name = "customer_members")
class CustomerMemberEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 255, unique = true)
    var email: String,

    @Column(nullable = false, length = 80)
    var name: String,

    @Column(name = "phone_number", nullable = false, length = 32, unique = true)
    var phoneNumber: String,

    @Column(name = "allergy_note", columnDefinition = "text")
    var allergyNote: String? = null,

    @Column(name = "anniversary_type", length = 40)
    var anniversaryType: String? = null,

    @Column(name = "anniversary_date", length = 10)
    var anniversaryDate: String? = null,

    @Column(name = "marketing_opt_in", nullable = false)
    var marketingOptIn: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: CustomerMemberStatus = CustomerMemberStatus.ACTIVE,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)

enum class CustomerMemberStatus {
    ACTIVE,
    INACTIVE,
}

interface CustomerMemberRepository : JpaRepository<CustomerMemberEntity, Long> {
    fun findByEmail(email: String): CustomerMemberEntity?

    fun findByStatusOrderByIdAsc(status: CustomerMemberStatus): List<CustomerMemberEntity>
}
