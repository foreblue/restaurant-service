# Business FE Test Data

이 문서는 사업자 FE QA와 E2E에서 사용하는 fixture 기준이다. 현재 Playwright E2E는 `apps/business-web/src/shared/api/businessApiClient.ts`의 mock adapter와 브라우저 `localStorage`를 사용한다.

## Accounts

| Name           | Purpose                  | Setup                                                          | Cleanup                                           | Notes                                                                    |
| -------------- | ------------------------ | -------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| business-owner | 사업자 로그인 happy path | 이메일 `owner@example.com`, 비밀번호는 공백이 아닌 임의 문자열 | Playwright 새 context 또는 `localStorage.clear()` | mock adapter는 `invalid@example.com` 외 이메일을 활성 오너로 로그인 처리 |
| invalid-owner  | 로그인 실패              | 이메일 `invalid@example.com`, 임의 비밀번호                    | 없음                                              | 인증 실패 문구 검증용                                                    |

## Restaurant And Application

| Name                   | Purpose               | Setup                                                                                  | Cleanup                | Notes                                                            |
| ---------------------- | --------------------- | -------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| cheongdam-main         | 승인된 단일 매장 운영 | mock adapter 기본 매장 `청담 본점`, slug `cheongdam-main`                              | `localStorage.clear()` | business FE MVP는 계정당 매장 1개 기준                           |
| onboarding-application | 입점 신청 작성/제출   | E2E에서 매장명 `청담 테스트 키친`, 사업자등록번호 `1234567890`, 담당자 `박매니저` 입력 | 새 browser context     | 파일 업로드는 in-memory `business-license.pdf`, `cover.png` 사용 |
| rejected-application   | 반려 사유 표시        | App.test의 injected `BusinessApiClient` fixture 사용                                   | 테스트 종료            | full browser mock adapter에는 반려 상태 seed가 별도 필요         |

## Reservation Products

| Name            | Purpose                                 | Setup                                       | Cleanup                | Notes                                               |
| --------------- | --------------------------------------- | ------------------------------------------- | ---------------------- | --------------------------------------------------- |
| dinner-course   | 예약 운영, 수동 예약, 결제/환불 fixture | 기본 상품 `디너 코스`, id `6001`, 수용량 8  | `localStorage.clear()` | 예약금/선결제/보증 정책 TC의 기본 대상              |
| lunch-course    | 필터와 노쇼 처리 fixture                | 기본 상품 `런치 코스`, id `6002`, 수용량 10 | `localStorage.clear()` | 상품 필터, 시간대/인원 테스트 대상                  |
| created-product | 상품 생성/수정 TC                       | App.test 또는 후속 E2E에서 입력             | `localStorage.clear()` | full browser 상품 생성 E2E 추가 시 고유 상품명 사용 |

## Reservations

| Name                     | Purpose                         | Setup                                                                  | Cleanup                | Notes                                       |
| ------------------------ | ------------------------------- | ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| rsv-confirmed-kim        | 예약 상세/메모/변경/방문 완료   | 기본 예약 `RSV-7001`, 고객 `김예약`, 상태 확정                         | `localStorage.clear()` | 고객 전화번호 원문, 요청사항, VIP 표시 검증 |
| rsv-modified-lee         | 상품 필터와 노쇼 처리           | 기본 예약 `RSV-7002`, 고객 `이수정`, 상태 변경                         | `localStorage.clear()` | 강제 노쇼 TC에 사용                         |
| rsv-cancelled-park       | 취소 예약 포함 필터와 환불 상태 | 기본 예약 `RSV-7003`, 고객 `박취소`, 고객 취소                         | `localStorage.clear()` | 포함 전 빈 상태, 포함 후 환불 대기 표시     |
| manual-phone-reservation | 수동 예약 등록                  | E2E에서 고객 `한전화`, 전화 `010-7777-1212`, 시간 `12:30`, 인원 3 입력 | 새 browser context     | TC BIZ-RES-008                              |

## Payments And Refunds

| Name             | Purpose             | Setup                                          | Cleanup                | Notes                          |
| ---------------- | ------------------- | ---------------------------------------------- | ---------------------- | ------------------------------ |
| paid-deposit     | 결제 완료 상태      | 기본 결제 `PAY-9101`, 예약 `RSV-7001`          | `localStorage.clear()` | 예약금/환불 요약 테스트에 사용 |
| refund-pending   | 환불 처리중 상태    | 기본 환불 `REF-9201`, 예약 `RSV-7003`          | `localStorage.clear()` | 매장 취소/환불 대기 문구 검증  |
| refund-succeeded | 환불 완료 상태      | 기본 환불 `REF-9202`                           | `localStorage.clear()` | 환불 목록 기본 상태            |
| refund-failed    | 실패 환불 운영 안내 | 기본 환불 `REF-9203`, 실패 사유 `PG 승인 거절` | `localStorage.clear()` | TC BIZ-PAY-002, BIZ-PAY-003    |

## Inventory

| Name                  | Purpose              | Setup                                                  | Cleanup                | Notes                  |
| --------------------- | -------------------- | ------------------------------------------------------ | ---------------------- | ---------------------- |
| hall-table-a1         | 테이블 목록/비활성화 | 기본 테이블 `홀 A1`, 좌석 유형 홀                      | `localStorage.clear()` | 테이블 관리 TC 대상    |
| room-table-1          | 룸 좌석 연결         | 기본 테이블 `룸 1`, 좌석 유형 룸                       | `localStorage.clear()` | 상품 좌석 연결 TC 대상 |
| temporary-closed-slot | 임시 마감/해제       | E2E 또는 App.test에서 날짜/상품/좌석/시간 선택 후 마감 | `localStorage.clear()` | 시간대 재고 TC 대상    |

## Customers

| Name                  | Purpose                    | Setup                             | Cleanup                | Notes                               |
| --------------------- | -------------------------- | --------------------------------- | ---------------------- | ----------------------------------- |
| customer-kim          | VIP/요청사항/알레르기 확인 | 기본 고객 `김예약`, id `8001`     | `localStorage.clear()` | 예약 상세와 고객 상세 모두에서 사용 |
| customer-oh           | 주의 고객/노쇼 이력        | 기본 고객 `오민준`, id `8005`     | `localStorage.clear()` | VIP/주의/차단 범위 TC 대상          |
| duplicate-email-group | 중복 고객 병합             | 기본 중복 후보 ids `8001`, `8002` | `localStorage.clear()` | TC BIZ-CUST-005                     |

## Analytics

| Name                       | Purpose                | Setup                                              | Cleanup                | Notes                                    |
| -------------------------- | ---------------------- | -------------------------------------------------- | ---------------------- | ---------------------------------------- |
| analytics-default-period   | 통계 요약과 상품 성과  | 현재 날짜 기준 최근 30일 mock 예약/결제/환불       | `localStorage.clear()` | 날짜는 실행일 기준으로 계산됨            |
| analytics-export-product   | CSV 내보내기           | CSV 타입 `product_performance` 선택                | `localStorage.clear()` | 개인정보 마스킹 안내와 파일명/행 수 검증 |
| analytics-export-time-slot | 시간대 예약률 내보내기 | CSV 타입 `time_slot_reservation_rate`, 기준일 선택 | `localStorage.clear()` | 정산 자동화 리포트 아님 안내 포함        |

## Data Isolation

| Rule              | Detail                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Browser context   | Playwright는 테스트마다 새 context를 사용해 `localStorage` 기반 mock state를 격리한다.                                         |
| Persistent data   | 현재 E2E는 실제 API/DB를 호출하지 않으므로 별도 DB cleanup이 없다.                                                             |
| File upload       | 테스트 파일은 `Buffer` 기반 in-memory 파일로 생성한다. 실제 파일 저장소 credential을 사용하지 않는다.                          |
| Future API setup  | 테스트 백엔드 연결 시 테스트용 owner, restaurant, products, reservations를 seed하고 테스트 종료 후 restaurant 단위로 삭제한다. |
| Production safety | 운영 credential 또는 운영 매장 데이터는 E2E에서 사용하지 않는다.                                                               |

# Customer FE Test Data

이 섹션은 `apps/customer-web` Playwright E2E와 Vitest에서 사용하는 fixture 기준이다. 현재 full browser E2E는 `apps/customer-web/e2e/mock-api.mjs`의 로컬 mock public API를 사용하고, 테스트마다 `POST /__mock/reset`으로 in-memory 상태를 초기화한다.

## Customer Public API Mock

| Name                           | Purpose                     | Setup                                                             | Cleanup              | Notes                                               |
| ------------------------------ | --------------------------- | ----------------------------------------------------------------- | -------------------- | --------------------------------------------------- |
| customer-mock-api              | public API fixture server   | Playwright `webServer`가 `node e2e/mock-api.mjs --port 4181` 실행 | Playwright lifecycle | 운영 API/DB credential 미사용                       |
| customer-next-dev              | customer-web browser target | Playwright `webServer`가 Next dev `127.0.0.1:4178` 실행           | Playwright lifecycle | `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4181`    |
| customer-default-scenario      | 기본 예약 happy path        | `POST /__mock/reset`                                              | 테스트마다 reset     | 공개 매장, 무료 상품, 예약금 상품, seeded 예약 포함 |
| customer-long-content-scenario | 모바일 visual QA            | `POST /__mock/scenario` body `{ "scenario": "long-content" }`     | 다음 reset           | 긴 매장명/상품명/주소 overflow 검증                 |

## Customer Restaurants And Products

| Name                     | Purpose                | Setup                                                      | Cleanup    | Notes                         |
| ------------------------ | ---------------------- | ---------------------------------------------------------- | ---------- | ----------------------------- |
| customer-restaurant-main | 공개 예약 페이지       | id `101`, slug `cheongdam-main`, 상태 `PUBLIC`             | mock reset | TC CUST-PAGE-001              |
| customer-restaurant-long | 긴 콘텐츠 visual smoke | long-content scenario의 긴 이름/주소/소개                  | mock reset | TC CUST-QA-001                |
| customer-free-dinner     | 무료 예약 생성         | product id `10`, `paymentPolicyType=FREE`, 좌석 홀/룸      | mock reset | TC CUST-RES-001               |
| customer-deposit-course  | 예약금 결제 성공/실패  | product id `20`, `paymentPolicyType=DEPOSIT`, amount 10000 | mock reset | TC CUST-PAY-001, CUST-PAY-002 |
| customer-available-slot  | 예약 가능 시간         | date `2026-05-18`, `18:00`, remainingCapacity `4`          | mock reset | TC CUST-SELECT-001            |
| customer-blocked-slot    | 임시 마감 시간         | date `2026-05-18`, `20:00`, `available=false`, `BLOCKED`   | mock reset | TC CUST-SELECT-002            |

## Customer Reservations And Payments

| Name                         | Purpose                  | Setup                                                                           | Cleanup    | Notes                                      |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------- | ---------- | ------------------------------------------ |
| customer-created-reservation | 예약 생성 happy path     | E2E에서 고객 `홍길동`, 전화 `01012341234`, 선택 입력 포함                       | mock reset | TC CUST-RES-001, CUST-RES-002              |
| customer-lookup-reservation  | 예약 조회/취소 fixture   | seeded reservation id `301`, number `RSV-LOOKUP-0001`, token `lookup-token-301` | mock reset | TC CUST-LOOKUP-001, CUST-CANCEL-001        |
| customer-payment-success     | 예약금 결제 성공 fixture | 고객명 `결제성공`으로 예약 후 `/payments` 호출                                  | mock reset | mock API가 `PAID` 반환                     |
| customer-payment-failure     | 예약금 결제 실패 fixture | 고객명 `결제실패`로 예약 후 `/payments` 호출                                    | mock reset | mock API가 `FAILED` 반환, 재시도/포기 검증 |
| customer-refund-preview      | 환불 예상 표시           | cancelable 예약 상세에서 `/refund-preview` 조회                                 | mock reset | 온라인 결제 없음이면 `환불 예정 없음`      |

## Customer QA Artifacts And Isolation

| Rule                   | Detail                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| Browser isolation      | Playwright는 테스트 worker context와 mock reset으로 예약 상태를 격리한다. |
| Artifact location      | `apps/customer-web/test-results/`, `apps/customer-web/playwright-report/` |
| Visual attachment      | `CUST-QA-001`은 `customer-mobile-long-content` screenshot을 첨부한다.     |
| Trace/video/screenshot | Playwright config가 실패 시 trace, screenshot, video를 보존한다.          |
| Production safety      | 운영 매장/고객/결제 credential은 사용하지 않는다.                         |

# Backend API Test Data

이 섹션은 `apps/api`의 JUnit/MockMvc/Testcontainers 회귀 테스트에서 사용하는 fixture 기준이다. 테스트는 운영 credential을 사용하지 않고, 매 테스트가 고유 이메일/slug/idempotency key를 사용해 MySQL container 내부에서 격리한다.

## API Accounts

| Name                | Purpose                 | Setup                                             | Cleanup                  | Notes                                                                |
| ------------------- | ----------------------- | ------------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| api-seeded-owner    | 초기 owner seed 검증    | test profile `owner@example.com`                  | container 재생성         | 비밀번호 hash만 검증하고 원문 credential은 테스트에 의존하지 않는다. |
| api-business-owner  | business API happy path | `createBusinessUser()` helper로 ACTIVE OWNER 생성 | Testcontainers lifecycle | 이메일은 테스트별 고유 prefix 사용                                   |
| api-admin-user      | admin API 권한 검증     | `createBusinessUser(role = ADMIN)` helper         | Testcontainers lifecycle | 일반 owner와 admin session을 분리해 negative case 포함               |
| api-suspended-owner | 로그인 거부             | `BusinessUserStatus.SUSPENDED` owner 생성         | Testcontainers lifecycle | `suspendedLoginReturnsAccessDenied`에서 사용                         |

## API Restaurant And Onboarding

| Name                    | Purpose                     | Setup                                                                           | Cleanup                  | Notes                                                     |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| api-application-draft   | 입점 신청 CRUD              | owner session, `fullRestaurantApplicationJson()`                                | Testcontainers lifecycle | 필수 입력, 제출, 반려 후 재제출 TC의 기본 payload         |
| api-license-pdf         | 사업자등록증 업로드         | `MockMultipartFile` + `pdfBytes()`                                              | Testcontainers lifecycle | 실제 외부 file storage credential 미사용                  |
| api-cover-image         | 대표 이미지 업로드          | `MockMultipartFile` + `jpegBytes()`                                             | Testcontainers lifecycle | `LocalFileStorage` test bean으로 in-memory 저장           |
| api-approved-restaurant | 공개 예약/상품/예약 fixture | `createApprovedRestaurantForSettings()` 또는 `createPublicReservationFixture()` | Testcontainers lifecycle | slug, owner email, restaurant name은 테스트별 고유값 사용 |

## API Reservation Products And Inventory

| Name                | Purpose                       | Setup                                              | Cleanup                  | Notes                                                   |
| ------------------- | ----------------------------- | -------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| api-visible-product | public 상품/availability/예약 | 승인 매장에 ACTIVE/VISIBLE 상품 생성               | Testcontainers lifecycle | 예약금/선결제/보증/현장결제 정책 TC에서 정책별로 재설정 |
| api-hidden-product  | public 노출 제외              | HIDDEN 또는 PRIVATE 상품 생성                      | Testcontainers lifecycle | public product/availability negative case               |
| api-hall-table      | 좌석 재고와 중복 예약 방지    | owner 매장 table과 seat rule 생성                  | Testcontainers lifecycle | 동일 시간대 동시 예약과 table overlap TC에 사용         |
| api-time-slot       | availability와 임시 마감/재개 | business hours 기반 time slot 생성 후 close/reopen | Testcontainers lifecycle | 날짜는 `LocalDate.now(ZoneId.of(\"Asia/Seoul\"))` 기준  |

## API Reservations

| Name                       | Purpose                   | Setup                                                                       | Cleanup                  | Notes                                                                |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| api-public-reservation     | 고객 예약 생성 happy path | `publicReservationRequestJson()` 또는 `createPublicReservationForFixture()` | Testcontainers lifecycle | reservation number, lookup token, customer link 검증                 |
| api-idempotent-reservation | idempotency 재시도        | 동일 `idempotencyKey`로 public create 반복                                  | Testcontainers lifecycle | mismatch 요청은 conflict/validation negative case로 분리             |
| api-manual-reservation     | 사업자 수동 예약          | owner session, product/date/time/customer payload                           | Testcontainers lifecycle | `ReservationSource.MANUAL`과 audit log 검증                          |
| api-concurrent-slot        | 동시성/중복 예약 방지     | `runConcurrentReservationCreates()` helper                                  | Testcontainers lifecycle | 성공 1건과 conflict 다수를 기대하며 Docker CPU 상태에 민감할 수 있음 |

## API Payments, Refunds, Notifications

| Name                | Purpose                         | Setup                                                           | Cleanup                  | Notes                                                    |
| ------------------- | ------------------------------- | --------------------------------------------------------------- | ------------------------ | -------------------------------------------------------- |
| api-deposit-payment | 예약금 결제 시작/완료           | 결제 정책 상품 예약 후 `/payments` 호출                         | Testcontainers lifecycle | fake payment gateway action URL 사용                     |
| api-guarantee-card  | 카드 보증 시작                  | `CARD_GUARANTEE` 정책 상품 예약 후 `/guarantee` 호출            | Testcontainers lifecycle | 실제 PG SDK credential 미사용                            |
| api-pg-webhook      | webhook idempotency/status 전이 | `createReservationAndStartPaymentForWebhook()` + fake signature | Testcontainers lifecycle | 중복 eventId, amount mismatch, invalid signature 포함    |
| api-refund-request  | 환불 preview/request/retry      | 취소 정책 snapshot이 있는 결제 완료 예약                        | Testcontainers lifecycle | fake refund gateway로 실패/성공/manual resolve 상태 검증 |
| api-notification    | 알림 발송과 실패 재시도         | 예약/결제/환불 이벤트 또는 notification entity seed             | Testcontainers lifecycle | fake sender adapter로 외부 provider 호출 없이 검증       |

## API Customers And Analytics

| Name                    | Purpose                | Setup                                                | Cleanup                  | Notes                                             |
| ----------------------- | ---------------------- | ---------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| api-crm-customer        | 고객 프로필/메모/flag  | 예약 생성 또는 business customer API로 customer 생성 | Testcontainers lifecycle | VIP/주의/메모/예약 이력 TC에서 재사용             |
| api-duplicate-customer  | 중복 고객 병합         | 같은 phone/email group의 customer 2건 이상 seed      | Testcontainers lifecycle | merge 후 note/reservation 이동 검증               |
| api-anonymized-customer | 개인정보 익명화        | customer profile과 reservations seed                 | Testcontainers lifecycle | 원문 phone/email/name이 제거되고 예약 이력은 유지 |
| api-analytics-period    | 운영 통계와 CSV export | 완료/취소/노쇼 예약, 결제, 환불 fixture              | Testcontainers lifecycle | period는 테스트 실행일 기준 상대 날짜로 구성      |

## API Artifact And Cleanup Rules

| Rule                   | Detail                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Database isolation     | Testcontainers MySQL container를 테스트 JVM에서 관리하고 fixture 값은 테스트별 고유 prefix를 사용한다.                                     |
| Transaction boundaries | API 호출은 실제 HTTP/MockMvc request transaction을 통과하므로 repository 직접 rollback에 의존하지 않는다.                                  |
| File storage           | test bean의 `FileStorage`는 로컬/in-memory 성격의 fixture이며 외부 bucket credential을 사용하지 않는다.                                    |
| Idempotency keys       | 예약/결제/webhook key는 TC별 고유 문자열을 사용하고 재시도 검증에서만 동일 key를 재사용한다.                                               |
| Artifacts              | 실패 시 `apps/api/build/test-results/test/`, `apps/api/build/reports/tests/test/index.html`, Gradle stacktrace를 수집한다.                 |
| Docker prerequisite    | Docker daemon이 필요하다. Docker가 없으면 Testcontainers 조건에 따라 skip될 수 있으므로 CI gate에서는 Docker available 상태를 전제로 한다. |
