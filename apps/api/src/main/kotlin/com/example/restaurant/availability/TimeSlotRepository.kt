package com.example.restaurant.availability

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface TimeSlotRepository : JpaRepository<TimeSlotEntity, Long> {
    fun findByReservationProductIdAndSlotDateOrderByStartTimeAscIdAsc(
        reservationProductId: Long,
        slotDate: LocalDate,
    ): List<TimeSlotEntity>
}
