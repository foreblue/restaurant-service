package com.example.restaurant.notification

import jakarta.persistence.LockModeType
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface NotificationRepository : JpaRepository<NotificationEntity, Long> {
    fun findByReservationIdOrderByCreatedAtAsc(reservationId: Long): List<NotificationEntity>

    fun countByReservationIdAndTemplateKey(
        reservationId: Long,
        templateKey: String,
    ): Long

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from NotificationEntity n where n.id = :id")
    fun findByIdForUpdate(
        @Param("id") id: Long,
    ): NotificationEntity?

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        """
        select n from NotificationEntity n
        where n.status in :statuses
          and (n.scheduledAt is null or n.scheduledAt <= :now)
          and (n.nextRetryAt is null or n.nextRetryAt <= :now)
        order by n.createdAt asc, n.id asc
        """,
    )
    fun findDispatchable(
        @Param("statuses") statuses: Collection<NotificationStatus>,
        @Param("now") now: Instant,
        pageable: Pageable,
    ): List<NotificationEntity>

    fun findByReservationIdAndTemplateKeyAndStatusIn(
        reservationId: Long,
        templateKey: String,
        statuses: Collection<NotificationStatus>,
    ): List<NotificationEntity>
}
