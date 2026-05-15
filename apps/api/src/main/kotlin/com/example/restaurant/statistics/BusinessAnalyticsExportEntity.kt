package com.example.restaurant.statistics

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.restaurant.RestaurantEntity
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
import java.time.LocalDate

@Entity
@Table(name = "analytics_export_requests")
class BusinessAnalyticsExportEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    val restaurant: RestaurantEntity,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_user_id", nullable = false)
    val requestedByUser: BusinessUserEntity,

    @Enumerated(EnumType.STRING)
    @Column(name = "export_type", nullable = false, length = 50)
    val exportType: BusinessAnalyticsExportType,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    var status: BusinessAnalyticsExportStatus = BusinessAnalyticsExportStatus.PROCESSING,

    @Column(name = "from_date")
    var fromDate: LocalDate? = null,

    @Column(name = "to_date")
    var toDate: LocalDate? = null,

    @Column(name = "slot_date")
    var slotDate: LocalDate? = null,

    @Column(name = "row_count", nullable = false)
    var rowCount: Int = 0,

    @Column(name = "file_name", length = 191)
    var fileName: String? = null,

    @Column(name = "content_type", nullable = false, length = 100)
    var contentType: String = CSV_CONTENT_TYPE,

    @Column(name = "csv_content", columnDefinition = "longtext")
    var csvContent: String? = null,

    @Column(name = "failure_message", length = 500)
    var failureMessage: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    val createdAt: Instant? = null,

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    val updatedAt: Instant? = null,
)

enum class BusinessAnalyticsExportType {
    RESERVATION_SUMMARY,
    PAYMENT_REFUND_SUMMARY,
    PRODUCT_PERFORMANCE,
    TIME_SLOT_RESERVATION_RATE,
}

enum class BusinessAnalyticsExportStatus {
    PROCESSING,
    COMPLETED,
    FAILED,
}

const val CSV_CONTENT_TYPE = "text/csv; charset=utf-8"
