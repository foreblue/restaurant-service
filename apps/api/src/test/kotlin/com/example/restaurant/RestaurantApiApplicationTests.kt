package com.example.restaurant

import com.example.restaurant.auth.BusinessUserEntity
import com.example.restaurant.auth.BusinessUserRepository
import com.example.restaurant.auth.BusinessUserRole
import com.example.restaurant.auth.BusinessUserStatus
import com.example.restaurant.auth.BusinessPasswordResetNotificationRepository
import com.example.restaurant.auth.BusinessPasswordResetTokenEntity
import com.example.restaurant.auth.BusinessPasswordResetTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenRepository
import com.example.restaurant.auth.ReservationLookupTokenService
import com.example.restaurant.auth.TokenHash
import com.example.restaurant.audit.AuditLogRepository
import com.example.restaurant.common.error.ApiException
import com.example.restaurant.common.error.ErrorCode
import com.example.restaurant.common.trace.TraceContext
import com.example.restaurant.notification.NotificationRepository
import com.example.restaurant.notification.NotificationStatus
import com.example.restaurant.notification.NotificationChannel
import com.example.restaurant.notification.NotificationEntity
import com.example.restaurant.notification.NotificationRecipientType
import com.example.restaurant.notification.PAYMENT_COMPLETED_TEMPLATE
import com.example.restaurant.notification.REFUND_COMPLETED_TEMPLATE
import com.example.restaurant.notification.RESERVATION_CANCELLED_TEMPLATE
import com.example.restaurant.notification.RESERVATION_CONFIRMED_TEMPLATE
import com.example.restaurant.notification.RESERVATION_UPDATED_TEMPLATE
import com.example.restaurant.notification.VISIT_REMINDER_TEMPLATE
import com.example.restaurant.payment.CancellationPolicyEntity
import com.example.restaurant.payment.CancellationPolicyRepository
import com.example.restaurant.payment.PaymentEntity
import com.example.restaurant.payment.PaymentRepository
import com.example.restaurant.payment.PaymentStatus
import com.example.restaurant.payment.PaymentType
import com.example.restaurant.payment.PgWebhookEventRepository
import com.example.restaurant.payment.PgWebhookEventStatus
import com.example.restaurant.refund.RefundEntity
import com.example.restaurant.refund.RefundReason
import com.example.restaurant.refund.RefundRepository
import com.example.restaurant.refund.RefundRequesterRole
import com.example.restaurant.refund.RefundStatus
import com.example.restaurant.reservation.CustomerRepository
import com.example.restaurant.reservation.ReservationPaymentMode
import com.example.restaurant.reservation.ReservationRepository
import com.example.restaurant.reservation.ReservationSource
import com.example.restaurant.reservation.ReservationStatus
import com.example.restaurant.reservationproduct.ReservationProductPaymentPolicyType
import com.example.restaurant.reservationproduct.ReservationProductRepository
import com.example.restaurant.reservationproduct.ReservationProductStatus
import com.example.restaurant.restaurant.FileStorage
import com.example.restaurant.restaurant.FileStorageSaveRequest
import com.example.restaurant.restaurant.ReservationPageEntity
import com.example.restaurant.restaurant.ReservationPageRepository
import com.example.restaurant.restaurant.ReservationPageStatus
import com.example.restaurant.restaurant.RestaurantEntity
import com.example.restaurant.restaurant.RestaurantRepository
import com.example.restaurant.restaurant.RestaurantStatus
import com.example.restaurant.restaurant.StoredFileEntity
import com.example.restaurant.restaurant.StoredFilePurpose
import com.example.restaurant.restaurant.StoredFileRepository
import com.example.restaurant.restaurant.StoredFileVisibility
import com.example.restaurant.restaurantapplication.RestaurantApplicationEntity
import com.example.restaurant.restaurantapplication.RestaurantApplicationRepository
import com.example.restaurant.restaurantapplication.RestaurantApplicationStatus
import com.jayway.jsonpath.JsonPath
import jakarta.servlet.http.Cookie
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import org.testcontainers.containers.MySQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.utility.DockerImageName
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class RestaurantApiApplicationTests {
    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: BusinessUserRepository

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    @Autowired
    private lateinit var reservationLookupTokenRepository: ReservationLookupTokenRepository

    @Autowired
    private lateinit var reservationLookupTokenService: ReservationLookupTokenService

    @Autowired
    private lateinit var passwordResetTokenRepository: BusinessPasswordResetTokenRepository

    @Autowired
    private lateinit var passwordResetNotificationRepository: BusinessPasswordResetNotificationRepository

    @Autowired
    private lateinit var storedFileRepository: StoredFileRepository

    @Autowired
    private lateinit var restaurantRepository: RestaurantRepository

    @Autowired
    private lateinit var restaurantApplicationRepository: RestaurantApplicationRepository

    @Autowired
    private lateinit var reservationPageRepository: ReservationPageRepository

    @Autowired
    private lateinit var reservationProductRepository: ReservationProductRepository

    @Autowired
    private lateinit var customerRepository: CustomerRepository

    @Autowired
    private lateinit var reservationRepository: ReservationRepository

    @Autowired
    private lateinit var notificationRepository: NotificationRepository

    @Autowired
    private lateinit var fileStorage: FileStorage

    @Autowired
    private lateinit var auditLogRepository: AuditLogRepository

    @Autowired
    private lateinit var cancellationPolicyRepository: CancellationPolicyRepository

    @Autowired
    private lateinit var paymentRepository: PaymentRepository

    @Autowired
    private lateinit var refundRepository: RefundRepository

    @Autowired
    private lateinit var pgWebhookEventRepository: PgWebhookEventRepository

    @Test
    fun contextLoads() {
        assertThat(mysql.isRunning).isEqualTo(true)
    }

    @Test
    fun flywayMigrationIsApplied() {
        val versions = jdbcTemplate.queryForList(
            "select version from flyway_schema_history where success = 1",
            String::class.java,
        )
        val schemaVersion = jdbcTemplate.queryForObject(
            "select metadata_value from app_schema_metadata where metadata_key = 'schema_version'",
            String::class.java,
        )

        assertThat(versions).contains("1")
        assertThat(schemaVersion).isEqualTo("1")
    }

    @Test
    fun paymentRefundAndCancellationPolicyRepositoriesPersistDomainFoundation() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "payment-domain-owner@example.com",
            restaurantName = "Payment Domain Table",
            slug = "payment-domain",
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "payment-domain-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "결제도메인",
            customerPhone = "010-1919-0000",
        )
        val product = reservationProductRepository.findById(fixture.productId).orElseThrow()
        val reservation = reservationRepository.findBusinessReservationById(created.id)
            ?: error("Reservation should exist.")

        val policy = cancellationPolicyRepository.saveAndFlush(
            CancellationPolicyEntity(
                restaurant = fixture.restaurant,
                reservationProduct = product,
                name = "표준 취소 정책",
                rulesJson = """[{"beforeVisitHours":48,"refundRate":100},{"beforeVisitHours":24,"refundRate":50}]""",
                noShowRuleJson = """{"refundRate":0,"feeAmount":30000}""",
                restaurantCancelRefundRate = 100,
                effectiveFrom = Instant.parse("2026-05-15T00:00:00Z"),
            ),
        )
        val policySnapshot = """{"policyId":${policy.id},"rules":[{"beforeVisitHours":48,"refundRate":100}]}"""
        reservation.paymentRequired = true
        reservation.paymentMode = ReservationPaymentMode.DEPOSIT
        reservation.paymentStatus = PaymentStatus.REQUIRES_PAYMENT
        reservation.paymentDueAt = Instant.parse("2026-05-15T01:00:00Z")
        reservation.cancellationPolicySnapshotJson = policySnapshot
        reservationRepository.saveAndFlush(reservation)

        val payment = paymentRepository.saveAndFlush(
            PaymentEntity(
                restaurant = fixture.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                paymentType = PaymentType.DEPOSIT,
                status = PaymentStatus.PAID,
                amount = 30_000,
                refundedAmount = 10_000,
                pgProviderKey = "fake-pg",
                pgPaymentId = "pg-payment-domain-1",
                pgOrderId = "order-payment-domain-1",
                idempotencyKey = "payment-domain-payment-1",
                paidAt = Instant.parse("2026-05-15T00:10:00Z"),
            ),
        )
        val refund = refundRepository.saveAndFlush(
            RefundEntity(
                payment = payment,
                reservation = reservation,
                restaurant = fixture.restaurant,
                status = RefundStatus.SUCCEEDED,
                refundAmount = 10_000,
                nonRefundableAmount = 20_000,
                reason = RefundReason.CUSTOMER_CANCEL,
                policySnapshotJson = policySnapshot,
                policyRuleId = "rule_48h_100",
                pgRefundId = "pg-refund-domain-1",
                idempotencyKey = "payment-domain-refund-1",
                requestedByRole = RefundRequesterRole.CUSTOMER,
                succeededAt = Instant.parse("2026-05-15T00:20:00Z"),
            ),
        )

        val reloadedReservation = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reloadedReservation.paymentRequired).isTrue()
        assertThat(reloadedReservation.paymentMode).isEqualTo(ReservationPaymentMode.DEPOSIT)
        assertThat(reloadedReservation.paymentStatus).isEqualTo(PaymentStatus.REQUIRES_PAYMENT)
        assertThat(JsonPath.read<Int>(reloadedReservation.cancellationPolicySnapshotJson, "$.policyId").toLong())
            .isEqualTo(policy.id)
        assertThat(
            cancellationPolicyRepository
                .findByReservationProductIdAndActiveOrderByEffectiveFromDesc(fixture.productId, true)
                .map { it.id },
        ).containsExactly(policy.id)
        assertThat(paymentRepository.findByReservationIdOrderByCreatedAtAsc(created.id).single().id)
            .isEqualTo(payment.id)
        assertThat(paymentRepository.findByIdempotencyKey("payment-domain-payment-1")?.status)
            .isEqualTo(PaymentStatus.PAID)
        assertThat(refundRepository.findByPaymentIdOrderByCreatedAtAsc(payment.id).single().id)
            .isEqualTo(refund.id)
        assertThat(refundRepository.findByIdempotencyKey("payment-domain-refund-1")?.status)
            .isEqualTo(RefundStatus.SUCCEEDED)
        assertThat(
            jdbcTemplate.queryForList("show tables", String::class.java)
                .filter { it.contains("settlement", ignoreCase = true) },
        ).isEmpty()
    }

    @Test
    fun publicPaymentStartUsesProductPolicyAndIdempotency() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "payment-start-owner@example.com",
            restaurantName = "Payment Start Table",
            slug = "payment-start",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 30_000,
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "payment-start-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "결제시작",
            customerPhone = "010-2020-0001",
        )

        val reservationBeforePayment = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reservationBeforePayment.paymentRequired).isTrue()
        assertThat(reservationBeforePayment.paymentMode).isEqualTo(ReservationPaymentMode.DEPOSIT)
        assertThat(reservationBeforePayment.paymentStatus).isEqualTo(PaymentStatus.REQUIRES_PAYMENT)

        mockMvc.get("/api/public/reservations/${created.id}/payment-summary") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentMode") { value("DEPOSIT") }
            jsonPath("$.paymentStatus") { value("REQUIRES_PAYMENT") }
            jsonPath("$.paymentRequired") { value(true) }
            jsonPath("$.amount") { value(30000) }
            jsonPath("$.currency") { value("KRW") }
        }

        val firstPayment = mockMvc.post("/api/public/reservations/${created.id}/payments") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            header("Idempotency-Key", "payment-start-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/payment-return"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("PENDING") }
            jsonPath("$.amount") { value(30000) }
            jsonPath("$.currency") { value("KRW") }
            jsonPath("$.paymentAction.type") { value("REDIRECT") }
            jsonPath("$.paymentAction.url") { value(org.hamcrest.Matchers.containsString("fake-payment")) }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }.andReturn()
        val paymentId = JsonPath.read<Int>(firstPayment.response.contentAsString, "$.paymentId")

        mockMvc.post("/api/public/reservations/${created.id}/payments") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            header("Idempotency-Key", "payment-start-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/payment-return"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.paymentId") { value(paymentId) }
            jsonPath("$.status") { value("PENDING") }
        }

        assertThat(paymentRepository.findByReservationIdOrderByCreatedAtAsc(created.id)).hasSize(1)
        val reservationAfterPayment = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reservationAfterPayment.status).isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(reservationAfterPayment.paymentStatus).isEqualTo(PaymentStatus.PENDING)
        assertThat(reservationAfterPayment.paymentDueAt).isNotNull()
    }

    @Test
    fun publicGuaranteeStartUsesCardGuaranteePolicy() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "guarantee-start-owner@example.com",
            restaurantName = "Guarantee Start Table",
            slug = "guarantee-start",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.CARD_GUARANTEE,
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "guarantee-start-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "보증시작",
            customerPhone = "010-2020-0002",
        )

        mockMvc.post("/api/public/reservations/${created.id}/guarantee") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            header("Idempotency-Key", "guarantee-start-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"returnUrl": "https://service.example.com/guarantee-return"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("PENDING") }
            jsonPath("$.guaranteeAction.type") { value("REDIRECT") }
            jsonPath("$.guaranteeAction.url") { value(org.hamcrest.Matchers.containsString("fake-guarantee")) }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }

        val reservation = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reservation.paymentMode).isEqualTo(ReservationPaymentMode.CARD_GUARANTEE)
        assertThat(reservation.paymentStatus).isEqualTo(PaymentStatus.PENDING)
        assertThat(paymentRepository.findByReservationIdOrderByCreatedAtAsc(created.id).single().paymentType)
            .isEqualTo(PaymentType.CARD_GUARANTEE)
    }

    @Test
    fun publicPaymentSkipsGatewayForPayOnSitePolicy() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "pay-on-site-owner@example.com",
            restaurantName = "Pay On Site Table",
            slug = "pay-on-site",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.PAY_ON_SITE,
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "pay-on-site-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "현장결제",
            customerPhone = "010-2020-0003",
        )

        mockMvc.post("/api/public/reservations/${created.id}/payments") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            header("Idempotency-Key", "pay-on-site-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = "{}"
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("PAY_ON_SITE") }
            jsonPath("$.amount") { value(0) }
            jsonPath("$.paymentAction") { value(org.hamcrest.Matchers.nullValue()) }
        }

        val reservation = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reservation.paymentRequired).isFalse()
        assertThat(reservation.paymentStatus).isEqualTo(PaymentStatus.PAY_ON_SITE)
        assertThat(paymentRepository.findByReservationIdOrderByCreatedAtAsc(created.id).single().paymentType)
            .isEqualTo(PaymentType.ONSITE)
    }

    @Test
    fun publicPaymentFailureAndExpiryKeepReservationStatusConsistent() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "payment-failure-owner@example.com",
            restaurantName = "Payment Failure Table",
            slug = "payment-failure",
            slotCapacity = 4,
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 20_000,
        )
        val failed = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "payment-failure-reservation-1",
            startTime = "11:00:00",
            partySize = 1,
            customerName = "결제실패",
            customerPhone = "010-2020-0004",
        )
        val expired = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "payment-expiry-reservation-1",
            startTime = "11:30:00",
            partySize = 1,
            customerName = "결제만료",
            customerPhone = "010-2020-0005",
        )

        mockMvc.post("/api/public/reservations/${failed.id}/payments") {
            header("X-Reservation-Lookup-Token", failed.lookupToken)
            header("Idempotency-Key", "payment-failure-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/gateway-fail"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("FAILED") }
            jsonPath("$.paymentAction") { value(org.hamcrest.Matchers.nullValue()) }
        }
        mockMvc.post("/api/public/reservations/${expired.id}/payments") {
            header("X-Reservation-Lookup-Token", expired.lookupToken)
            header("Idempotency-Key", "payment-expiry-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/gateway-expire"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("EXPIRED") }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }

        val failedReservation = reservationRepository.findById(failed.id).orElseThrow()
        assertThat(failedReservation.status).isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(failedReservation.paymentStatus).isEqualTo(PaymentStatus.FAILED)
        assertThat(failedReservation.paymentRequired).isTrue()
        val expiredReservation = reservationRepository.findById(expired.id).orElseThrow()
        assertThat(expiredReservation.status).isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(expiredReservation.paymentStatus).isEqualTo(PaymentStatus.EXPIRED)
        assertThat(expiredReservation.paymentRequired).isFalse()
    }

    @Test
    fun publicPaymentStartRejectsCancelledReservation() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "payment-cancelled-owner@example.com",
            restaurantName = "Payment Cancelled Table",
            slug = "payment-cancelled",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 20_000,
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "payment-cancelled-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "취소결제",
            customerPhone = "010-2020-0006",
        )
        mockMvc.post("/api/public/reservations/${created.id}/cancel") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "결제 전 취소"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
        }

        mockMvc.post("/api/public/reservations/${created.id}/payments") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            header("Idempotency-Key", "payment-cancelled-key-1")
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/payment-return"}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
        }
        assertThat(paymentRepository.findByReservationIdOrderByCreatedAtAsc(created.id)).isEmpty()
    }

    @Test
    fun pgWebhookPaymentSucceededIsIdempotentAndAudited() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "webhook-success-owner@example.com",
            restaurantName = "Webhook Success Table",
            slug = "webhook-success",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 30_000,
        )
        val started = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-success-reservation-1",
            paymentKey = "webhook-success-payment-1",
            startTime = "11:00:00",
        )

        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(
                eventId = "evt-success-1",
                eventType = "payment.succeeded",
                pgPaymentId = started.payment.pgPaymentId!!,
                amount = 30_000,
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("PROCESSED") }
            jsonPath("$.paymentStatus") { value("PAID") }
            jsonPath("$.reservationPaymentStatus") { value("PAID") }
        }
        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(
                eventId = "evt-success-1",
                eventType = "payment.succeeded",
                pgPaymentId = started.payment.pgPaymentId!!,
                amount = 30_000,
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("DUPLICATE") }
        }

        val payment = paymentRepository.findById(started.payment.id).orElseThrow()
        assertThat(payment.status).isEqualTo(PaymentStatus.PAID)
        assertThat(payment.paidAt).isNotNull()
        val reservation = reservationRepository.findById(started.reservation.id).orElseThrow()
        assertThat(reservation.status).isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(reservation.paymentStatus).isEqualTo(PaymentStatus.PAID)
        assertThat(pgWebhookEventRepository.findByPaymentIdOrderByCreatedAtAsc(payment.id)).hasSize(1)
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("payment", payment.id).map { it.action })
            .contains("PG_WEBHOOK_PAYMENT_SUCCEEDED")
    }

    @Test
    fun pgWebhookFailureCancellationAndExpiryTransitionPaymentStatusOnly() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "webhook-terminal-owner@example.com",
            restaurantName = "Webhook Terminal Table",
            slug = "webhook-terminal",
            slotCapacity = 6,
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 20_000,
        )
        val failed = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-failed-reservation-1",
            paymentKey = "webhook-failed-payment-1",
            startTime = "11:00:00",
        )
        val cancelled = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-cancelled-reservation-1",
            paymentKey = "webhook-cancelled-payment-1",
            startTime = "11:30:00",
        )
        val expired = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-expired-reservation-1",
            paymentKey = "webhook-expired-payment-1",
            startTime = "12:00:00",
        )

        postPgWebhook("evt-failed-1", "payment.failed", failed.payment.pgPaymentId!!, 20_000, "FAILED")
        postPgWebhook("evt-cancelled-1", "payment.cancelled", cancelled.payment.pgPaymentId!!, 20_000, "CANCELLED")
        postPgWebhook("evt-expired-1", "payment.expired", expired.payment.pgPaymentId!!, 20_000, "EXPIRED")

        assertPaymentAndReservationStatus(failed, PaymentStatus.FAILED, paymentRequired = true)
        assertPaymentAndReservationStatus(cancelled, PaymentStatus.CANCELLED, paymentRequired = false)
        assertPaymentAndReservationStatus(expired, PaymentStatus.EXPIRED, paymentRequired = false)

        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(
                eventId = "evt-expired-late-success-1",
                eventType = "payment.succeeded",
                pgPaymentId = expired.payment.pgPaymentId!!,
                amount = 20_000,
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("FAILED") }
            jsonPath("$.failureCode") { value("CONFLICT") }
            jsonPath("$.paymentStatus") { value("EXPIRED") }
            jsonPath("$.reservationPaymentStatus") { value("EXPIRED") }
        }
        assertPaymentAndReservationStatus(expired, PaymentStatus.EXPIRED, paymentRequired = false)
    }

    @Test
    fun pgWebhookInvalidSignatureAndAmountMismatchAreTrackedWithoutStateChange() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "webhook-failure-tracking-owner@example.com",
            restaurantName = "Webhook Failure Tracking Table",
            slug = "webhook-failure-tracking",
            slotCapacity = 4,
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 20_000,
        )
        val invalidSignature = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-invalid-signature-reservation-1",
            paymentKey = "webhook-invalid-signature-payment-1",
            startTime = "11:00:00",
        )
        val mismatch = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "webhook-amount-mismatch-reservation-1",
            paymentKey = "webhook-amount-mismatch-payment-1",
            startTime = "11:30:00",
        )

        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(
                eventId = "evt-invalid-signature-1",
                eventType = "payment.succeeded",
                pgPaymentId = invalidSignature.payment.pgPaymentId!!,
                amount = 20_000,
                signature = "bad-signature",
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SIGNATURE_FAILED") }
            jsonPath("$.failureCode") { value("SIGNATURE_INVALID") }
        }
        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(
                eventId = "evt-amount-mismatch-1",
                eventType = "payment.succeeded",
                pgPaymentId = mismatch.payment.pgPaymentId!!,
                amount = 99_999,
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("FAILED") }
            jsonPath("$.failureCode") { value("CONFLICT") }
            jsonPath("$.paymentStatus") { value("PENDING") }
        }

        assertThat(paymentRepository.findById(invalidSignature.payment.id).orElseThrow().status)
            .isEqualTo(PaymentStatus.PENDING)
        assertThat(paymentRepository.findById(mismatch.payment.id).orElseThrow().status)
            .isEqualTo(PaymentStatus.PENDING)
        assertThat(
            pgWebhookEventRepository.findByProviderKeyAndEventId("fake", "evt-invalid-signature-1")?.status,
        ).isEqualTo(PgWebhookEventStatus.SIGNATURE_FAILED)
        assertThat(
            pgWebhookEventRepository.findByProviderKeyAndEventId("fake", "evt-amount-mismatch-1")?.status,
        ).isEqualTo(PgWebhookEventStatus.FAILED)
    }

    @Test
    fun publicRefundPreviewAndCustomerCancelCreatePartialRefund() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "refund-preview-owner@example.com",
            restaurantName = "Refund Preview Table",
            slug = "refund-preview",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 30_000,
        )
        val started = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "refund-preview-reservation-0001",
            paymentKey = "refund-preview-payment-0001",
            startTime = "11:00:00",
        )
        postPgWebhook(
            eventId = "evt-refund-preview-paid-1",
            eventType = "payment.succeeded",
            pgPaymentId = started.payment.pgPaymentId!!,
            amount = 30_000,
            expectedPaymentStatus = "PAID",
        )
        assertThat(
            notificationRepository.countByReservationIdAndTemplateKey(
                started.reservation.id,
                PAYMENT_COMPLETED_TEMPLATE,
            ),
        ).isEqualTo(2)
        val reservation = reservationRepository.findById(started.reservation.id).orElseThrow()
        reservation.cancellationPolicySnapshotJson = """
        {
          "rules": [
            {"id": "rule_test_50", "beforeVisitHours": 0, "refundRate": 50}
          ],
          "restaurantCancelRefundRate": 100
        }
        """.trimIndent()
        reservationRepository.saveAndFlush(reservation)

        mockMvc.get("/api/public/reservations/${started.reservation.id}/refund-preview") {
            header("X-Reservation-Lookup-Token", started.reservation.lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentStatus") { value("PAID") }
            jsonPath("$.refundRequired") { value(true) }
            jsonPath("$.refundableAmount") { value(15000) }
            jsonPath("$.nonRefundableAmount") { value(15000) }
            jsonPath("$.alreadyRefundedAmount") { value(0) }
            jsonPath("$.policyRuleId") { value("rule_test_50") }
        }

        mockMvc.post("/api/public/reservations/${started.reservation.id}/cancel") {
            header("X-Reservation-Lookup-Token", started.reservation.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "부분 환불 테스트", "confirmRefundAmount": 15000}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
            jsonPath("$.refund.status") { value("SUCCEEDED") }
            jsonPath("$.refund.paymentStatus") { value("PARTIALLY_REFUNDED") }
            jsonPath("$.refund.refundAmount") { value(15000) }
            jsonPath("$.refund.nonRefundableAmount") { value(15000) }
        }

        val payment = paymentRepository.findById(started.payment.id).orElseThrow()
        assertThat(payment.status).isEqualTo(PaymentStatus.PARTIALLY_REFUNDED)
        assertThat(payment.refundedAmount).isEqualTo(15_000)
        assertThat(reservationRepository.findById(started.reservation.id).orElseThrow().paymentStatus)
            .isEqualTo(PaymentStatus.PARTIALLY_REFUNDED)
        assertThat(refundRepository.findByReservationIdOrderByCreatedAtAsc(started.reservation.id)).hasSize(1)
        assertThat(
            notificationRepository.countByReservationIdAndTemplateKey(
                started.reservation.id,
                REFUND_COMPLETED_TEMPLATE,
            ),
        ).isEqualTo(2)
    }

    @Test
    fun publicRefundPreviewSkipsOnlineRefundForPayOnSiteReservation() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "refund-onsite-owner@example.com",
            restaurantName = "Refund Onsite Table",
            slug = "refund-onsite",
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.PAY_ON_SITE,
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "refund-onsite-reservation-0001",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "현장환불",
            customerPhone = "010-3131-0001",
        )

        mockMvc.get("/api/public/reservations/${created.id}/refund-preview") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentStatus") { value("PAY_ON_SITE") }
            jsonPath("$.refundRequired") { value(false) }
            jsonPath("$.refundableAmount") { value(0) }
            jsonPath("$.nonRefundableAmount") { value(0) }
        }

        mockMvc.get("/api/business/reservations/${created.id}/refund-preview") {
            cookie(loginAndExtractSessionCookie("refund-onsite-owner@example.com"))
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentStatus") { value("PAY_ON_SITE") }
            jsonPath("$.refundRequired") { value(false) }
            jsonPath("$.refundableAmount") { value(0) }
            jsonPath("$.message") { value("환불이 필요한 온라인 결제가 없습니다.") }
        }

        mockMvc.post("/api/public/reservations/${created.id}/cancel") {
            header("X-Reservation-Lookup-Token", created.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "현장 결제 취소", "confirmRefundAmount": 0}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
            jsonPath("$.refund.refundRequired") { value(false) }
        }
        assertThat(refundRepository.findByReservationIdOrderByCreatedAtAsc(created.id)).isEmpty()
    }

    @Test
    fun businessRestaurantCancelCreatesFullRefund() {
        val ownerEmail = "business-refund-owner@example.com"
        val fixture = createPublicReservationFixture(
            ownerEmail = ownerEmail,
            restaurantName = "Business Refund Table",
            slug = "business-refund",
        )
        val ownerCookie = loginAndExtractSessionCookie(ownerEmail)
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 30_000,
        )
        val started = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = "business-refund-reservation-0001",
            paymentKey = "business-refund-payment-0001",
            startTime = "11:00:00",
        )
        postPgWebhook(
            eventId = "evt-business-refund-paid-1",
            eventType = "payment.succeeded",
            pgPaymentId = started.payment.pgPaymentId!!,
            amount = 30_000,
            expectedPaymentStatus = "PAID",
        )
        val reservation = reservationRepository.findById(started.reservation.id).orElseThrow()
        reservation.cancellationPolicySnapshotJson = """
        {
          "rules": [
            {"id": "rule_customer_no_refund", "beforeVisitHours": 0, "refundRate": 0}
          ],
          "restaurantCancelRefundRate": 100
        }
        """.trimIndent()
        reservationRepository.saveAndFlush(reservation)

        mockMvc.get("/api/public/reservations/${started.reservation.id}/refund-preview") {
            header("X-Reservation-Lookup-Token", started.reservation.lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.reason") { value("CUSTOMER_CANCEL") }
            jsonPath("$.refundRequired") { value(false) }
            jsonPath("$.refundableAmount") { value(0) }
            jsonPath("$.nonRefundableAmount") { value(30000) }
            jsonPath("$.policyRuleId") { value("rule_customer_no_refund") }
        }

        mockMvc.get("/api/business/reservations/${started.reservation.id}/refund-preview") {
            cookie(ownerCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.reason") { value("RESTAURANT_CANCEL") }
            jsonPath("$.refundRequired") { value(true) }
            jsonPath("$.refundableAmount") { value(30000) }
            jsonPath("$.nonRefundableAmount") { value(0) }
            jsonPath("$.policyRuleId") { value("restaurant_cancel_100") }
            jsonPath("$.message") { value("매장 취소로 전액 환불 요청 대상입니다.") }
        }

        val otherOwner = createBusinessUser("business-refund-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        createApprovedRestaurantForSettings(otherOwner, "Other Business Refund Table", "business-refund-other")
        mockMvc.get("/api/business/reservations/${started.reservation.id}/refund-preview") {
            cookie(otherCookie)
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.post("/api/business/reservations/${started.reservation.id}/cancel") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "매장 사정 취소"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_RESTAURANT") }
            jsonPath("$.paymentStatus") { value("REFUNDED") }
            jsonPath("$.refund.status") { value("SUCCEEDED") }
            jsonPath("$.refund.refundAmount") { value(30000) }
            jsonPath("$.refund.nonRefundableAmount") { value(0) }
        }

        val payment = paymentRepository.findById(started.payment.id).orElseThrow()
        assertThat(payment.status).isEqualTo(PaymentStatus.REFUNDED)
        assertThat(payment.refundedAmount).isEqualTo(30_000)
        assertThat(refundRepository.findByReservationIdOrderByCreatedAtAsc(started.reservation.id).single().reason)
            .isEqualTo(RefundReason.RESTAURANT_CANCEL)
    }

    @Test
    fun adminCanRetryAndManuallyResolveFailedRefunds() {
        val admin = createBusinessUser("admin-refund@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val fixture = createPublicReservationFixture(
            ownerEmail = "admin-refund-owner@example.com",
            restaurantName = "Admin Refund Table",
            slug = "admin-refund",
            slotCapacity = 6,
        )
        configureProductPaymentPolicy(
            productId = fixture.productId,
            type = ReservationProductPaymentPolicyType.DEPOSIT,
            amount = 20_000,
        )

        val retryRefund = createFailedCustomerRefund(
            fixture = fixture,
            reservationKey = "refund-retry-0001",
            paymentKey = "refund-retry-pay-0001",
            startTime = "11:00:00",
        )
        mockMvc.post("/api/admin/refunds/${retryRefund.id}/retry") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUCCEEDED") }
            jsonPath("$.paymentStatus") { value("REFUNDED") }
            jsonPath("$.failureCode") { value(org.hamcrest.Matchers.nullValue()) }
        }
        assertThat(refundRepository.findById(retryRefund.id).orElseThrow().status)
            .isEqualTo(RefundStatus.SUCCEEDED)

        val manualRefund = createFailedCustomerRefund(
            fixture = fixture,
            reservationKey = "refund-manual-0002",
            paymentKey = "refund-manual-pay-0002",
            startTime = "11:30:00",
        )
        mockMvc.post("/api/admin/refunds/${manualRefund.id}/mark-manual-resolved") {
            cookie(adminCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"memo": "PG 관리자 화면에서 수동 환불 확인"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUCCEEDED") }
            jsonPath("$.paymentStatus") { value("REFUNDED") }
            jsonPath("$.manualResolved") { value(true) }
        }
        assertThat(refundRepository.findById(manualRefund.id).orElseThrow().status)
            .isEqualTo(RefundStatus.SUCCEEDED)
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("refund", manualRefund.id).map { it.action })
            .contains("REFUND_MANUAL_RESOLVED")
    }

    @Test
    fun adminNotificationRetryUsesFakeSenderAndTracksFailureState() {
        val admin = createBusinessUser("admin-notification@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val fixture = createPublicReservationFixture(
            ownerEmail = "admin-notification-owner@example.com",
            restaurantName = "Admin Notification Table",
            slug = "admin-notification",
        )
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "admin-notification-reservation-0001",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "알림재시도",
            customerPhone = "010-4141-0001",
        )
        val reservation = reservationRepository.findById(created.id).orElseThrow()
        val failingNotification = notificationRepository.saveAndFlush(
            NotificationEntity(
                restaurant = fixture.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                recipientType = NotificationRecipientType.CUSTOMER,
                channel = NotificationChannel.SMS,
                recipientContact = "notification-fail",
                templateKey = RESERVATION_CONFIRMED_TEMPLATE,
                status = NotificationStatus.FAILED,
                payloadJson = """{"templateKey":"$RESERVATION_CONFIRMED_TEMPLATE"}""",
                attemptCount = 1,
            ),
        )
        val successfulNotification = notificationRepository.saveAndFlush(
            NotificationEntity(
                restaurant = fixture.restaurant,
                reservation = reservation,
                customer = null,
                recipientType = NotificationRecipientType.OWNER,
                channel = NotificationChannel.EMAIL,
                recipientContact = "owner-success@example.com",
                templateKey = RESERVATION_CANCELLED_TEMPLATE,
                status = NotificationStatus.FAILED,
                payloadJson = """{"templateKey":"$RESERVATION_CANCELLED_TEMPLATE"}""",
                attemptCount = 1,
            ),
        )

        mockMvc.post("/api/admin/notifications/${failingNotification.id}/retry") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("FAILED") }
            jsonPath("$.attemptCount") { value(2) }
            jsonPath("$.providerKey") { value("fake") }
            jsonPath("$.nextRetryAt") { isNotEmpty() }
            jsonPath("$.lastError") { value("테스트 알림 발송 실패") }
        }

        mockMvc.post("/api/admin/notifications/${successfulNotification.id}/retry") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SENT") }
            jsonPath("$.attemptCount") { value(2) }
            jsonPath("$.providerKey") { value("fake") }
            jsonPath("$.providerMessageId") { value("fake-notification-${successfulNotification.id}") }
            jsonPath("$.lastError") { value(org.hamcrest.Matchers.nullValue()) }
        }

        val failedReloaded = notificationRepository.findById(failingNotification.id).orElseThrow()
        assertThat(failedReloaded.status).isEqualTo(NotificationStatus.FAILED)
        assertThat(failedReloaded.attemptCount).isEqualTo(2)
        assertThat(failedReloaded.nextRetryAt).isNotNull()
        val sentReloaded = notificationRepository.findById(successfulNotification.id).orElseThrow()
        assertThat(sentReloaded.status).isEqualTo(NotificationStatus.SENT)
        assertThat(sentReloaded.sentAt).isNotNull()
    }

    @Test
    fun mysqlServerDefaultsUseExpectedCharsetAndTimezone() {
        val serverDefaults = jdbcTemplate.queryForMap(
            "select @@character_set_server as charset_name, @@collation_server as collation_name, @@global.time_zone as time_zone",
        )

        assertThat(serverDefaults["charset_name"]).isEqualTo("utf8mb4")
        assertThat(serverDefaults["collation_name"]).isEqualTo("utf8mb4_0900_ai_ci")
        assertThat(serverDefaults["time_zone"]).isIn("+00:00", "UTC")
    }

    @Test
    fun apiExceptionResponseContainsCodeMessageAndTraceId() {
        mockMvc.get("/test/foundation/api-exception") {
            header(TraceContext.TRACE_ID_HEADER, "trace-test-1")
        }.andExpect {
            status { isBadRequest() }
            header { string(TraceContext.TRACE_ID_HEADER, "trace-test-1") }
            jsonPath("$.code") { value("BAD_REQUEST") }
            jsonPath("$.message") { value("잘못된 요청입니다.") }
            jsonPath("$.traceId") { value("trace-test-1") }
        }
    }

    @Test
    fun validationExceptionResponseContainsTraceId() {
        mockMvc.post("/test/foundation/validation") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": ""}"""
            header(TraceContext.TRACE_ID_HEADER, "trace-test-2")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("요청 값이 유효하지 않습니다.") }
            jsonPath("$.traceId") { value("trace-test-2") }
        }
    }

    @Test
    fun unhandledExceptionResponseContainsGeneratedTraceId() {
        mockMvc.get("/test/foundation/unhandled").andExpect {
            status { isInternalServerError() }
            header { exists(TraceContext.TRACE_ID_HEADER) }
            jsonPath("$.code") { value("INTERNAL_SERVER_ERROR") }
            jsonPath("$.message") { value("서버 오류가 발생했습니다.") }
            jsonPath("$.traceId") { isNotEmpty() }
        }
    }

    @Test
    fun notFoundResponseUsesCommonErrorShape() {
        mockMvc.get("/test/foundation/missing") {
            header(TraceContext.TRACE_ID_HEADER, "trace-test-3")
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
            jsonPath("$.message") { value("요청한 리소스를 찾을 수 없습니다.") }
            jsonPath("$.traceId") { value("trace-test-3") }
        }
    }

    @Test
    fun actuatorHealthIsExposed() {
        mockMvc.get("/actuator/health").andExpect {
            status { isOk() }
            jsonPath("$.status") { value("UP") }
        }
    }

    @Test
    fun openApiDocsAreExposed() {
        mockMvc.get("/v3/api-docs").andExpect {
            status { isOk() }
            jsonPath("$.openapi") { exists() }
            jsonPath("$.info.title") { value("Restaurant Service API") }
            jsonPath("$.paths['/api/public/restaurants/{slug}'].get.summary") {
                value("slug 기준 공개 예약 페이지 조회")
            }
            jsonPath("$.paths['/api/public/restaurants/{restaurantId}/reservation-page'].get.summary") {
                value("restaurantId 기준 공개 예약 페이지 조회")
            }
        }
    }

    @Test
    fun initialBusinessUserIsSeededWithHashedPassword() {
        val user = userRepository.findByEmail("owner@example.com")

        assertThat(user).isNotNull
        assertThat(user!!.passwordHash).startsWith("$2")
        assertThat(user.status).isEqualTo(BusinessUserStatus.ACTIVE)
    }

    @Test
    fun unauthenticatedBusinessApiReturnsAuthenticationError() {
        mockMvc.get("/api/business/me") {
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-1")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
            jsonPath("$.message") { value("인증이 필요합니다.") }
            jsonPath("$.traceId") { value("auth-trace-1") }
        }
    }

    @Test
    fun adminApiRequiresAdminSession() {
        mockMvc.get("/api/admin/restaurant-applications") {
            header(TraceContext.TRACE_ID_HEADER, "admin-trace-1")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
            jsonPath("$.message") { value("인증이 필요합니다.") }
            jsonPath("$.traceId") { value("admin-trace-1") }
        }

        val ownerCookie = loginAndExtractSessionCookie()
        mockMvc.get("/api/admin/restaurant-applications") {
            cookie(ownerCookie)
            header(TraceContext.TRACE_ID_HEADER, "admin-trace-2")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
            jsonPath("$.message") { value("접근 권한이 없습니다.") }
            jsonPath("$.traceId") { value("admin-trace-2") }
        }
    }

    @Test
    fun invalidLoginReturnsInvalidCredentials() {
        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "owner@example.com", "password": "wrong-password"}"""
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-2")
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_CREDENTIALS") }
            jsonPath("$.message") { value("이메일 또는 비밀번호가 올바르지 않습니다.") }
            jsonPath("$.traceId") { value("auth-trace-2") }
        }
    }

    @Test
    fun suspendedLoginReturnsAccessDenied() {
        userRepository.save(
            BusinessUserEntity(
                email = "suspended@example.com",
                passwordHash = passwordEncoder.encode("SuspendedPassword123!")
                    ?: error("Password encoder returned null."),
                displayName = "Suspended Owner",
                status = BusinessUserStatus.SUSPENDED,
            ),
        )

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "suspended@example.com", "password": "SuspendedPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "auth-trace-3")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
            jsonPath("$.message") { value("접근 권한이 없습니다.") }
            jsonPath("$.traceId") { value("auth-trace-3") }
        }
    }

    @Test
    fun loginIssuesHttpOnlyCookieAndCurrentUserCanBeRead() {
        val sessionCookie = loginAndExtractSessionCookie()

        mockMvc.get("/api/business/me") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { exists() }
            jsonPath("$.email") { value("owner@example.com") }
            jsonPath("$.displayName") { value("Initial Owner") }
            jsonPath("$.role") { value("OWNER") }
            jsonPath("$.status") { value("ACTIVE") }
            jsonPath("$.restaurant.id") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.restaurant.status") { value("NOT_LINKED") }
        }
    }

    @Test
    fun logoutRevokesSessionCookie() {
        val sessionCookie = loginAndExtractSessionCookie()

        mockMvc.post("/api/business/auth/logout") {
            cookie(sessionCookie)
        }.andExpect {
            status { isNoContent() }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Max-Age=0")) }
        }

        mockMvc.get("/api/business/me") {
            cookie(sessionCookie)
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
        }
    }

    @Test
    fun passwordResetRequestCanIssueTokenAndConfirmationChangesPassword() {
        val owner = createBusinessUser("reset-owner@example.com")

        val requestResult = mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "RESET-OWNER@example.com"}"""
            header("X-Forwarded-For", "198.51.100.10")
            header("User-Agent", "password-reset-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
            jsonPath("$.resetToken") { isNotEmpty() }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }.andReturn()

        val resetToken = JsonPath.read<String>(requestResult.response.contentAsString, "$.resetToken")
        val savedToken = passwordResetTokenRepository.findAll().single { it.user.id == owner.id }
        assertThat(savedToken.tokenHash).hasSize(64)
        assertThat(savedToken.tokenHash).isNotEqualTo(resetToken)
        assertThat(savedToken.tokenHash).isEqualTo(TokenHash.sha256Hex(resetToken))

        val notification = passwordResetNotificationRepository.findByResetTokenId(savedToken.id).single()
        assertThat(notification.recipientEmail).isEqualTo(owner.email)
        assertThat(notification.deliveryPayload)
            .contains("BUSINESS_PASSWORD_RESET")
            .contains("resetTokenId")
            .contains(savedToken.id.toString())
            .doesNotContain(resetToken)

        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "$resetToken", "newPassword": "NewPassword123!"}"""
            header("X-Forwarded-For", "198.51.100.11")
            header("User-Agent", "password-reset-confirm-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.passwordChanged") { value(true) }
        }

        val updatedOwner = userRepository.findByEmail(owner.email) ?: error("Owner should exist.")
        assertThat(passwordEncoder.matches("NewPassword123!", updatedOwner.passwordHash)).isTrue()
        assertThat(passwordResetTokenRepository.findById(savedToken.id).orElseThrow().usedAt).isNotNull()

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "${owner.email}", "password": "CorrectPassword123!"}"""
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_CREDENTIALS") }
        }

        mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "${owner.email}", "password": "NewPassword123!"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email") { value(owner.email) }
        }

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("business_user", owner.id)
        assertThat(auditLogs.map { it.action })
            .contains("BUSINESS_PASSWORD_RESET_REQUESTED", "BUSINESS_PASSWORD_RESET_COMPLETED")
        assertThat(auditLogs.single { it.action == "BUSINESS_PASSWORD_RESET_REQUESTED" }.ipAddress)
            .isEqualTo("198.51.100.10")
    }

    @Test
    fun passwordResetRequestDoesNotCreateAnotherTokenDuringRetryInterval() {
        val owner = createBusinessUser("reset-rate-limit@example.com")

        mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "reset-rate-limit@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
        }

        mockMvc.post("/api/business/auth/password-reset-requests") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "reset-rate-limit@example.com"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-rate-limit")
        }.andExpect {
            status { isOk() }
            jsonPath("$.accepted") { value(true) }
        }

        val savedTokens = passwordResetTokenRepository.findAll().filter { it.user.id == owner.id }
        assertThat(savedTokens).hasSize(1)
        assertThat(passwordResetNotificationRepository.findByResetTokenId(savedTokens.single().id)).hasSize(1)
    }

    @Test
    fun passwordResetConfirmationRejectsInvalidExpiredAndUsedTokens() {
        val owner = createBusinessUser("reset-invalid@example.com")
        val now = Instant.now()

        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "missing-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-invalid")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_INVALID") }
            jsonPath("$.traceId") { value("password-reset-invalid") }
        }

        passwordResetTokenRepository.saveAndFlush(
            BusinessPasswordResetTokenEntity(
                user = owner,
                tokenHash = TokenHash.sha256Hex("expired-token"),
                requestedAt = now.minusSeconds(3_600),
                expiresAt = now.minusSeconds(1),
            ),
        )
        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "expired-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-expired")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_EXPIRED") }
            jsonPath("$.traceId") { value("password-reset-expired") }
        }

        passwordResetTokenRepository.saveAndFlush(
            BusinessPasswordResetTokenEntity(
                user = owner,
                tokenHash = TokenHash.sha256Hex("used-token"),
                requestedAt = now,
                expiresAt = now.plusSeconds(1_800),
                usedAt = now,
            ),
        )
        mockMvc.post("/api/business/auth/password-reset-confirmations") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"token": "used-token", "newPassword": "NewPassword123!"}"""
            header(TraceContext.TRACE_ID_HEADER, "password-reset-used")
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("PASSWORD_RESET_TOKEN_USED") }
            jsonPath("$.traceId") { value("password-reset-used") }
        }
    }

    @Test
    fun publicReservationLookupTokenCanBeIssuedWithoutBusinessSession() {
        val result = mockMvc.post("/api/public/reservation-lookup-tokens") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"reservationNumber": " r-20260515-1 ", "phoneNumber": "010-1234-5678"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.lookupToken") { isNotEmpty() }
            jsonPath("$.expiresAt") { isNotEmpty() }
        }.andReturn()

        val lookupToken = JsonPath.read<String>(result.response.contentAsString, "$.lookupToken")
        val savedToken = reservationLookupTokenRepository.findAll()
            .single { it.reservationNumber == "R-20260515-1" }

        assertThat(savedToken.tokenHash).hasSize(64)
        assertThat(savedToken.tokenHash).isNotEqualTo(lookupToken)
        assertThat(savedToken.phoneNumberHash).hasSize(64)
        assertThat(savedToken.phoneNumberHash).isNotEqualTo("010-1234-5678")
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-1", lookupToken)).isTrue()
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-2", lookupToken)).isFalse()
        assertThat(reservationLookupTokenService.hasLookupAccess("r-20260515-1", "wrong-token")).isFalse()
    }

    @Test
    fun publicReservationLookupTokenRejectsInvalidPhoneNumber() {
        mockMvc.post("/api/public/reservation-lookup-tokens") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"reservationNumber": "r-20260515-2", "phoneNumber": "no-digits"}"""
            header(TraceContext.TRACE_ID_HEADER, "lookup-trace-1")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("BAD_REQUEST") }
            jsonPath("$.message") { value("전화번호가 유효하지 않습니다.") }
            jsonPath("$.traceId") { value("lookup-trace-1") }
        }
    }

    @Test
    fun restaurantDomainRepositoriesPersistStoreApplicationPageAndFileMetadata() {
        val owner = createBusinessUser("restaurant-owner@example.com")
        val coverImage = storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = "restaurant-cover-images/cover-1.webp",
                originalFilename = "cover.webp",
                contentType = "image/webp",
                byteSize = 1024,
                checksumSha256 = "a".repeat(64),
                visibility = StoredFileVisibility.PUBLIC,
                purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
                createdBy = owner,
            ),
        )
        val businessLicense = storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = "business-licenses/license-1.pdf",
                originalFilename = "license.pdf",
                contentType = "application/pdf",
                byteSize = 2048,
                checksumSha256 = "b".repeat(64),
                visibility = StoredFileVisibility.PRIVATE,
                purpose = StoredFilePurpose.BUSINESS_LICENSE,
                createdBy = owner,
            ),
        )
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = "스시윤",
                slug = null,
                description = "예약제 스시야",
                phone = "02-1234-5678",
                addressLine1 = "서울시 강남구 테헤란로 1",
                addressLine2 = "2층",
                postalCode = "06123",
                cuisineTypesJson = """["sushi","omakase"]""",
                coverImageFile = coverImage,
                status = RestaurantStatus.DRAFT,
            ),
        )
        restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = restaurant,
                businessRegistrationNo = "1234567890",
                businessName = "스시윤",
                representativeName = "윤대표",
                businessAddress = "서울시 강남구 테헤란로 1",
                businessLicenseFile = businessLicense,
                managerName = "윤매니저",
                managerPhone = "010-1111-2222",
                managerEmail = "manager@example.com",
                status = RestaurantApplicationStatus.DRAFT,
            ),
        )
        reservationPageRepository.saveAndFlush(
            ReservationPageEntity(
                restaurant = restaurant,
                slug = "sushi-yoon",
                status = ReservationPageStatus.PRIVATE,
            ),
        )

        assertThat(restaurantRepository.findByOwnerId(owner.id)?.name).isEqualTo("스시윤")
        assertThat(restaurantRepository.findByOwnerId(owner.id)?.status).isEqualTo(RestaurantStatus.DRAFT)
        assertThat(storedFileRepository.findByStorageKey("business-licenses/license-1.pdf")?.visibility)
            .isEqualTo(StoredFileVisibility.PRIVATE)
        assertThat(
            restaurantApplicationRepository
                .findTopByRestaurantIdOrderByCreatedAtDesc(restaurant.id)
                ?.businessRegistrationNo,
        ).isEqualTo("1234567890")
        assertThat(reservationPageRepository.findBySlug("sushi-yoon")?.status)
            .isEqualTo(ReservationPageStatus.PRIVATE)
    }

    @Test
    fun restaurantRepositoryEnforcesSingleRestaurantPerOwner() {
        val owner = createBusinessUser("single-restaurant-owner@example.com")
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = "첫번째 매장",
                phone = "02-1000-0001",
                addressLine1 = "서울시 중구 1",
                cuisineTypesJson = """["korean"]""",
            ),
        )

        assertThatThrownBy {
            restaurantRepository.saveAndFlush(
                RestaurantEntity(
                    owner = owner,
                    name = "두번째 매장",
                    phone = "02-1000-0002",
                    addressLine1 = "서울시 중구 2",
                    cuisineTypesJson = """["korean"]""",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun restaurantSlugsAreUniqueButNullable() {
        val firstOwner = createBusinessUser("nullable-slug-owner-1@example.com")
        val secondOwner = createBusinessUser("nullable-slug-owner-2@example.com")
        val thirdOwner = createBusinessUser("duplicate-slug-owner-1@example.com")
        val fourthOwner = createBusinessUser("duplicate-slug-owner-2@example.com")

        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = firstOwner,
                name = "슬러그 없음 1",
                phone = "02-2000-0001",
                addressLine1 = "서울시 용산구 1",
                cuisineTypesJson = """["dining"]""",
            ),
        )
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = secondOwner,
                name = "슬러그 없음 2",
                phone = "02-2000-0002",
                addressLine1 = "서울시 용산구 2",
                cuisineTypesJson = """["dining"]""",
            ),
        )
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = thirdOwner,
                name = "슬러그 있음 1",
                slug = "unique-restaurant",
                phone = "02-2000-0003",
                addressLine1 = "서울시 용산구 3",
                cuisineTypesJson = """["dining"]""",
            ),
        )

        assertThatThrownBy {
            restaurantRepository.saveAndFlush(
                RestaurantEntity(
                    owner = fourthOwner,
                    name = "슬러그 있음 2",
                    slug = "unique-restaurant",
                    phone = "02-2000-0004",
                    addressLine1 = "서울시 용산구 4",
                    cuisineTypesJson = """["dining"]""",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun reservationPageSlugsAreUniqueButNullable() {
        val firstRestaurant = createRestaurantForTest(
            owner = createBusinessUser("nullable-page-slug-owner-1@example.com"),
            name = "예약 페이지 슬러그 없음 1",
        )
        val secondRestaurant = createRestaurantForTest(
            owner = createBusinessUser("nullable-page-slug-owner-2@example.com"),
            name = "예약 페이지 슬러그 없음 2",
        )
        val thirdRestaurant = createRestaurantForTest(
            owner = createBusinessUser("duplicate-page-slug-owner-1@example.com"),
            name = "예약 페이지 슬러그 있음 1",
        )
        val fourthRestaurant = createRestaurantForTest(
            owner = createBusinessUser("duplicate-page-slug-owner-2@example.com"),
            name = "예약 페이지 슬러그 있음 2",
        )

        reservationPageRepository.saveAndFlush(ReservationPageEntity(restaurant = firstRestaurant))
        reservationPageRepository.saveAndFlush(ReservationPageEntity(restaurant = secondRestaurant))
        reservationPageRepository.saveAndFlush(
            ReservationPageEntity(
                restaurant = thirdRestaurant,
                slug = "unique-page",
            ),
        )

        assertThatThrownBy {
            reservationPageRepository.saveAndFlush(
                ReservationPageEntity(
                    restaurant = fourthRestaurant,
                    slug = "unique-page",
                ),
            )
        }.isInstanceOf(DataIntegrityViolationException::class.java)
    }

    @Test
    fun localFileStorageStoresAndReadsFileWithoutExternalProvider() {
        val result = fileStorage.save(
            FileStorageSaveRequest(
                originalFilename = "cover image.webp",
                contentType = "image/webp",
                content = "cover".encodeToByteArray(),
                visibility = StoredFileVisibility.PUBLIC,
                purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            ),
        )

        assertThat(result.storageKey).startsWith("restaurant_cover_image/")
        assertThat(result.byteSize).isEqualTo(5)
        assertThat(result.checksumSha256).hasSize(64)
        assertThat(fileStorage.read(result.storageKey)?.decodeToString()).isEqualTo("cover")
        assertThat(fileStorage.publicUrl(result.storageKey)).isNull()
    }

    @Test
    fun businessFileUploadPersistsMetadataAndCanBeLinkedToApplication() {
        val owner = createBusinessUser("file-upload-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)

        val imageResult = mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.jpg", "image/jpeg", jpegBytes()))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isCreated())
            .andExpect(jsonPath("$.purpose").value("restaurant_image"))
            .andExpect(jsonPath("$.visibility").value("PUBLIC"))
            .andExpect(jsonPath("$.originalFilename").value("cover.jpg"))
            .andReturn()
        val imageFileId = JsonPath.read<Int>(imageResult.response.contentAsString, "$.id").toLong()

        val licenseResult = mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "license.pdf", "application/pdf", pdfBytes()))
                .param("purpose", "business_license")
                .cookie(sessionCookie),
        ).andExpect(status().isCreated())
            .andExpect(jsonPath("$.purpose").value("business_license"))
            .andExpect(jsonPath("$.visibility").value("PRIVATE"))
            .andExpect(jsonPath("$.publicUrl").value(org.hamcrest.Matchers.nullValue()))
            .andReturn()
        val licenseFileId = JsonPath.read<Int>(licenseResult.response.contentAsString, "$.id").toLong()

        val imageFile = storedFileRepository.findById(imageFileId).orElseThrow()
        val licenseFile = storedFileRepository.findById(licenseFileId).orElseThrow()
        assertThat(imageFile.createdBy?.id).isEqualTo(owner.id)
        assertThat(imageFile.purpose).isEqualTo(StoredFilePurpose.RESTAURANT_COVER_IMAGE)
        assertThat(imageFile.visibility).isEqualTo(StoredFileVisibility.PUBLIC)
        assertThat(licenseFile.createdBy?.id).isEqualTo(owner.id)
        assertThat(licenseFile.purpose).isEqualTo(StoredFilePurpose.BUSINESS_LICENSE)
        assertThat(licenseFile.visibility).isEqualTo(StoredFileVisibility.PRIVATE)

        mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "7171717171",
                coverImageFileId = imageFileId,
                businessLicenseFileId = licenseFileId,
                managerEmail = "uploaded-file-owner@example.com",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.restaurant.coverImageFileId") { value(imageFileId.toInt()) }
            jsonPath("$.businessLicenseFileId") { value(licenseFileId.toInt()) }
        }
    }

    @Test
    fun businessFileUploadRejectsUnsupportedTypeAndOversizedFiles() {
        val owner = createBusinessUser("file-upload-reject@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)

        mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.txt", "text/plain", "plain".encodeToByteArray()))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))

        mockMvc.perform(
            multipart("/api/business/files")
                .file(MockMultipartFile("file", "cover.jpg", "image/jpeg", ByteArray(5 * 1024 * 1024 + 1)))
                .param("purpose", "restaurant_image")
                .cookie(sessionCookie),
        ).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
    }

    @Test
    fun restaurantApplicationRejectsFilesUploadedByAnotherOwner() {
        val owner = createBusinessUser("file-owner-check@example.com")
        val otherOwner = createBusinessUser("file-other-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val otherCoverImage = createStoredFile(
            storageKey = "restaurant-cover-images/other-owner.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = otherOwner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/owner-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )

        mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "8181818181",
                coverImageFileId = otherCoverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "file-owner-check@example.com",
            )
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }
    }

    @Test
    fun businessRestaurantApplicationCanBeCreatedUpdatedSubmittedAndRead() {
        val owner = createBusinessUser("application-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie("application-owner@example.com")
        val coverImage = createStoredFile(
            storageKey = "restaurant-cover-images/application-cover.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = owner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/application-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )

        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "1111111111",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "before@example.com",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("DRAFT") }
            jsonPath("$.restaurant.status") { value("DRAFT") }
            jsonPath("$.restaurant.name") { value("스시온") }
            jsonPath("$.contactVerified") { value(true) }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.put("/api/business/restaurant-applications/$applicationId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "1111111111",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                restaurantDescription = "수정된 소개",
                managerEmail = "updated@example.com",
            )
        }.andExpect {
            status { isOk() }
            jsonPath("$.restaurant.description") { value("수정된 소개") }
            jsonPath("$.managerEmail") { value("updated@example.com") }
        }

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
            header("X-Forwarded-For", "203.0.113.10")
            header("User-Agent", "restaurant-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.restaurant.status") { value("APPROVAL_REQUESTED") }
            jsonPath("$.submittedAt") { isNotEmpty() }
        }

        mockMvc.get("/api/business/restaurant-applications/current") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(applicationId.toInt()) }
            jsonPath("$.status") { value("SUBMITTED") }
        }

        mockMvc.put("/api/business/restaurant-applications/$applicationId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"managerEmail": "submitted-update@example.com"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.managerEmail") { value("submitted-update@example.com") }
            jsonPath("$.restaurant.description") { value("수정된 소개") }
        }

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", applicationId)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_SUBMITTED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_SUBMITTED" }.ipAddress)
            .isEqualTo("203.0.113.10")
    }

    @Test
    fun adminCanListReadAndApproveSubmittedRestaurantApplication() {
        val admin = createBusinessUser("admin-approve@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val owner = createBusinessUser("approval-owner@example.com")
        val application = createSubmittedRestaurantApplication(
            owner = owner,
            businessRegistrationNo = "3333333333",
            restaurantName = "Blue Table",
        )

        mockMvc.get("/api/admin/restaurant-applications?status=SUBMITTED") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(application.id.toInt()) }
            jsonPath("$[0].status") { value("SUBMITTED") }
        }

        mockMvc.get("/api/admin/restaurant-applications/${application.id}") {
            cookie(adminCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(application.id.toInt()) }
            jsonPath("$.restaurant.name") { value("Blue Table") }
        }

        mockMvc.post("/api/admin/restaurant-applications/${application.id}/approve") {
            cookie(adminCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reviewNote": "확인 완료"}"""
            header("X-Forwarded-For", "203.0.113.20")
            header("User-Agent", "admin-approve-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("APPROVED") }
            jsonPath("$.restaurant.status") { value("APPROVED") }
            jsonPath("$.restaurant.slug") { value("blue-table") }
            jsonPath("$.restaurant.reservationPage.slug") { value("blue-table") }
            jsonPath("$.restaurant.reservationPage.status") { value("PRIVATE") }
            jsonPath("$.reviewedAt") { isNotEmpty() }
            jsonPath("$.reviewNote") { value("확인 완료") }
        }

        val approvedRestaurant = restaurantRepository.findById(application.restaurant.id).orElseThrow()
        assertThat(approvedRestaurant.status).isEqualTo(RestaurantStatus.APPROVED)
        assertThat(approvedRestaurant.approvedAt).isNotNull()
        assertThat(reservationPageRepository.findByRestaurantId(approvedRestaurant.id)?.slug)
            .isEqualTo("blue-table")
        assertThat(userRepository.findByEmail(owner.email)?.linkedRestaurantStatus)
            .isEqualTo(RestaurantStatus.APPROVED.name)

        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", application.id)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_APPROVED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_APPROVED" }.ipAddress)
            .isEqualTo("203.0.113.20")
    }

    @Test
    fun adminCanRejectAndOwnerCanResubmitRestaurantApplication() {
        val admin = createBusinessUser("admin-reject@example.com", BusinessUserRole.ADMIN)
        val adminCookie = loginAndExtractSessionCookie(admin.email)
        val owner = createBusinessUser("rejection-owner@example.com")
        val ownerCookie = loginAndExtractSessionCookie(owner.email)
        val application = createSubmittedRestaurantApplication(
            owner = owner,
            businessRegistrationNo = "4444444444",
            restaurantName = "Rejectable Table",
        )

        mockMvc.post("/api/admin/restaurant-applications/${application.id}/reject") {
            cookie(adminCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"rejectionReason": "서류 보완 필요", "reviewNote": "사업자등록증 확인 실패"}"""
            header("X-Forwarded-For", "203.0.113.21")
            header("User-Agent", "admin-reject-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("REJECTED") }
            jsonPath("$.restaurant.status") { value("REJECTED") }
            jsonPath("$.rejectionReason") { value("서류 보완 필요") }
            jsonPath("$.reviewNote") { value("사업자등록증 확인 실패") }
        }

        assertThat(userRepository.findByEmail(owner.email)?.linkedRestaurantStatus)
            .isEqualTo(RestaurantStatus.REJECTED.name)
        val auditLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant_application", application.id)
        assertThat(auditLogs.map { it.action }).contains("RESTAURANT_APPLICATION_REJECTED")
        assertThat(auditLogs.single { it.action == "RESTAURANT_APPLICATION_REJECTED" }.ipAddress)
            .isEqualTo("203.0.113.21")

        mockMvc.post("/api/business/restaurant-applications/${application.id}/submit") {
            cookie(ownerCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("SUBMITTED") }
            jsonPath("$.restaurant.status") { value("APPROVAL_REQUESTED") }
            jsonPath("$.rejectionReason") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.reviewedAt") { value(org.hamcrest.Matchers.nullValue()) }
        }
    }

    @Test
    fun businessOwnerCanConfigureHoursHolidaysPublishAndReadPublicRestaurant() {
        val owner = createBusinessUser("settings-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Public Table")

        mockMvc.get("/api/business/restaurants/current") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(restaurant.id.toInt()) }
            jsonPath("$.status") { value("APPROVED") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "Public Table",
              "description": "예약제 다이닝",
              "phone": "02-7777-1000",
              "addressLine1": "서울시 공개구 1",
              "addressLine2": "2층",
              "postalCode": "04500",
              "cuisineTypes": ["dining", "wine"]
            }
            """.trimIndent()
            header("X-Forwarded-For", "203.0.113.30")
            header("User-Agent", "restaurant-settings-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.description") { value("예약제 다이닝") }
            jsonPath("$.cuisineTypes[1]") { value("wine") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "11:30:00", "closesAt": "15:00:00"},
                {"dayOfWeek": "MONDAY", "opensAt": "17:30:00", "closesAt": "22:00:00"},
                {"dayOfWeek": "TUESDAY", "closed": true}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$[0].sequence") { value(1) }
            jsonPath("$[1].sequence") { value(2) }
            jsonPath("$[2].closed") { value(true) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "12:00:00", "closesAt": "21:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$[0].sequence") { value(1) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/holiday-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "rules": [
                {"type": "WEEKLY", "dayOfWeek": "TUESDAY", "reason": "정기 휴무"},
                {"type": "TEMPORARY_DATE", "date": "2026-06-01", "reason": "워크숍"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].reason") { isNotEmpty() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "public-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.slug") { value("public-table") }
            jsonPath("$.status") { value("PUBLIC") }
            jsonPath("$.publicUrl") { value("/r/public-table") }
            jsonPath("$.publishable") { value(true) }
        }

        mockMvc.get("/api/public/restaurants/public-table").andExpect {
            status { isOk() }
            jsonPath("$.name") { value("Public Table") }
            jsonPath("$.reservationPage.status") { value("PUBLIC") }
            jsonPath("$.reservationPage.publicUrl") { value("/r/public-table") }
            jsonPath("$.reservationPage.reservationAvailable") { value(true) }
            jsonPath("$.businessHours[0].dayOfWeek") { value("MONDAY") }
            jsonPath("$.holidayRules[0].reason") { isNotEmpty() }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-page").andExpect {
            status { isOk() }
            jsonPath("$.id") { value(restaurant.id.toInt()) }
            jsonPath("$.slug") { value("public-table") }
            jsonPath("$.reservationPage.status") { value("PUBLIC") }
            jsonPath("$.reservationPage.publicUrl") { value("/r/public-table") }
            jsonPath("$.reservationPage.reservationAvailable") { value(true) }
        }

        val restaurantLogs = auditLogRepository.findByTargetTypeAndTargetId("restaurant", restaurant.id)
        assertThat(restaurantLogs.map { it.action })
            .contains("RESTAURANT_UPDATED", "BUSINESS_HOURS_UPDATED", "HOLIDAY_RULES_UPDATED")
        val pageId = reservationPageRepository.findByRestaurantId(restaurant.id)?.id
            ?: error("Reservation page should exist.")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_page", pageId).map { it.action })
            .contains("RESERVATION_PAGE_UPDATED")
    }

    @Test
    fun reservationPagePublishRequiresApprovedOwnedRestaurantAndBusinessHours() {
        val owner = createBusinessUser("settings-blocked-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val otherOwner = createBusinessUser("settings-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Hidden Table", "hidden-table")

        mockMvc.get("/api/public/restaurants/hidden-table").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-page").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "hidden-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value(org.hamcrest.Matchers.containsString("businessHours")) }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"hours": [{"dayOfWeek": "MONDAY", "opensAt": "11:00:00", "closesAt": "12:00:00"}]}"""
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "MONDAY", "opensAt": "11:00:00", "closesAt": "13:00:00"},
                {"dayOfWeek": "MONDAY", "opensAt": "12:30:00", "closesAt": "14:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("같은 요일의 영업 구간은 겹칠 수 없습니다.") }
        }
    }

    @Test
    fun businessOwnerCanManageReservationProductsAndPublicOnlyVisibleProducts() {
        val owner = createBusinessUser("product-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Product Table", "product-table")

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        val createResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "디너 코스",
              "description": "계절 메뉴 코스",
              "priceAmount": 80000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["FRIDAY", "SATURDAY"],
              "availableStartTime": "18:00:00",
              "availableEndTime": "21:00:00",
              "slotCapacity": 8
            }
            """.trimIndent()
            header("X-Forwarded-For", "203.0.113.40")
            header("User-Agent", "reservation-product-test")
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("디너 코스") }
            jsonPath("$.visible") { value(true) }
            jsonPath("$.status") { value("ACTIVE") }
            jsonPath("$.availableDays[0]") { value("FRIDAY") }
            jsonPath("$.slotCapacity") { value(8) }
            jsonPath("$.paymentPolicyType") { value("NONE") }
        }.andReturn()
        val productId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        val otherOwner = createBusinessUser("product-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        mockMvc.put("/api/business/reservation-products/$productId") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "권한 없음"}"""
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.get("/api/business/reservation-products") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(productId.toInt()) }
            jsonPath("$[0].name") { value("디너 코스") }
        }

        mockMvc.put("/api/business/reservation-products/$productId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "런치 코스",
              "description": "점심 메뉴",
              "priceAmount": 50000,
              "visible": false,
              "minPartySize": 2,
              "maxPartySize": 6,
              "availableDays": ["SUNDAY"],
              "availableStartTime": "12:00:00",
              "availableEndTime": "14:00:00",
              "slotCapacity": 5
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("런치 코스") }
            jsonPath("$.visible") { value(false) }
            jsonPath("$.availableDays[0]") { value("SUNDAY") }
        }

        val page = reservationPageRepository.findByRestaurantId(restaurant.id)
            ?: error("Reservation page should exist.")
        page.status = ReservationPageStatus.PUBLIC
        page.publishedAt = Instant.now()
        reservationPageRepository.saveAndFlush(page)

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isOk() }
            jsonPath("$.products.length()") { value(0) }
        }

        val visibleResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "오마카세",
              "description": "카운터 코스",
              "priceAmount": 120000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 2,
              "slotCapacity": 3
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.availableDays.length()") { value(7) }
        }.andReturn()
        val visibleProductId = JsonPath.read<Int>(visibleResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/reservation-products").andExpect {
            status { isOk() }
            jsonPath("$.products.length()") { value(1) }
            jsonPath("$.products[0].id") { value(visibleProductId.toInt()) }
            jsonPath("$.products[0].displayPrice") { value(120000) }
            jsonPath("$.products[0].requiresPayment") { value(false) }
        }

        mockMvc.delete("/api/business/reservation-products/$visibleProductId") {
            cookie(sessionCookie)
        }.andExpect {
            status { isNoContent() }
        }

        assertThat(reservationProductRepository.findById(visibleProductId).orElseThrow().status)
            .isEqualTo(ReservationProductStatus.DELETED)
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", productId).map { it.action })
            .contains("RESERVATION_PRODUCT_CREATED", "RESERVATION_PRODUCT_UPDATED")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", visibleProductId).map { it.action })
            .contains("RESERVATION_PRODUCT_CREATED", "RESERVATION_PRODUCT_DELETED")
    }

    @Test
    fun reservationProductRejectsInvalidPartyRange() {
        val owner = createBusinessUser("product-invalid-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        createApprovedRestaurantForSettings(owner, "Invalid Product Table")

        mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "대관 상품", "minPartySize": 1, "maxPartySize": 30, "slotCapacity": 1}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") { value("단체 예약 상품은 MVP 범위에서 제외됩니다.") }
        }
    }

    @Test
    fun businessOwnerCanConfigureReservationProductPaymentAndCancellationPolicy() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "product-policy-owner@example.com",
            restaurantName = "Product Policy Table",
            slug = "product-policy",
        )
        val sessionCookie = loginAndExtractSessionCookie(fixture.restaurant.owner.email)
        val productId = fixture.productId

        mockMvc.put("/api/business/reservation-products/$productId/payment-policy") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentPolicyType": "DEPOSIT", "paymentAmount": 30000}"""
            header("X-Forwarded-For", "203.0.113.41")
            header("User-Agent", "product-policy-test")
        }.andExpect {
            status { isOk() }
            jsonPath("$.productId") { value(productId.toInt()) }
            jsonPath("$.paymentPolicyType") { value("DEPOSIT") }
            jsonPath("$.paymentAmount") { value(30000) }
        }

        mockMvc.put("/api/business/reservation-products/$productId/payment-policy") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentPolicyType": "PREPAID", "paymentAmount": 10000}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }

        listOf("PREPAID", "CARD_GUARANTEE", "PAY_ON_SITE", "FREE").forEach { policyType ->
            mockMvc.put("/api/business/reservation-products/$productId/payment-policy") {
                cookie(sessionCookie)
                contentType = MediaType.APPLICATION_JSON
                content = """{"paymentPolicyType": "$policyType"}"""
            }.andExpect {
                status { isOk() }
                jsonPath("$.paymentPolicyType") { value(policyType) }
            }
        }

        mockMvc.put("/api/business/reservation-products/$productId/payment-policy") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentPolicyType": "DEPOSIT", "paymentAmount": 25000}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentPolicyType") { value("DEPOSIT") }
            jsonPath("$.paymentAmount") { value(25000) }
        }

        val firstPolicyResult = mockMvc.post("/api/business/reservation-products/$productId/cancellation-policy") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "기본 취소 정책",
              "rules": [
                {"beforeVisitHours": 24, "refundRate": 50},
                {"beforeVisitHours": 48, "refundRate": 100},
                {"beforeVisitHours": 0, "refundRate": 0}
              ],
              "noShowRule": {"refundRate": 0, "feeAmount": 30000},
              "restaurantCancelRefundRate": 100
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.active") { value(true) }
            jsonPath("$.rules[0].beforeVisitHours") { value(48) }
            jsonPath("$.noShowRule.feeAmount") { value(30000) }
        }.andReturn()
        val firstPolicyId = JsonPath.read<Int>(firstPolicyResult.response.contentAsString, "$.policyId").toLong()

        val activePolicyResult = mockMvc.post("/api/business/reservation-products/$productId/cancellation-policy") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "완화 취소 정책",
              "rules": [
                {"beforeVisitHours": 12, "refundRate": 70},
                {"beforeVisitHours": 0, "refundRate": 0}
              ],
              "restaurantCancelRefundRate": 100
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.active") { value(true) }
            jsonPath("$.rules[0].id") { value("rule_12h_70") }
        }.andReturn()
        val activePolicyId = JsonPath.read<Int>(activePolicyResult.response.contentAsString, "$.policyId").toLong()
        assertThat(cancellationPolicyRepository.findById(firstPolicyId).orElseThrow().active).isFalse()
        assertThat(
            cancellationPolicyRepository
                .findByReservationProductIdAndActiveOrderByEffectiveFromDesc(productId, true)
                .map { it.id },
        ).containsExactly(activePolicyId)

        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "product-policy-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "정책예약",
            customerPhone = "010-8181-0001",
        )
        val reservation = reservationRepository.findById(created.id).orElseThrow()
        assertThat(reservation.paymentRequired).isTrue()
        assertThat(reservation.paymentMode).isEqualTo(ReservationPaymentMode.DEPOSIT)
        assertThat(JsonPath.read<Int>(reservation.cancellationPolicySnapshotJson, "$.policyId").toLong())
            .isEqualTo(activePolicyId)
        assertThat(JsonPath.read<Int>(reservation.cancellationPolicySnapshotJson, "$.rules[0].beforeVisitHours"))
            .isEqualTo(12)
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", productId).map { it.action })
            .contains(
                "RESERVATION_PRODUCT_PAYMENT_POLICY_UPDATED",
                "RESERVATION_PRODUCT_CANCELLATION_POLICY_UPDATED",
            )
    }

    @Test
    fun businessOwnerCanListPaymentsAndRefundsWithFiltersAndReservationSummary() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-payment-owner@example.com",
            restaurantName = "Business Payment Table",
            slug = "business-payment",
        )
        val sessionCookie = loginAndExtractSessionCookie(fixture.restaurant.owner.email)
        val created = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-payment-list-reservation-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "목록고객",
            customerPhone = "010-8282-0001",
        )
        val reservation = reservationRepository.findById(created.id).orElseThrow()
        reservation.paymentStatus = PaymentStatus.PARTIALLY_REFUNDED
        val payment = paymentRepository.saveAndFlush(
            PaymentEntity(
                restaurant = fixture.restaurant,
                reservation = reservation,
                customer = reservation.customer,
                paymentType = PaymentType.DEPOSIT,
                status = PaymentStatus.PAID,
                amount = 30_000,
                refundedAmount = 10_000,
                pgProviderKey = "fake-pg",
                pgPaymentId = "pg-business-payment-list-1",
                pgOrderId = "order-business-payment-list-1",
                idempotencyKey = "business-payment-list-payment-1",
                paidAt = Instant.parse("2026-05-15T00:10:00Z"),
            ),
        )
        val refund = refundRepository.saveAndFlush(
            RefundEntity(
                payment = payment,
                reservation = reservation,
                restaurant = fixture.restaurant,
                status = RefundStatus.SUCCEEDED,
                refundAmount = 10_000,
                nonRefundableAmount = 20_000,
                reason = RefundReason.CUSTOMER_CANCEL,
                pgRefundId = "pg-business-refund-list-1",
                idempotencyKey = "business-payment-list-refund-1",
                requestedByRole = RefundRequesterRole.CUSTOMER,
                succeededAt = Instant.parse("2026-05-15T00:20:00Z"),
            ),
        )
        reservationRepository.saveAndFlush(reservation)

        val otherFixture = createPublicReservationFixture(
            ownerEmail = "business-payment-other@example.com",
            restaurantName = "Other Business Payment Table",
            slug = "business-payment-other",
        )
        val otherCookie = loginAndExtractSessionCookie(otherFixture.restaurant.owner.email)
        val today = LocalDate.now(ZoneId.of("Asia/Seoul"))

        mockMvc.get("/api/business/payments") {
            cookie(sessionCookie)
            param("status", "PAID")
            param("from", today.toString())
            param("to", today.toString())
            param("query", "목록고객")
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalCount") { value(1) }
            jsonPath("$.items[0].paymentId") { value(payment.id.toInt()) }
            jsonPath("$.items[0].reservationNumber") { value(created.reservationNumber) }
            jsonPath("$.items[0].customerPhoneMasked") { value("010-****-0001") }
            jsonPath("$.items[0].paymentType") { value("DEPOSIT") }
            jsonPath("$.items[0].status") { value("PAID") }
            jsonPath("$.items[0].amount") { value(30000) }
            jsonPath("$.items[0].refundedAmount") { value(10000) }
        }

        mockMvc.get("/api/business/payments") {
            cookie(sessionCookie)
            param("status", "FAILED")
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalCount") { value(0) }
            jsonPath("$.items.length()") { value(0) }
        }

        mockMvc.get("/api/business/payments") {
            cookie(otherCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalCount") { value(0) }
        }

        mockMvc.get("/api/business/refunds") {
            cookie(sessionCookie)
            param("status", "SUCCEEDED")
            param("query", "공개 예약 코스")
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalCount") { value(1) }
            jsonPath("$.items[0].refundId") { value(refund.id.toInt()) }
            jsonPath("$.items[0].paymentId") { value(payment.id.toInt()) }
            jsonPath("$.items[0].status") { value("SUCCEEDED") }
            jsonPath("$.items[0].refundAmount") { value(10000) }
            jsonPath("$.items[0].nonRefundableAmount") { value(20000) }
            jsonPath("$.items[0].currency") { value("KRW") }
        }

        mockMvc.get("/api/business/refunds") {
            cookie(sessionCookie)
            param("from", today.plusDays(1).toString())
        }.andExpect {
            status { isOk() }
            jsonPath("$.totalCount") { value(0) }
            jsonPath("$.items.length()") { value(0) }
        }

        mockMvc.get("/api/business/reservations/${reservation.id}") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.paymentSummary.reservationPaymentStatus") { value("PARTIALLY_REFUNDED") }
            jsonPath("$.paymentSummary.latestPaymentId") { value(payment.id.toInt()) }
            jsonPath("$.paymentSummary.latestPaymentStatus") { value("PAID") }
            jsonPath("$.paymentSummary.latestRefundId") { value(refund.id.toInt()) }
            jsonPath("$.paymentSummary.latestRefundStatus") { value("SUCCEEDED") }
            jsonPath("$.paymentSummary.refundedAmount") { value(10000) }
        }
    }

    @Test
    fun businessOwnerCanManageTablesCombinationsAndProductSeatRules() {
        val owner = createBusinessUser("inventory-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        createApprovedRestaurantForSettings(owner, "Inventory Table", "inventory-table")

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "좌석 연결 코스",
              "priceAmount": 60000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "slotCapacity": 4
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        val hallTableResult = mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "A1",
              "seatType": "HALL",
              "seatTypeLabel": "홀",
              "minPartySize": 1,
              "maxPartySize": 4,
              "sortOrder": 10
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.name") { value("A1") }
            jsonPath("$.seatType") { value("HALL") }
            jsonPath("$.active") { value(true) }
        }.andReturn()
        val hallTableId = JsonPath.read<Int>(hallTableResult.response.contentAsString, "$.id").toLong()

        val roomTableResult = mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "R1",
              "seatType": "ROOM",
              "seatTypeLabel": "룸",
              "minPartySize": 2,
              "maxPartySize": 4,
              "sortOrder": 20
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.seatType") { value("ROOM") }
        }.andReturn()
        val roomTableId = JsonPath.read<Int>(roomTableResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"단체석","seatType":"HALL","minPartySize":1,"maxPartySize":9}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }

        mockMvc.put("/api/business/tables/$hallTableId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"A1-수정","seatType":"HALL","seatTypeLabel":"홀","minPartySize":1,"maxPartySize":4,"active":true,"sortOrder":5}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.name") { value("A1-수정") }
            jsonPath("$.sortOrder") { value(5) }
        }

        mockMvc.get("/api/business/tables") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].id") { value(hallTableId.toInt()) }
            jsonPath("$[1].id") { value(roomTableId.toInt()) }
        }

        val combinationResult = mockMvc.post("/api/business/table-combinations") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "A1+R1",
              "tableIds": [$hallTableId, $roomTableId],
              "minPartySize": 2,
              "maxPartySize": 8
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.tableIds.length()") { value(2) }
            jsonPath("$.maxPartySize") { value(8) }
        }.andReturn()
        val combinationId = JsonPath.read<Int>(combinationResult.response.contentAsString, "$.id").toLong()

        mockMvc.put("/api/business/table-combinations/$combinationId") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"A1+R1 비활성","tableIds":[$hallTableId,$roomTableId],"minPartySize":2,"maxPartySize":8,"active":false}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.active") { value(false) }
        }

        val otherOwner = createBusinessUser("inventory-other-owner@example.com")
        val otherCookie = loginAndExtractSessionCookie(otherOwner.email)
        createApprovedRestaurantForSettings(otherOwner, "Other Inventory Table", "inventory-other")
        val otherTableResult = mockMvc.post("/api/business/tables") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"외부테이블","seatType":"HALL","minPartySize":1,"maxPartySize":2}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val otherTableId = JsonPath.read<Int>(otherTableResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "allowedSeatTypes": ["HALL", "ROOM"],
              "allowedTableIds": [$hallTableId, $roomTableId],
              "defaultDurationMinutes": 120,
              "slotIntervalMinutes": 30,
              "inventoryPolicy": "TABLE"
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.productId") { value(productId.toInt()) }
            jsonPath("$.allowedSeatTypes[0]") { value("HALL") }
            jsonPath("$.allowedTableIds.length()") { value(2) }
            jsonPath("$.defaultDurationMinutes") { value(120) }
            jsonPath("$.slotIntervalMinutes") { value(30) }
        }

        mockMvc.get("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.allowedTableIds[0]") { value(hallTableId.toInt()) }
            jsonPath("$.inventoryPolicy") { value("TABLE") }
        }

        mockMvc.post("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"allowedTableIds": [$hallTableId, $otherTableId], "slotIntervalMinutes": 30}"""
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        assertThat(auditLogRepository.findByTargetTypeAndTargetId("restaurant_table", hallTableId).map { it.action })
            .contains("RESTAURANT_TABLE_CREATED", "RESTAURANT_TABLE_UPDATED")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("table_combination", combinationId).map { it.action })
            .contains("TABLE_COMBINATION_CREATED", "TABLE_COMBINATION_UPDATED")
    }

    @Test
    fun businessOwnerCanGenerateCloseAndReopenTimeSlots() {
        val owner = createBusinessUser("time-slot-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Time Slot Table", "time-slot-table")
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(4)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "$targetDay", "opensAt": "11:00:00", "closesAt": "15:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "time-slot-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "타임슬롯 코스",
              "priceAmount": 80000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "15:00:00",
              "slotCapacity": 2
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        val hallTableResult = mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"슬롯홀","seatType":"HALL","minPartySize":1,"maxPartySize":4}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val hallTableId = JsonPath.read<Int>(hallTableResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"슬롯룸","seatType":"ROOM","minPartySize":1,"maxPartySize":4}"""
        }.andExpect {
            status { isCreated() }
        }

        mockMvc.post("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "allowedTableIds": [$hallTableId],
              "defaultDurationMinutes": 120,
              "slotIntervalMinutes": 60,
              "inventoryPolicy": "TABLE"
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.post("/api/business/time-slots") {
            cookie(sessionCookie)
            header("User-Agent", "time-slot-test")
            contentType = MediaType.APPLICATION_JSON
            content = """{"productId":$productId,"from":"$targetDate","to":"$targetDate"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.createdCount") { value(3) }
            jsonPath("$.updatedCount") { value(0) }
            jsonPath("$.slots.length()") { value(3) }
            jsonPath("$.slots[0].startTime") { value("11:00:00") }
            jsonPath("$.slots[0].endTime") { value("13:00:00") }
            jsonPath("$.slots[0].capacity") { value(4) }
            jsonPath("$.slots[1].startTime") { value("12:00:00") }
            jsonPath("$.slots[2].startTime") { value("13:00:00") }
        }

        mockMvc.get("/api/business/time-slots") {
            cookie(sessionCookie)
            param("productId", productId.toString())
            param("date", targetDate.toString())
        }.andExpect {
            status { isOk() }
            jsonPath("$.slots.length()") { value(3) }
            jsonPath("$.slots[1].status") { value("OPEN") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(3) }
            jsonPath("$.times[0].endTime") { value("13:00:00") }
        }

        val closeResult = mockMvc.post("/api/business/time-slots/close") {
            cookie(sessionCookie)
            header("User-Agent", "time-slot-test")
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "productId": $productId,
              "date": "$targetDate",
              "startTime": "12:00:00",
              "reason": "단체 준비"
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("BLOCKED") }
            jsonPath("$.available") { value(false) }
        }.andReturn()
        val closedSlotId = JsonPath.read<Int>(closeResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(2) }
            jsonPath("$.times[0].startTime") { value("11:00:00") }
            jsonPath("$.times[1].startTime") { value("13:00:00") }
        }

        mockMvc.post("/api/business/time-slots/reopen") {
            cookie(sessionCookie)
            header("User-Agent", "time-slot-test")
            contentType = MediaType.APPLICATION_JSON
            content = """{"timeSlotId":$closedSlotId,"reason":"운영 재개"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("OPEN") }
            jsonPath("$.available") { value(true) }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(3) }
        }

        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation_product", productId).map { it.action })
            .contains("TIME_SLOTS_GENERATED")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("time_slot", closedSlotId).map { it.action })
            .contains("TIME_SLOT_TEMPORARILY_CLOSED", "TIME_SLOT_REOPENED")
    }

    @Test
    fun seatInventoryPreventsOverlappingTableReservationsAndRestoresAfterCancel() {
        val owner = createBusinessUser("seat-inventory-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Seat Inventory Table", "seat-inventory-table")
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(4)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "$targetDay", "opensAt": "11:00:00", "closesAt": "15:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "seat-inventory-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "좌석 재고 코스",
              "priceAmount": 90000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "15:00:00",
              "slotCapacity": 8
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        val tableResult = mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"좌석A","seatType":"HALL","minPartySize":1,"maxPartySize":4}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val tableId = JsonPath.read<Int>(tableResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "allowedTableIds": [$tableId],
              "defaultDurationMinutes": 120,
              "slotIntervalMinutes": 60,
              "inventoryPolicy": "TABLE"
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.post("/api/business/time-slots") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"productId":$productId,"from":"$targetDate","to":"$targetDate"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.slots.length()") { value(3) }
        }

        val requestBody = """
        {
          "restaurantId": ${restaurant.id},
          "productId": $productId,
          "visitDate": "$targetDate",
          "startTime": "11:00:00",
          "partySize": 2,
          "customerName": "좌석예약",
          "customerPhone": "010-2600-0001"
        }
        """.trimIndent()
        val createResult = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "seat-inventory-reserve-1")
            contentType = MediaType.APPLICATION_JSON
            content = requestBody
        }.andExpect {
            status { isCreated() }
            jsonPath("$.endTime") { value("13:00:00") }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()
        val lookupToken = JsonPath.read<String>(createResult.response.contentAsString, "$.lookupToken")

        assertThat(
            jdbcTemplate.queryForObject(
                "select count(*) from reservation_table_assignments where reservation_id = ? and restaurant_table_id = ?",
                Long::class.java,
                reservationId,
                tableId,
            ),
        ).isEqualTo(1)

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(1) }
            jsonPath("$.times[0].startTime") { value("13:00:00") }
        }

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "seat-inventory-reserve-overlap")
            contentType = MediaType.APPLICATION_JSON
            content = requestBody.replace("seat-inventory-reserve-1", "seat-inventory-reserve-overlap")
                .replace("010-2600-0001", "010-2600-0002")
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("예약 가능한 좌석이 없습니다.") }
        }

        mockMvc.post("/api/public/reservations/$reservationId/cancel") {
            header("X-Reservation-Lookup-Token", lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason":"일정 변경"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(3) }
        }
    }

    @Test
    fun publicAvailabilityUsesHoursHolidaysProductPolicyAndCapacity() {
        val owner = createBusinessUser("availability-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Availability Table", "availability-table")
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(3)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "$targetDay", "opensAt": "11:00:00", "closesAt": "13:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/holiday-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "rules": [
                {
                  "type": "TEMPORARY_TIME",
                  "date": "$targetDate",
                  "startTime": "11:30:00",
                  "endTime": "12:30:00",
                  "reason": "브레이크"
                }
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "availability-table", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "가능 시간 코스",
              "priceAmount": 70000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "13:00:00",
              "slotCapacity": 4
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/dates") {
            param("productId", productId.toString())
            param("from", targetDate.toString())
            param("to", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.dates.length()") { value(1) }
            jsonPath("$.dates[0].date") { value(targetDate.toString()) }
            jsonPath("$.dates[0].available") { value(true) }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(2) }
            jsonPath("$.times[0].startTime") { value("11:00:00") }
            jsonPath("$.times[0].endTime") { value("11:30:00") }
            jsonPath("$.times[0].remainingCapacity") { value(4) }
            jsonPath("$.times[1].startTime") { value("12:30:00") }
            jsonPath("$.times[1].endTime") { value("13:00:00") }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/dates") {
            param("productId", productId.toString())
            param("from", targetDate.toString())
            param("to", targetDate.toString())
            param("partySize", "5")
        }.andExpect {
            status { isOk() }
            jsonPath("$.dates.length()") { value(0) }
        }

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", targetDate.plusDays(1).toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(0) }
        }
    }

    @Test
    fun publicAvailabilityHidesPrivateOrHiddenProducts() {
        val owner = createBusinessUser("availability-hidden-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, "Hidden Availability Table", "hidden-availability")

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name": "숨김 상품", "visible": false, "slotCapacity": 1}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()

        mockMvc.get("/api/public/restaurants/${restaurant.id}/availability/times") {
            param("productId", productId.toString())
            param("date", LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(1).toString())
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }
    }

    @Test
    fun publicReservationCreateMatchesCustomerAndReusesIdempotencyKey() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-create-owner@example.com",
            restaurantName = "Reservation Create Table",
            slug = "reservation-create",
        )
        val requestBody = publicReservationRequestJson(
            fixture = fixture,
            startTime = "11:00:00",
            partySize = 2,
            customerName = "김예약",
            customerPhone = "010-1111-2222",
            customerRequest = "창가 좌석 요청",
        )

        val createResult = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-create-1")
            contentType = MediaType.APPLICATION_JSON
            content = requestBody
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("CONFIRMED") }
            jsonPath("$.reservationNumber") { isNotEmpty() }
            jsonPath("$.restaurantId") { value(fixture.restaurant.id.toInt()) }
            jsonPath("$.productId") { value(fixture.productId.toInt()) }
            jsonPath("$.visitDate") { value(fixture.targetDate.toString()) }
            jsonPath("$.startTime") { value("11:00:00") }
            jsonPath("$.endTime") { value("11:30:00") }
            jsonPath("$.partySize") { value(2) }
            jsonPath("$.customerName") { value("김예약") }
            jsonPath("$.customerPhoneLast4") { value("2222") }
            jsonPath("$.lookupToken") { isNotEmpty() }
            jsonPath("$.lookupTokenExpiresAt") { isNotEmpty() }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id")
        val reservationNumber = JsonPath.read<String>(createResult.response.contentAsString, "$.reservationNumber")

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-create-1")
            contentType = MediaType.APPLICATION_JSON
            content = requestBody
        }.andExpect {
            status { isCreated() }
            jsonPath("$.id") { value(reservationId) }
            jsonPath("$.reservationNumber") { value(reservationNumber) }
        }

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-create-2")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:30:00",
                partySize = 1,
                customerName = "김예약",
                customerPhone = "01011112222",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.customerPhoneLast4") { value("2222") }
        }

        assertThat(customerRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(1)
        assertThat(reservationRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(2)
    }

    @Test
    fun publicReservationRejectsIdempotencyMismatchStockAndBusinessHours() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-reject-owner@example.com",
            restaurantName = "Reservation Reject Table",
            slug = "reservation-reject",
            slotCapacity = 4,
        )

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-reject-1")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 3,
                customerName = "박예약",
                customerPhone = "010-3333-4444",
            )
        }.andExpect {
            status { isCreated() }
        }

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-reject-1")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 2,
                customerName = "박예약",
                customerPhone = "010-3333-4444",
            )
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("같은 Idempotency-Key로 다른 예약 요청을 처리할 수 없습니다.") }
        }

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-reject-2")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 2,
                customerName = "이예약",
                customerPhone = "010-5555-6666",
            )
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("예약 가능한 재고가 없습니다.") }
        }

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-reject-3")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "10:30:00",
                partySize = 1,
                customerName = "최예약",
                customerPhone = "010-7777-8888",
            )
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("예약 가능한 시간이 아닙니다.") }
        }

        assertThat(reservationRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(1)
    }

    @Test
    fun publicReservationDetailAndCancelUseLookupTokenAndRecordNotifications() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-detail-owner@example.com",
            restaurantName = "Reservation Detail Table",
            slug = "reservation-detail",
            slotCapacity = 4,
        )
        val createResult = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-detail-1")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 4,
                customerName = "정상세",
                customerPhone = "010-1000-2000",
                customerRequest = "조용한 자리",
            )
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()
        val lookupToken = JsonPath.read<String>(createResult.response.contentAsString, "$.lookupToken")
        val reservationNumber = JsonPath.read<String>(createResult.response.contentAsString, "$.reservationNumber")

        val confirmedNotifications = notificationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
        assertThat(confirmedNotifications.map { it.templateKey })
            .containsExactly(RESERVATION_CONFIRMED_TEMPLATE, VISIT_REMINDER_TEMPLATE)
        assertThat(confirmedNotifications.map { it.status }).containsOnly(NotificationStatus.QUEUED)
        assertThat(confirmedNotifications.single { it.templateKey == VISIT_REMINDER_TEMPLATE }.scheduledAt).isNotNull()

        mockMvc.get("/api/public/reservations/$reservationId").andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("AUTHENTICATION_REQUIRED") }
        }

        mockMvc.get("/api/public/reservations/$reservationId") {
            param("lookupToken", "wrong-token")
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code") { value("ACCESS_DENIED") }
        }

        mockMvc.get("/api/public/reservations/$reservationId") {
            param("lookupToken", lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.reservationNumber") { value(reservationNumber) }
            jsonPath("$.status") { value("CONFIRMED") }
            jsonPath("$.restaurantName") { value("Reservation Detail Table") }
            jsonPath("$.productName") { value("공개 예약 코스") }
            jsonPath("$.customerPhoneLast4") { value("2000") }
            jsonPath("$.customerRequest") { value("조용한 자리") }
            jsonPath("$.cancelable") { value(true) }
            jsonPath("$.cancelDeadline") { isNotEmpty() }
        }

        mockMvc.post("/api/public/reservations/$reservationId/cancel") {
            header("X-Reservation-Lookup-Token", lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "고객 일정 변경"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
            jsonPath("$.cancelable") { value(false) }
            jsonPath("$.cancelledAt") { isNotEmpty() }
            jsonPath("$.cancelReason") { value("고객 일정 변경") }
        }

        assertThat(reservationRepository.findById(reservationId).orElseThrow().status)
            .isEqualTo(ReservationStatus.CANCELLED_BY_CUSTOMER)
        val cancelledNotifications = notificationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)
        assertThat(cancelledNotifications.map { it.templateKey })
            .containsExactly(RESERVATION_CONFIRMED_TEMPLATE, VISIT_REMINDER_TEMPLATE, RESERVATION_CANCELLED_TEMPLATE)
        assertThat(cancelledNotifications.single { it.templateKey == VISIT_REMINDER_TEMPLATE }.status)
            .isEqualTo(NotificationStatus.CANCELLED)
        assertThat(cancelledNotifications.single { it.templateKey == RESERVATION_CANCELLED_TEMPLATE }.status)
            .isEqualTo(NotificationStatus.QUEUED)

        mockMvc.post("/api/public/reservations/$reservationId/cancel") {
            header("X-Reservation-Lookup-Token", lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
        }
        assertThat(notificationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId)).hasSize(3)

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-detail-2")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 4,
                customerName = "재예약",
                customerPhone = "010-3000-4000",
            )
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("CONFIRMED") }
        }
    }

    @Test
    fun businessOwnerCanListCalendarAndReadOwnReservations() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-reservation-owner@example.com",
            restaurantName = "Business Reservation Table",
            slug = "business-reservation",
            slotCapacity = 6,
        )
        val ownerCookie = loginAndExtractSessionCookie("business-reservation-owner@example.com")
        val first = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-reserve-list-1",
            startTime = "11:00:00",
            partySize = 2,
            customerName = "김조회",
            customerPhone = "010-1234-5678",
            customerRequest = "창가 좌석",
        )
        val second = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-reserve-list-2",
            startTime = "11:30:00",
            partySize = 1,
            customerName = "박취소",
            customerPhone = "010-9999-0000",
        )
        mockMvc.post("/api/public/reservations/${second.id}/cancel") {
            header("X-Reservation-Lookup-Token", second.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "고객 요청"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
        }

        val otherFixture = createPublicReservationFixture(
            ownerEmail = "business-reservation-other@example.com",
            restaurantName = "Other Business Reservation Table",
            slug = "business-reservation-other",
        )
        val otherOwnerCookie = loginAndExtractSessionCookie("business-reservation-other@example.com")
        createPublicReservationForFixture(
            fixture = otherFixture,
            idempotencyKey = "business-reserve-list-other",
            startTime = "11:00:00",
            partySize = 4,
            customerName = "타매장",
            customerPhone = "010-1111-9999",
        )

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("query", "1234")
        }.andExpect {
            status { isOk() }
            jsonPath("$.date") { value(fixture.targetDate.toString()) }
            jsonPath("$.summary.totalReservations") { value(1) }
            jsonPath("$.summary.totalPartySize") { value(2) }
            jsonPath("$.summary.confirmedCount") { value(1) }
            jsonPath("$.summary.cancelledCount") { value(0) }
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(first.id.toInt()) }
            jsonPath("$.items[0].status") { value("CONFIRMED") }
            jsonPath("$.items[0].statusLabel") { value("확정") }
            jsonPath("$.items[0].statusTone") { value("success") }
            jsonPath("$.items[0].source") { value("ONLINE") }
            jsonPath("$.items[0].reservedStartAt") { isNotEmpty() }
            jsonPath("$.items[0].productId") { value(fixture.productId.toInt()) }
            jsonPath("$.items[0].productName") { value("공개 예약 코스") }
            jsonPath("$.items[0].customer.name") { value("김조회") }
            jsonPath("$.items[0].customer.phoneMasked") { value("010-****-5678") }
            jsonPath("$.items[0].hasCustomerRequest") { value(true) }
            jsonPath("$.items[0].hasOwnerNote") { value(false) }
            jsonPath("$.items[0].paymentStatus") { value("NOT_REQUIRED") }
            jsonPath("$.items[0].paymentActionRequired") { value(false) }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("includeCancelled", "true")
        }.andExpect {
            status { isOk() }
            jsonPath("$.summary.totalReservations") { value(2) }
            jsonPath("$.summary.totalPartySize") { value(3) }
            jsonPath("$.summary.cancelledCount") { value(1) }
            jsonPath("$.items.length()") { value(2) }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("status", "CANCELLED_BY_CUSTOMER")
        }.andExpect {
            status { isOk() }
            jsonPath("$.summary.totalReservations") { value(1) }
            jsonPath("$.items[0].id") { value(second.id.toInt()) }
            jsonPath("$.items[0].statusLabel") { value("고객 취소") }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("productId", fixture.productId.toString())
            param("startTime", "11:00:00")
            param("endTime", "11:30:00")
            param("includeCancelled", "true")
        }.andExpect {
            status { isOk() }
            jsonPath("$.items.length()") { value(1) }
            jsonPath("$.items[0].id") { value(first.id.toInt()) }
        }

        mockMvc.get("/api/business/reservations/calendar") {
            cookie(ownerCookie)
            param("from", fixture.targetDate.toString())
            param("to", fixture.targetDate.toString())
        }.andExpect {
            status { isOk() }
            jsonPath("$.days.length()") { value(1) }
            jsonPath("$.days[0].date") { value(fixture.targetDate.toString()) }
            jsonPath("$.days[0].isOpen") { value(true) }
            jsonPath("$.days[0].reservationCount") { value(2) }
            jsonPath("$.days[0].partySizeTotal") { value(3) }
            jsonPath("$.days[0].confirmedCount") { value(1) }
            jsonPath("$.days[0].cancelledCount") { value(1) }
        }

        mockMvc.get("/api/business/reservations/${first.id}") {
            cookie(ownerCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.id") { value(first.id.toInt()) }
            jsonPath("$.reservationNumber") { value(first.reservationNumber) }
            jsonPath("$.status") { value("CONFIRMED") }
            jsonPath("$.product.id") { value(fixture.productId.toInt()) }
            jsonPath("$.product.name") { value("공개 예약 코스") }
            jsonPath("$.customer.name") { value("김조회") }
            jsonPath("$.customer.phoneNumber") { value("01012345678") }
            jsonPath("$.customer.visitCount") { value(1) }
            jsonPath("$.customer.noShowCount") { value(0) }
            jsonPath("$.customerRequest") { value("창가 좌석") }
            jsonPath("$.ownerNote") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.paymentStatus") { value("NOT_REQUIRED") }
            jsonPath("$.auditLogs.length()") { value(0) }
        }

        mockMvc.get("/api/business/reservations/${first.id}") {
            cookie(otherOwnerCookie)
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", "not-a-date")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("status", "UNKNOWN")
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }
    }

    @Test
    fun businessOwnerCanCreateManualReservationWithSourceAndAuditLog() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-manual-reservation-owner@example.com",
            restaurantName = "Business Manual Reservation Table",
            slug = "business-manual-reservation",
            slotCapacity = 6,
        )
        val ownerCookie = loginAndExtractSessionCookie("business-manual-reservation-owner@example.com")

        val createResult = mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            header("X-Forwarded-For", "203.0.113.16")
            header("User-Agent", "manual-reservation-test")
            content = """
            {
              "source": "manual_phone",
              "productId": ${fixture.productId},
              "visitDate": "${fixture.targetDate}",
              "startTime": "11:00:00",
              "partySize": 2,
              "customerName": "이전화",
              "customerPhone": "010-2222-3333",
              "customerRequest": "유아 의자 요청"
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("CONFIRMED") }
            jsonPath("$.source") { value("MANUAL_PHONE") }
            jsonPath("$.product.id") { value(fixture.productId.toInt()) }
            jsonPath("$.customer.name") { value("이전화") }
            jsonPath("$.customer.phoneNumber") { value("01022223333") }
            jsonPath("$.customerRequest") { value("유아 의자 요청") }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()
        val customerId = JsonPath.read<Int>(createResult.response.contentAsString, "$.customer.id")

        val savedReservation = reservationRepository.findById(reservationId).orElseThrow()
        assertThat(savedReservation.source).isEqualTo(ReservationSource.MANUAL_PHONE)

        val auditLog = auditLogRepository.findByTargetTypeAndTargetId("reservation", reservationId).single()
        assertThat(auditLog.action).isEqualTo("RESERVATION_CREATED_MANUAL")
        assertThat(auditLog.ipAddress).isEqualTo("203.0.113.16")
        assertThat(auditLog.userAgent).isEqualTo("manual-reservation-test")
        assertThat(auditLog.afterValue)
            .contains("\"source\": \"MANUAL_PHONE\"")
            .contains(savedReservation.reservationNumber)

        val secondResult = mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "source": "manual_walk_in",
              "productId": ${fixture.productId},
              "visitDate": "${fixture.targetDate}",
              "startTime": "11:30:00",
              "partySize": 1,
              "customerName": "이재방문",
              "customerPhone": "01022223333"
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.source") { value("MANUAL_WALK_IN") }
            jsonPath("$.customer.id") { value(customerId) }
            jsonPath("$.customer.name") { value("이재방문") }
        }.andReturn()
        val secondReservationId = JsonPath.read<Int>(secondResult.response.contentAsString, "$.id").toLong()
        assertThat(reservationRepository.findById(secondReservationId).orElseThrow().source)
            .isEqualTo(ReservationSource.MANUAL_WALK_IN)
        assertThat(customerRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(1)

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("includeCancelled", "true")
        }.andExpect {
            status { isOk() }
            jsonPath("$.summary.totalReservations") { value(2) }
            jsonPath("$.items[0].source") { value("MANUAL_PHONE") }
            jsonPath("$.items[1].source") { value("MANUAL_WALK_IN") }
        }

        val hiddenProductResult = mockMvc.post("/api/business/reservation-products") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "숨김 전화 예약 코스",
              "visible": false,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["${fixture.targetDate.dayOfWeek.name}"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "13:00:00",
              "slotCapacity": 2
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val hiddenProductId = JsonPath.read<Int>(hiddenProductResult.response.contentAsString, "$.id").toLong()
        mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "source": "manual_phone",
              "productId": $hiddenProductId,
              "visitDate": "${fixture.targetDate}",
              "startTime": "12:00:00",
              "partySize": 1,
              "customerName": "숨김상품",
              "customerPhone": "010-3333-4444"
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
            jsonPath("$.product.id") { value(hiddenProductId.toInt()) }
            jsonPath("$.source") { value("MANUAL_PHONE") }
        }

        mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "productId": ${fixture.productId},
              "visitDate": "${fixture.targetDate}",
              "startTime": "11:00:00",
              "partySize": 5,
              "customerName": "초과예약",
              "customerPhone": "010-4444-5555"
            }
            """.trimIndent()
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
        }

        val otherFixture = createPublicReservationFixture(
            ownerEmail = "business-manual-reservation-other@example.com",
            restaurantName = "Other Manual Reservation Table",
            slug = "business-manual-reservation-other",
        )
        val otherCookie = loginAndExtractSessionCookie("business-manual-reservation-other@example.com")
        mockMvc.post("/api/business/reservations/manual") {
            cookie(otherCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "productId": ${fixture.productId},
              "visitDate": "${otherFixture.targetDate}",
              "startTime": "11:00:00",
              "partySize": 1,
              "customerName": "타매장",
              "customerPhone": "010-7777-8888"
            }
            """.trimIndent()
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "source": "ONLINE",
              "productId": ${fixture.productId},
              "visitDate": "${fixture.targetDate}",
              "startTime": "12:00:00",
              "partySize": 1,
              "customerName": "출처오류",
              "customerPhone": "010-8888-9999"
            }
            """.trimIndent()
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }
    }

    @Test
    fun businessOwnerCanUpdateCancelCompleteAndNoShowReservations() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-transition-owner@example.com",
            restaurantName = "Business Transition Table",
            slug = "business-transition",
            slotCapacity = 4,
        )
        val ownerCookie = loginAndExtractSessionCookie("business-transition-owner@example.com")

        fun createManualReservation(
            idempotencyLabel: String,
            startTime: String,
            partySize: Int,
        ): Long {
            val result = mockMvc.post("/api/business/reservations/manual") {
                cookie(ownerCookie)
                contentType = MediaType.APPLICATION_JSON
                content = """
                {
                  "source": "manual_phone",
                  "productId": ${fixture.productId},
                  "visitDate": "${fixture.targetDate}",
                  "startTime": "$startTime",
                  "partySize": $partySize,
                  "customerName": "상태전이$idempotencyLabel",
                  "customerPhone": "010-55${idempotencyLabel.padStart(2, '0')}-0000"
                }
                """.trimIndent()
            }.andExpect {
                status { isCreated() }
            }.andReturn()
            return JsonPath.read<Int>(result.response.contentAsString, "$.id").toLong()
        }

        val reservationId = createManualReservation("1", "11:00:00", 2)
        mockMvc.put("/api/business/reservations/$reservationId") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            header("X-Forwarded-For", "203.0.113.17")
            content = """
            {
              "visitDate": "${fixture.targetDate}",
              "startTime": "11:30:00",
              "partySize": 3
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("MODIFIED") }
            jsonPath("$.statusLabel") { value("변경됨") }
            jsonPath("$.startTime") { value("11:30:00") }
            jsonPath("$.partySize") { value(3) }
        }
        val updatedLog = auditLogRepository.findByTargetTypeAndTargetId("reservation", reservationId)
            .single { it.action == "RESERVATION_UPDATED" }
        assertThat(updatedLog.beforeValue).contains("\"startTime\": \"11:00\"")
        assertThat(updatedLog.afterValue).contains("\"startTime\": \"11:30\"")
        assertThat(updatedLog.ipAddress).isEqualTo("203.0.113.17")
        assertThat(notificationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId).map { it.templateKey })
            .contains(RESERVATION_CONFIRMED_TEMPLATE, RESERVATION_UPDATED_TEMPLATE, VISIT_REMINDER_TEMPLATE)

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
        }.andExpect {
            status { isOk() }
            jsonPath("$.summary.modifiedCount") { value(1) }
            jsonPath("$.items[0].status") { value("MODIFIED") }
        }

        createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-transition-old-slot",
            startTime = "11:00:00",
            partySize = 4,
            customerName = "기존슬롯",
            customerPhone = "010-6600-0000",
        )
        mockMvc.put("/api/business/reservations/$reservationId") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "startTime": "11:00:00",
              "partySize": 1
            }
            """.trimIndent()
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
        }

        mockMvc.post("/api/business/reservations/$reservationId/cancel") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "매장 임시 휴무"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_RESTAURANT") }
            jsonPath("$.cancelledAt") { isNotEmpty() }
            jsonPath("$.cancelReason") { value("매장 임시 휴무") }
        }
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation", reservationId).map { it.action })
            .contains("RESERVATION_CANCELLED_BY_RESTAURANT")
        assertThat(notificationRepository.findByReservationIdOrderByCreatedAtAsc(reservationId).map { it.templateKey })
            .contains(RESERVATION_CANCELLED_TEMPLATE)

        createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-transition-freed-slot",
            startTime = "11:30:00",
            partySize = 4,
            customerName = "복구슬롯",
            customerPhone = "010-7700-0000",
        )
        mockMvc.put("/api/business/reservations/$reservationId") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"partySize": 2}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
        }

        val completeId = createManualReservation("2", "12:00:00", 1)
        val noShowId = createManualReservation("3", "12:30:00", 1)
        val pastDate = LocalDate.now(ZoneId.of("Asia/Seoul")).minusDays(1)
        jdbcTemplate.update(
            "update reservations set visit_date = ?, start_time = ?, end_time = ? where id = ?",
            java.sql.Date.valueOf(pastDate),
            java.sql.Time.valueOf("12:00:00"),
            java.sql.Time.valueOf("12:30:00"),
            completeId,
        )
        jdbcTemplate.update(
            "update reservations set visit_date = ?, start_time = ?, end_time = ? where id = ?",
            java.sql.Date.valueOf(pastDate),
            java.sql.Time.valueOf("12:30:00"),
            java.sql.Time.valueOf("13:00:00"),
            noShowId,
        )

        mockMvc.post("/api/business/reservations/$completeId/complete") {
            cookie(ownerCookie)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("COMPLETED") }
            jsonPath("$.completedAt") { isNotEmpty() }
        }
        mockMvc.post("/api/business/reservations/$noShowId/no-show") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "예약 시간 경과"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("NO_SHOW") }
            jsonPath("$.noShowAt") { isNotEmpty() }
        }
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation", completeId).map { it.action })
            .contains("RESERVATION_COMPLETED")
        assertThat(auditLogRepository.findByTargetTypeAndTargetId("reservation", noShowId).map { it.action })
            .contains("RESERVATION_NO_SHOW")

        val futureNoShowId = createManualReservation("4", "12:00:00", 1)
        mockMvc.post("/api/business/reservations/$futureNoShowId/no-show") {
            cookie(ownerCookie)
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
        }
    }

    @Test
    fun customerCanCancelReservationAfterOwnerModification() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-modified-customer-cancel-owner@example.com",
            restaurantName = "Business Modified Customer Cancel Table",
            slug = "business-modified-customer-cancel",
            slotCapacity = 2,
        )
        val ownerCookie = loginAndExtractSessionCookie("business-modified-customer-cancel-owner@example.com")
        val reservation = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = "business-modified-customer-cancel",
            startTime = "11:00:00",
            partySize = 1,
            customerName = "변경취소",
            customerPhone = "010-1212-3434",
        )

        mockMvc.put("/api/business/reservations/${reservation.id}") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "startTime": "11:30:00",
              "partySize": 1
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("MODIFIED") }
        }

        mockMvc.get("/api/public/reservations/${reservation.id}") {
            param("lookupToken", reservation.lookupToken)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("MODIFIED") }
            jsonPath("$.cancelable") { value(true) }
        }

        mockMvc.post("/api/public/reservations/${reservation.id}/cancel") {
            header("X-Reservation-Lookup-Token", reservation.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "변경 후 고객 취소"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
            jsonPath("$.cancelable") { value(false) }
        }
    }

    @Test
    fun businessOwnerCanUpdateOperationNoteAndReadReservationAuditLogs() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "business-audit-owner@example.com",
            restaurantName = "Business Audit Table",
            slug = "business-audit",
            slotCapacity = 2,
        )
        val ownerCookie = loginAndExtractSessionCookie("business-audit-owner@example.com")
        val createResult = mockMvc.post("/api/business/reservations/manual") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            header("X-Forwarded-For", "203.0.113.18")
            header("User-Agent", "audit-test")
            content = """
            {
              "source": "manual_phone",
              "productId": ${fixture.productId},
              "visitDate": "${fixture.targetDate}",
              "startTime": "11:00:00",
              "partySize": 1,
              "customerName": "감사로그",
              "customerPhone": "010-1818-0000"
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/reservations/$reservationId/cancel") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "감사 로그 취소"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_RESTAURANT") }
        }

        mockMvc.put("/api/business/reservations/$reservationId/operation-note") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            header("X-Forwarded-For", "203.0.113.19")
            content = """{"ownerNote": "통화 완료, 재예약 안내"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.ownerNote") { value("통화 완료, 재예약 안내") }
            jsonPath("$.auditLogs.length()") { value(3) }
            jsonPath("$.auditLogs[2].action") { value("RESERVATION_OWNER_NOTE_UPDATED") }
        }

        mockMvc.get("/api/business/reservations") {
            cookie(ownerCookie)
            param("date", fixture.targetDate.toString())
            param("includeCancelled", "true")
        }.andExpect {
            status { isOk() }
            jsonPath("$.items[0].hasOwnerNote") { value(true) }
        }

        mockMvc.get("/api/business/audit-logs") {
            cookie(ownerCookie)
            param("targetType", "reservation")
            param("targetId", reservationId.toString())
        }.andExpect {
            status { isOk() }
            jsonPath("$.items.length()") { value(3) }
            jsonPath("$.items[0].actorRole") { value("OWNER") }
            jsonPath("$.items[0].actorUserId") { exists() }
            jsonPath("$.items[0].targetType") { value("reservation") }
            jsonPath("$.items[0].targetId") { value(reservationId.toInt()) }
            jsonPath("$.items[0].action") { value("RESERVATION_CREATED_MANUAL") }
            jsonPath("$.items[0].createdAt") { isNotEmpty() }
            jsonPath("$.items[2].action") { value("RESERVATION_OWNER_NOTE_UPDATED") }
            jsonPath("$.items[2].beforeValue.ownerNote") { value(org.hamcrest.Matchers.nullValue()) }
            jsonPath("$.items[2].afterValue.ownerNote") { value("통화 완료, 재예약 안내") }
            jsonPath("$.items[2].ipAddress") { value("203.0.113.19") }
        }

        val otherFixture = createPublicReservationFixture(
            ownerEmail = "business-audit-other@example.com",
            restaurantName = "Other Business Audit Table",
            slug = "business-audit-other",
        )
        val otherCookie = loginAndExtractSessionCookie("business-audit-other@example.com")
        mockMvc.get("/api/business/audit-logs") {
            cookie(otherCookie)
            param("targetType", "reservation")
            param("targetId", reservationId.toString())
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        mockMvc.put("/api/business/reservations/$reservationId/operation-note") {
            cookie(ownerCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"ownerNote": "${"가".repeat(1001)}"}"""
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }

        assertThat(otherFixture.restaurant.id).isNotEqualTo(fixture.restaurant.id)
    }

    @Test
    fun publicReservationCancelRejectsVisitStartPassed() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-past-cancel-owner@example.com",
            restaurantName = "Reservation Past Cancel Table",
            slug = "reservation-past-cancel",
        )
        val createResult = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-past-cancel-1")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 1,
                customerName = "지난예약",
                customerPhone = "010-9000-1000",
            )
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val reservationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()
        val lookupToken = JsonPath.read<String>(createResult.response.contentAsString, "$.lookupToken")
        val pastDate = LocalDate.now(ZoneId.of("Asia/Seoul")).minusDays(1)

        jdbcTemplate.update(
            "update reservations set visit_date = ?, start_time = ?, end_time = ? where id = ?",
            java.sql.Date.valueOf(pastDate),
            java.sql.Time.valueOf("09:00:00"),
            java.sql.Time.valueOf("09:30:00"),
            reservationId,
        )

        mockMvc.post("/api/public/reservations/$reservationId/cancel") {
            header("X-Reservation-Lookup-Token", lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "늦은 취소"}"""
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("방문 시작 이후에는 고객 취소를 할 수 없습니다.") }
        }

        assertThat(reservationRepository.findById(reservationId).orElseThrow().status)
            .isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(notificationRepository.countByReservationIdAndTemplateKey(reservationId, RESERVATION_CANCELLED_TEMPLATE))
            .isEqualTo(0)
    }

    @Test
    fun publicReservationConcurrentRequestsDoNotOverbookSameSlot() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-concurrent-stock-owner@example.com",
            restaurantName = "Reservation Concurrent Stock Table",
            slug = "reservation-concurrent-stock",
            slotCapacity = 4,
        )

        val attempts = runConcurrentReservationCreates(
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-stock-1",
                body = publicReservationRequestJson(
                    fixture = fixture,
                    startTime = "11:00:00",
                    partySize = 3,
                    customerName = "동시예약1",
                    customerPhone = "010-1111-3001",
                ),
            ),
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-stock-2",
                body = publicReservationRequestJson(
                    fixture = fixture,
                    startTime = "11:00:00",
                    partySize = 3,
                    customerName = "동시예약2",
                    customerPhone = "010-1111-3002",
                ),
            ),
        )

        assertThat(attempts.map { it.status })
            .containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
        val conflict = attempts.single { it.status == HttpStatus.CONFLICT.value() }
        assertThat(JsonPath.read<String>(conflict.body, "$.code")).isEqualTo("CONFLICT")
        assertThat(JsonPath.read<String>(conflict.body, "$.message")).isEqualTo("예약 가능한 재고가 없습니다.")
        assertThat(reservationRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(1)
    }

    @Test
    fun publicReservationConcurrentRequestsDoNotDoubleBookSameTable() {
        val owner = createBusinessUser("reservation-concurrent-seat-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(
            owner,
            "Reservation Concurrent Seat Table",
            "reservation-concurrent-seat",
        )
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(4)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"hours":[{"dayOfWeek":"$targetDay","opensAt":"11:00:00","closesAt":"13:00:00"}]}"""
        }.andExpect {
            status { isOk() }
        }
        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug":"reservation-concurrent-seat","status":"PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }
        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "동시 좌석 코스",
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "13:00:00",
              "slotCapacity": 8
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong()
        val tableResult = mockMvc.post("/api/business/tables") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"동시좌석A","seatType":"HALL","minPartySize":1,"maxPartySize":4}"""
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val tableId = JsonPath.read<Int>(tableResult.response.contentAsString, "$.id").toLong()
        mockMvc.post("/api/business/reservation-products/$productId/seat-rules") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"allowedTableIds":[$tableId],"defaultDurationMinutes":120,"slotIntervalMinutes":60,"inventoryPolicy":"TABLE"}"""
        }.andExpect {
            status { isOk() }
        }
        mockMvc.post("/api/business/time-slots") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"productId":$productId,"from":"$targetDate","to":"$targetDate"}"""
        }.andExpect {
            status { isOk() }
        }

        val attempts = runConcurrentReservationCreates(
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-seat-1",
                body = """
                {
                  "restaurantId": ${restaurant.id},
                  "productId": $productId,
                  "visitDate": "$targetDate",
                  "startTime": "11:00:00",
                  "partySize": 2,
                  "customerName": "동시좌석1",
                  "customerPhone": "010-2600-1001"
                }
                """.trimIndent(),
            ),
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-seat-2",
                body = """
                {
                  "restaurantId": ${restaurant.id},
                  "productId": $productId,
                  "visitDate": "$targetDate",
                  "startTime": "11:00:00",
                  "partySize": 2,
                  "customerName": "동시좌석2",
                  "customerPhone": "010-2600-1002"
                }
                """.trimIndent(),
            ),
        )

        assertThat(attempts.map { it.status })
            .containsExactlyInAnyOrder(HttpStatus.CREATED.value(), HttpStatus.CONFLICT.value())
        val conflict = attempts.single { it.status == HttpStatus.CONFLICT.value() }
        assertThat(JsonPath.read<String>(conflict.body, "$.code")).isEqualTo("CONFLICT")
        assertThat(reservationRepository.countByRestaurantId(restaurant.id)).isEqualTo(1)
        assertThat(
            jdbcTemplate.queryForObject(
                "select count(*) from reservation_table_assignments where restaurant_table_id = ?",
                Long::class.java,
                tableId,
            ),
        ).isEqualTo(1)
    }

    @Test
    fun publicReservationConcurrentIdempotencyReturnsSingleReservation() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-concurrent-idempotency-owner@example.com",
            restaurantName = "Reservation Concurrent Idempotency Table",
            slug = "reservation-concurrent-idempotency",
            slotCapacity = 2,
        )
        val requestBody = publicReservationRequestJson(
            fixture = fixture,
            startTime = "11:00:00",
            partySize = 2,
            customerName = "멱등예약",
            customerPhone = "010-2222-3333",
        )

        val attempts = runConcurrentReservationCreates(
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-idempotency",
                body = requestBody,
            ),
            ReservationCreateCommand(
                idempotencyKey = "public-reserve-concurrent-idempotency",
                body = requestBody,
            ),
        )

        assertThat(attempts.map { it.status }).containsOnly(HttpStatus.CREATED.value())
        val reservationIds = attempts.map { JsonPath.read<Int>(it.body, "$.id") }.toSet()
        val reservationNumbers = attempts.map { JsonPath.read<String>(it.body, "$.reservationNumber") }.toSet()
        assertThat(reservationIds).hasSize(1)
        assertThat(reservationNumbers).hasSize(1)
        assertThat(reservationRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(1)
        val reservationId = reservationIds.single().toLong()
        assertThat(notificationRepository.countByReservationIdAndTemplateKey(reservationId, RESERVATION_CONFIRMED_TEMPLATE))
            .isEqualTo(1)
    }

    @Test
    fun publicReservationCreateRevalidatesAfterAvailabilityWasRead() {
        val fixture = createPublicReservationFixture(
            ownerEmail = "reservation-revalidate-owner@example.com",
            restaurantName = "Reservation Revalidate Table",
            slug = "reservation-revalidate",
        )

        mockMvc.get("/api/public/restaurants/${fixture.restaurant.id}/availability/times") {
            param("productId", fixture.productId.toString())
            param("date", fixture.targetDate.toString())
            param("partySize", "2")
        }.andExpect {
            status { isOk() }
            jsonPath("$.times.length()") { value(4) }
            jsonPath("$.times[0].startTime") { value("11:00:00") }
        }

        val product = reservationProductRepository.findById(fixture.productId).orElseThrow()
        product.visible = false
        reservationProductRepository.saveAndFlush(product)

        mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", "public-reserve-revalidate-1")
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = "11:00:00",
                partySize = 2,
                customerName = "재검증",
                customerPhone = "010-4444-5555",
            )
        }.andExpect {
            status { isNotFound() }
            jsonPath("$.code") { value("NOT_FOUND") }
        }

        assertThat(reservationRepository.countByRestaurantId(fixture.restaurant.id)).isEqualTo(0)
    }

    @Test
    fun businessRestaurantApplicationSubmitRejectsMissingRequiredFields() {
        val sessionCookie = loginAndExtractSessionCookie(
            createBusinessUser("application-missing-required@example.com").email,
        )
        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"restaurantName": "미완성 매장"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("DRAFT") }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
            jsonPath("$.message") {
                value(org.hamcrest.Matchers.containsString("승인 요청 필수 정보가 부족합니다"))
            }
        }
    }

    @Test
    fun businessRestaurantApplicationSubmitRejectsApprovedBusinessRegistrationDuplicate() {
        val approvedOwner = createBusinessUser("approved-business-owner@example.com")
        val approvedRestaurant = createRestaurantForTest(
            owner = approvedOwner,
            name = "승인 완료 매장",
        )
        restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = approvedRestaurant,
                businessRegistrationNo = "2222222222",
                status = RestaurantApplicationStatus.APPROVED,
            ),
        )

        val owner = createBusinessUser("duplicate-business-owner@example.com")
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val coverImage = createStoredFile(
            storageKey = "restaurant-cover-images/duplicate-cover.webp",
            purpose = StoredFilePurpose.RESTAURANT_COVER_IMAGE,
            visibility = StoredFileVisibility.PUBLIC,
            createdBy = owner,
        )
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/duplicate-license.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )
        val createResult = mockMvc.post("/api/business/restaurant-applications") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = fullRestaurantApplicationJson(
                businessRegistrationNo = "2222222222",
                coverImageFileId = coverImage.id,
                businessLicenseFileId = businessLicense.id,
                managerEmail = "duplicate@example.com",
            )
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        val applicationId = JsonPath.read<Int>(createResult.response.contentAsString, "$.id").toLong()

        mockMvc.post("/api/business/restaurant-applications/$applicationId/submit") {
            cookie(sessionCookie)
        }.andExpect {
            status { isConflict() }
            jsonPath("$.code") { value("CONFLICT") }
            jsonPath("$.message") { value("이미 승인된 사업자등록번호입니다.") }
        }
    }

    companion object {
        @Container
        @JvmField
        val mysql = MySQLContainer<Nothing>(DockerImageName.parse("mysql:8.4")).apply {
            withDatabaseName("restaurant_service_test")
            withUsername("restaurant_app")
            withPassword("restaurant_app")
            withCommand(
                "--character-set-server=utf8mb4",
                "--collation-server=utf8mb4_0900_ai_ci",
                "--default-time-zone=+00:00",
            )
        }

        @DynamicPropertySource
        @JvmStatic
        fun databaseProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { mysqlJdbcUrl() }
            registry.add("spring.datasource.username") { mysql.username }
            registry.add("spring.datasource.password") { mysql.password }
            registry.add("app.auth.initial-owner.enabled") { "true" }
            registry.add("app.auth.initial-owner.email") { "owner@example.com" }
            registry.add("app.auth.initial-owner.password") { "CorrectPassword123!" }
            registry.add("app.auth.initial-owner.display-name") { "Initial Owner" }
            registry.add("app.auth.session.cookie-secure") { "true" }
            registry.add("app.auth.password-reset.expose-token-in-response") { "true" }
        }

        private fun mysqlJdbcUrl(): String {
            val separator = if (mysql.jdbcUrl.contains("?")) "&" else "?"
            return "${mysql.jdbcUrl}${separator}connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true"
        }
    }

    @TestConfiguration
    class FoundationTestConfiguration {
        @Bean
        fun foundationTestController(): FoundationTestController = FoundationTestController()
    }

    @RestController
    class FoundationTestController {
        @GetMapping("/test/foundation/api-exception")
        fun apiException(): Nothing = throw ApiException(ErrorCode.BAD_REQUEST, "잘못된 요청입니다.")

        @GetMapping("/test/foundation/unhandled")
        fun unhandled(): Nothing = throw IllegalStateException("unexpected")

        @PostMapping("/test/foundation/validation")
        fun validation(
            @Valid @RequestBody request: FoundationValidationRequest,
        ): FoundationValidationRequest = request
    }

    data class FoundationValidationRequest(
        @field:NotBlank
        val name: String,
    )

    private fun loginAndExtractSessionCookie(
        email: String = "owner@example.com",
        password: String = "CorrectPassword123!",
    ): Cookie {
        val result = mockMvc.post("/api/business/auth/login") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"email": "$email", "password": "$password"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.user.email") { value(email) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("HttpOnly")) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("Secure")) }
            header { string(HttpHeaders.SET_COOKIE, org.hamcrest.Matchers.containsString("SameSite=Lax")) }
        }.andReturn()

        val setCookie = result.response.getHeader(HttpHeaders.SET_COOKIE)
            ?: error("Set-Cookie header is missing.")
        val token = setCookie
            .substringAfter("BUSINESS_SESSION=")
            .substringBefore(";")
        return Cookie("BUSINESS_SESSION", token)
    }

    private fun jpegBytes(): ByteArray =
        byteArrayOf(0xff.toByte(), 0xd8.toByte(), 0xff.toByte(), 0xe0.toByte()) +
            "test-jpeg".encodeToByteArray()

    private fun pdfBytes(): ByteArray =
        "%PDF-1.7\nrestaurant-service-test".encodeToByteArray()

    private fun createBusinessUser(
        email: String,
        role: BusinessUserRole = BusinessUserRole.OWNER,
    ): BusinessUserEntity =
        userRepository.saveAndFlush(
            BusinessUserEntity(
                email = email,
                passwordHash = passwordEncoder.encode("CorrectPassword123!")
                    ?: error("Password encoder returned null."),
                displayName = email.substringBefore("@"),
                role = role,
                status = BusinessUserStatus.ACTIVE,
            ),
        )

    private fun createRestaurantForTest(
        owner: BusinessUserEntity,
        name: String,
        slug: String? = null,
    ): RestaurantEntity =
        restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = name,
                slug = slug,
                phone = "02-9999-0000",
                addressLine1 = "서울시 테스트구 1",
                cuisineTypesJson = """["dining"]""",
            ),
        )

    private fun createStoredFile(
        storageKey: String,
        purpose: StoredFilePurpose,
        visibility: StoredFileVisibility,
        createdBy: BusinessUserEntity,
    ): StoredFileEntity =
        storedFileRepository.saveAndFlush(
            StoredFileEntity(
                storageKey = storageKey,
                originalFilename = storageKey.substringAfterLast('/'),
                contentType = if (purpose == StoredFilePurpose.BUSINESS_LICENSE) "application/pdf" else "image/webp",
                byteSize = 1024,
                checksumSha256 = storageKey.hashCode().toUInt().toString(16).padStart(64, '0').takeLast(64),
                visibility = visibility,
                purpose = purpose,
                createdBy = createdBy,
            ),
        )

    private fun createSubmittedRestaurantApplication(
        owner: BusinessUserEntity,
        businessRegistrationNo: String,
        restaurantName: String,
    ): RestaurantApplicationEntity {
        val businessLicense = createStoredFile(
            storageKey = "business-licenses/$businessRegistrationNo.pdf",
            purpose = StoredFilePurpose.BUSINESS_LICENSE,
            visibility = StoredFileVisibility.PRIVATE,
            createdBy = owner,
        )
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = restaurantName,
                phone = "02-7777-0000",
                addressLine1 = "서울시 테스트구 승인로 1",
                cuisineTypesJson = """["dining"]""",
                status = RestaurantStatus.APPROVAL_REQUESTED,
            ),
        )
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name
        userRepository.saveAndFlush(owner)

        return restaurantApplicationRepository.saveAndFlush(
            RestaurantApplicationEntity(
                restaurant = restaurant,
                businessRegistrationNo = businessRegistrationNo,
                businessName = restaurantName,
                representativeName = "대표자",
                businessAddress = "서울시 테스트구 승인로 1",
                businessLicenseFile = businessLicense,
                managerName = "매니저",
                managerPhone = "010-7777-0000",
                managerEmail = "${businessRegistrationNo}@example.com",
                contactVerifiedAt = Instant.now(),
                status = RestaurantApplicationStatus.SUBMITTED,
                submittedAt = Instant.now(),
            ),
        )
    }

    private fun createApprovedRestaurantForSettings(
        owner: BusinessUserEntity,
        restaurantName: String,
        slug: String? = null,
    ): RestaurantEntity {
        val restaurant = restaurantRepository.saveAndFlush(
            RestaurantEntity(
                owner = owner,
                name = restaurantName,
                slug = slug,
                description = "승인된 매장",
                phone = "02-7777-1000",
                addressLine1 = "서울시 공개구 1",
                cuisineTypesJson = """["dining"]""",
                status = RestaurantStatus.APPROVED,
                approvedAt = Instant.now(),
            ),
        )
        owner.linkedRestaurantId = restaurant.id
        owner.linkedRestaurantStatus = restaurant.status.name
        userRepository.saveAndFlush(owner)
        if (slug != null) {
            reservationPageRepository.saveAndFlush(
                ReservationPageEntity(
                    restaurant = restaurant,
                    slug = slug,
                    status = ReservationPageStatus.PRIVATE,
                ),
            )
        }
        return restaurant
    }

    private fun createPublicReservationFixture(
        ownerEmail: String,
        restaurantName: String,
        slug: String,
        slotCapacity: Int = 4,
    ): PublicReservationFixture {
        val owner = createBusinessUser(ownerEmail)
        val sessionCookie = loginAndExtractSessionCookie(owner.email)
        val restaurant = createApprovedRestaurantForSettings(owner, restaurantName, slug)
        val targetDate = LocalDate.now(ZoneId.of("Asia/Seoul")).plusDays(3)
        val targetDay = targetDate.dayOfWeek.name

        mockMvc.put("/api/business/restaurants/${restaurant.id}/business-hours") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "hours": [
                {"dayOfWeek": "$targetDay", "opensAt": "11:00:00", "closesAt": "13:00:00"}
              ]
            }
            """.trimIndent()
        }.andExpect {
            status { isOk() }
        }

        mockMvc.put("/api/business/restaurants/${restaurant.id}/reservation-page") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """{"slug": "$slug", "status": "PUBLIC"}"""
        }.andExpect {
            status { isOk() }
        }

        val productResult = mockMvc.post("/api/business/reservation-products") {
            cookie(sessionCookie)
            contentType = MediaType.APPLICATION_JSON
            content = """
            {
              "name": "공개 예약 코스",
              "priceAmount": 50000,
              "visible": true,
              "minPartySize": 1,
              "maxPartySize": 4,
              "availableDays": ["$targetDay"],
              "availableStartTime": "11:00:00",
              "availableEndTime": "13:00:00",
              "slotCapacity": $slotCapacity
            }
            """.trimIndent()
        }.andExpect {
            status { isCreated() }
        }.andReturn()

        return PublicReservationFixture(
            restaurant = restaurant,
            productId = JsonPath.read<Int>(productResult.response.contentAsString, "$.id").toLong(),
            targetDate = targetDate,
        )
    }

    private fun publicReservationRequestJson(
        fixture: PublicReservationFixture,
        startTime: String,
        partySize: Int,
        customerName: String,
        customerPhone: String,
        customerRequest: String? = null,
    ): String {
        val customerRequestLine = customerRequest
            ?.let { """, "customerRequest": "$it"""" }
            .orEmpty()
        return """
        {
          "restaurantId": ${fixture.restaurant.id},
          "productId": ${fixture.productId},
          "visitDate": "${fixture.targetDate}",
          "startTime": "$startTime",
          "partySize": $partySize,
          "customerName": "$customerName",
          "customerPhone": "$customerPhone"$customerRequestLine
        }
        """.trimIndent()
    }

    private fun createPublicReservationForFixture(
        fixture: PublicReservationFixture,
        idempotencyKey: String,
        startTime: String,
        partySize: Int,
        customerName: String,
        customerPhone: String,
        customerRequest: String? = null,
    ): PublicReservationCreated {
        val result = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", idempotencyKey)
            contentType = MediaType.APPLICATION_JSON
            content = publicReservationRequestJson(
                fixture = fixture,
                startTime = startTime,
                partySize = partySize,
                customerName = customerName,
                customerPhone = customerPhone,
                customerRequest = customerRequest,
            )
        }.andExpect {
            status { isCreated() }
        }.andReturn()
        return PublicReservationCreated(
            id = JsonPath.read<Int>(result.response.contentAsString, "$.id").toLong(),
            reservationNumber = JsonPath.read<String>(result.response.contentAsString, "$.reservationNumber"),
            lookupToken = JsonPath.read<String>(result.response.contentAsString, "$.lookupToken"),
        )
    }

    private fun configureProductPaymentPolicy(
        productId: Long,
        type: ReservationProductPaymentPolicyType,
        amount: Long? = null,
    ) {
        val product = reservationProductRepository.findById(productId).orElseThrow()
        product.paymentPolicyType = type
        product.paymentAmount = amount
        reservationProductRepository.saveAndFlush(product)
    }

    private fun createReservationAndStartPaymentForWebhook(
        fixture: PublicReservationFixture,
        reservationKey: String,
        paymentKey: String,
        startTime: String,
    ): StartedPaymentFixture {
        val reservation = createPublicReservationForFixture(
            fixture = fixture,
            idempotencyKey = reservationKey,
            startTime = startTime,
            partySize = 1,
            customerName = "웹훅결제",
            customerPhone = "010-${reservationKey.takeLast(4)}-2121",
        )
        val result = mockMvc.post("/api/public/reservations/${reservation.id}/payments") {
            header("X-Reservation-Lookup-Token", reservation.lookupToken)
            header("Idempotency-Key", paymentKey)
            contentType = MediaType.APPLICATION_JSON
            content = """{"paymentMode": "deposit", "returnUrl": "https://service.example.com/payment-return"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.status") { value("PENDING") }
        }.andReturn()
        val paymentId = JsonPath.read<Int>(result.response.contentAsString, "$.paymentId").toLong()
        return StartedPaymentFixture(
            reservation = reservation,
            payment = paymentRepository.findById(paymentId).orElseThrow(),
        )
    }

    private fun createFailedCustomerRefund(
        fixture: PublicReservationFixture,
        reservationKey: String,
        paymentKey: String,
        startTime: String,
    ): RefundEntity {
        val started = createReservationAndStartPaymentForWebhook(
            fixture = fixture,
            reservationKey = reservationKey,
            paymentKey = paymentKey,
            startTime = startTime,
        )
        postPgWebhook(
            eventId = "evt-$paymentKey-paid",
            eventType = "payment.succeeded",
            pgPaymentId = started.payment.pgPaymentId!!,
            amount = 20_000,
            expectedPaymentStatus = "PAID",
        )
        val payment = paymentRepository.findById(started.payment.id).orElseThrow()
        payment.pgPaymentId = "fake-payment-refund-fail-${payment.id}"
        paymentRepository.saveAndFlush(payment)

        mockMvc.post("/api/public/reservations/${started.reservation.id}/cancel") {
            header("X-Reservation-Lookup-Token", started.reservation.lookupToken)
            contentType = MediaType.APPLICATION_JSON
            content = """{"reason": "환불 실패 테스트"}"""
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED_BY_CUSTOMER") }
            jsonPath("$.refund.status") { value("FAILED") }
            jsonPath("$.refund.paymentStatus") { value("REFUND_FAILED") }
        }
        return refundRepository.findByReservationIdOrderByCreatedAtAsc(started.reservation.id).single()
    }

    private fun postPgWebhook(
        eventId: String,
        eventType: String,
        pgPaymentId: String,
        amount: Long,
        expectedPaymentStatus: String,
    ) {
        mockMvc.post("/api/pg/webhooks") {
            contentType = MediaType.APPLICATION_JSON
            content = pgWebhookJson(eventId, eventType, pgPaymentId, amount)
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("PROCESSED") }
            jsonPath("$.paymentStatus") { value(expectedPaymentStatus) }
            jsonPath("$.reservationPaymentStatus") { value(expectedPaymentStatus) }
        }
    }

    private fun pgWebhookJson(
        eventId: String,
        eventType: String,
        pgPaymentId: String,
        amount: Long,
        signature: String = "fake-signature",
    ): String =
        """
        {
          "providerKey": "fake",
          "eventId": "$eventId",
          "eventType": "$eventType",
          "pgPaymentId": "$pgPaymentId",
          "amount": $amount,
          "currency": "KRW",
          "occurredAt": "2026-05-15T12:00:00+09:00",
          "signature": "$signature"
        }
        """.trimIndent()

    private fun assertPaymentAndReservationStatus(
        started: StartedPaymentFixture,
        status: PaymentStatus,
        paymentRequired: Boolean,
    ) {
        val payment = paymentRepository.findById(started.payment.id).orElseThrow()
        assertThat(payment.status).isEqualTo(status)
        val reservation = reservationRepository.findById(started.reservation.id).orElseThrow()
        assertThat(reservation.status).isEqualTo(ReservationStatus.CONFIRMED)
        assertThat(reservation.paymentStatus).isEqualTo(status)
        assertThat(reservation.paymentRequired).isEqualTo(paymentRequired)
    }

    private data class PublicReservationFixture(
        val restaurant: RestaurantEntity,
        val productId: Long,
        val targetDate: LocalDate,
    )

    private data class PublicReservationCreated(
        val id: Long,
        val reservationNumber: String,
        val lookupToken: String,
    )

    private data class StartedPaymentFixture(
        val reservation: PublicReservationCreated,
        val payment: PaymentEntity,
    )

    private fun runConcurrentReservationCreates(
        vararg commands: ReservationCreateCommand,
    ): List<ReservationCreateAttempt> {
        val executor = Executors.newFixedThreadPool(commands.size)
        val ready = CountDownLatch(commands.size)
        val start = CountDownLatch(1)
        return try {
            val futures = commands.map { command ->
                executor.submit<ReservationCreateAttempt> {
                    ready.countDown()
                    check(start.await(5, TimeUnit.SECONDS))
                    postPublicReservation(command)
                }
            }
            check(ready.await(5, TimeUnit.SECONDS))
            start.countDown()
            futures.map { it.get(10, TimeUnit.SECONDS) }
        } finally {
            executor.shutdownNow()
        }
    }

    private fun postPublicReservation(command: ReservationCreateCommand): ReservationCreateAttempt {
        val result = mockMvc.post("/api/public/reservations") {
            header("Idempotency-Key", command.idempotencyKey)
            contentType = MediaType.APPLICATION_JSON
            content = command.body
        }.andReturn()
        return ReservationCreateAttempt(
            status = result.response.status,
            body = result.response.contentAsString,
        )
    }

    private data class ReservationCreateCommand(
        val idempotencyKey: String,
        val body: String,
    )

    private data class ReservationCreateAttempt(
        val status: Int,
        val body: String,
    )

    private fun fullRestaurantApplicationJson(
        businessRegistrationNo: String,
        coverImageFileId: Long,
        businessLicenseFileId: Long,
        restaurantDescription: String = "예약제 다이닝",
        managerEmail: String,
    ): String =
        """
        {
          "restaurantName": "스시온",
          "restaurantDescription": "$restaurantDescription",
          "restaurantPhone": "02-555-1000",
          "addressLine1": "서울시 강남구 선릉로 10",
          "addressLine2": "3층",
          "postalCode": "06100",
          "cuisineTypes": ["sushi", "omakase"],
          "coverImageFileId": $coverImageFileId,
          "businessRegistrationNo": "$businessRegistrationNo",
          "businessName": "스시온",
          "representativeName": "김대표",
          "businessAddress": "서울시 강남구 선릉로 10",
          "businessLicenseFileId": $businessLicenseFileId,
          "managerName": "김매니저",
          "managerPhone": "010-3333-4444",
          "managerEmail": "$managerEmail",
          "contactVerified": true
        }
        """.trimIndent()
}
