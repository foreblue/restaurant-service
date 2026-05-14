# BE 개발 계획

## 1. 개요

BE는 사용자 FE와 사업자 FE가 사용하는 API, 예약 가능 여부 계산, 예약 상태 전이, 결제/환불, 알림, 고객 관리, 운영 통계, 플랫폼 운영 기능을 제공하는 모듈이다.

기술 기준은 `apps/api`의 Kotlin, Java 21 LTS, Spring Boot 4.x, Spring MVC REST API, Spring Security, Spring Data JPA, MySQL 8.4 LTS, Flyway, springdoc-openapi, Testcontainers를 따른다.

초기 구조는 모듈러 모놀리스로 시작한다. 예약, 결제, 알림, 고객 관리가 같은 트랜잭션 흐름 안에서 강하게 연결되므로 MVP 단계에서는 마이크로서비스로 분리하지 않는다.

## 2. 개발 목표

- OpenAPI 3.1 기반 API 계약을 제공하고 FE client 생성을 지원한다.
- 매장 입점, 예약 생성, 예약 운영, 결제/환불, 알림을 일관된 도메인 규칙으로 처리한다.
- 예약 가능 여부와 예약 생성은 동시성 문제를 고려해 트랜잭션과 DB 제약을 함께 사용한다.
- 외부 PG, 알림, 파일 저장소는 인터페이스 뒤로 격리한다.
- 예약/결제/환불/승인/설정 변경은 감사 로그를 남긴다.

## 3. 패키지 구성

```text
apps/api/src/main/kotlin/com/example/restaurant/
  auth/
  restaurant/
  restaurantapplication/
  reservation/
  reservationproduct/
  availability/
  customer/
  payment/
  refund/
  notification/
  statistics/
  admin/
  audit/
  common/
```

| 패키지 | 책임 |
| --- | --- |
| `auth` | 사업자 인증, 고객 예약 조회 인증, 권한 검증 |
| `restaurant` | 매장 정보, 운영 상태 |
| `restaurantapplication` | 입점 신청, 사업자 정보, 승인/반려 |
| `reservation` | 예약 생성, 변경, 취소, 상태 전이 |
| `reservationproduct` | 예약 상품, 예약금, 취소 정책 |
| `availability` | 영업시간, 휴무, 타임슬롯, 재고 계산 |
| `customer` | 고객 프로필, 방문/노쇼 이력, 메모 |
| `payment` | 예약금 결제, 전액 선결제, 카드 보증 |
| `refund` | 환불 요청, 환불 결과 저장 |
| `notification` | SMS, 카카오 알림톡, 이메일 발송 |
| `statistics` | 예약/방문/취소/노쇼/매출 집계 |
| `admin` | 플랫폼 운영 API, 승인/정지/분쟁 조회 |
| `audit` | 주요 변경 이력 |
| `common` | 공통 예외, 응답, 시간, idempotency |

## 4. 단계별 개발 계획

### 4.1 Step 0. 백엔드 기반 구축

목표: API 서버, DB, 마이그레이션, 테스트, OpenAPI 생성을 위한 기반을 만든다.

작업 범위:

- Spring Boot 프로젝트 생성
- Gradle Kotlin DSL 설정
- Kotlin compiler 옵션 설정
- Spring MVC, Spring Security, Spring Data JPA 설정
- MySQL 연결과 Flyway 설정
- Testcontainers MySQL 테스트 기반
- 공통 API 응답/에러 포맷
- traceId 로깅
- Actuator health check
- springdoc-openapi 설정
- Docker local DB 구성

산출물:

- `apps/api` 프로젝트 골격
- `V1__init.sql` 기본 마이그레이션
- 공통 예외/응답 구조
- OpenAPI 문서 노출

완료 기준:

- API 서버가 로컬에서 실행된다.
- Flyway migration과 Testcontainers 테스트가 동작한다.
- `/actuator/health`, `/v3/api-docs`가 환경 정책에 맞게 동작한다.

### 4.2 Step 1. 인증과 계정

연계 Phase: Phase 1

목표: 사업자 FE와 운영 API를 보호할 인증 기반을 만든다.

작업 범위:

- `users` 테이블
- 사업자 회원가입 또는 초기 계정 생성
- 로그인/로그아웃
- HttpOnly Secure Cookie 기반 세션 또는 토큰
- 현재 사용자 조회
- 비밀번호 재설정 흐름 초안
- API 권한 분리: public, business, admin
- 고객 예약 조회 토큰 모델 초안

API 후보:

- `POST /api/business/auth/login`
- `POST /api/business/auth/logout`
- `GET /api/business/me`
- `POST /api/business/auth/password-reset-requests`
- `POST /api/public/reservation-lookup-tokens`

완료 기준:

- 사업자 API는 인증된 사용자만 접근할 수 있다.
- 공개 API와 사업자 API가 보안 설정으로 분리된다.
- 고객 회원가입 없이 예약 조회 검증을 수행할 수 있는 기반이 있다.

### 4.3 Step 2. 매장 입점과 예약 페이지

연계 Phase: Phase 1. 매장 입점/예약 페이지

목표: 매장이 플랫폼에 입점 신청하고 승인 후 공개 예약 페이지를 가질 수 있게 한다.

작업 범위:

- `restaurants`
- `restaurant_applications`
- `business_hours`
- `holiday_rules`
- `reservation_pages`
- 파일 저장소 인터페이스: 대표 이미지, 사업자등록증
- 입점 신청 생성/수정/제출
- 관리자 승인/반려
- 매장 상태 관리
- 영업시간/휴무 설정
- 예약 페이지 공개 상태 관리
- 감사 로그

API 후보:

- `POST /api/business/restaurant-applications`
- `GET /api/business/restaurant-applications/current`
- `PUT /api/business/restaurant-applications/{applicationId}`
- `POST /api/business/restaurant-applications/{applicationId}/submit`
- `GET /api/business/restaurants/current`
- `PUT /api/business/restaurants/{restaurantId}`
- `PUT /api/business/restaurants/{restaurantId}/business-hours`
- `PUT /api/business/restaurants/{restaurantId}/holiday-rules`
- `PUT /api/business/restaurants/{restaurantId}/reservation-page`
- `GET /api/public/restaurants/{slug}`
- `GET /api/admin/restaurant-applications`
- `POST /api/admin/restaurant-applications/{applicationId}/approve`
- `POST /api/admin/restaurant-applications/{applicationId}/reject`

완료 기준:

- 입점 신청이 작성중, 제출, 승인, 반려 상태를 가진다.
- 승인된 매장은 공개 예약 페이지 조회 API로 노출된다.
- 승인/반려/설정 변경은 감사 로그가 남는다.

### 4.4 Step 3. 예약 상품과 기본 예약 엔진

연계 Phase: Phase 2. 기본 예약

목표: 고객이 예약 가능한 상품과 시간대를 조회하고 예약을 생성/취소할 수 있게 한다.

작업 범위:

- `reservation_products`
- `time_slots`
- `customers`
- `reservations`
- `notifications` 기본 큐 테이블 또는 발송 요청 기록
- 예약 상품 CRUD
- 예약 가능 날짜/시간 계산
- 단순 재고 기반 중복 예약 방지
- 고객 자동 생성 또는 매칭
- 예약 생성
- 예약 조회
- 고객 취소
- 예약 확정 알림 이벤트 기록

API 후보:

- `GET /api/public/restaurants/{restaurantId}/reservation-products`
- `GET /api/public/restaurants/{restaurantId}/availability/dates`
- `GET /api/public/restaurants/{restaurantId}/availability/times`
- `POST /api/public/reservations`
- `GET /api/public/reservations/{reservationId}`
- `POST /api/public/reservations/{reservationId}/cancel`
- `GET /api/business/reservation-products`
- `POST /api/business/reservation-products`
- `PUT /api/business/reservation-products/{productId}`
- `DELETE /api/business/reservation-products/{productId}`

동시성 기준:

- 같은 상품/시간대 재고 차감은 트랜잭션 안에서 처리한다.
- 예약 생성 요청은 idempotency key를 받을 수 있게 한다.
- 예약 가능 시간 조회 결과는 확정이 아니라 생성 시 재검증한다.

완료 기준:

- 고객이 예약을 생성할 수 있다.
- 재고가 없는 시간대 예약은 차단된다.
- 예약 취소 시 재고가 복구된다.
- 예약 상태 전이가 도메인 규칙으로 검증된다.

### 4.5 Step 4. 사업자 예약 운영 API

연계 Phase: Phase 3. 오너 예약 관리

목표: 사업자 FE가 예약을 운영할 수 있는 API를 제공한다.

작업 범위:

- 일별 예약 리스트
- 캘린더 조회
- 예약 상세
- 내부 예약/고객 검색
- 수동 예약 등록
- 전화 예약 등록
- 예약 시간/인원 변경
- 매장 취소
- 방문 완료 처리
- 노쇼 처리
- 운영 메모
- 고객 메모 일부 연계
- 감사 로그

API 후보:

- `GET /api/business/reservations`
- `GET /api/business/reservations/calendar`
- `GET /api/business/reservations/{reservationId}`
- `POST /api/business/reservations/manual`
- `PUT /api/business/reservations/{reservationId}`
- `POST /api/business/reservations/{reservationId}/cancel`
- `POST /api/business/reservations/{reservationId}/complete`
- `POST /api/business/reservations/{reservationId}/no-show`
- `PUT /api/business/reservations/{reservationId}/operation-note`

완료 기준:

- 오너가 예약을 조회하고 상태를 변경할 수 있다.
- 허용되지 않는 상태 전이는 차단된다.
- 수동 예약도 재고와 영업시간 검증을 통과해야 생성된다.

### 4.6 Step 5. 결제/환불과 알림

연계 Phase: Phase 4. 예약금/환불

목표: 예약금, 전액 선결제, 카드 보증, 환불, 알림 흐름을 완성한다.

작업 범위:

- `payments`
- `refunds`
- `cancellation_policies`
- `PaymentGateway`
- `RefundGateway`
- `NotificationSender`
- 예약금 결제 요청
- 전액 선결제 요청
- 카드 보증 등록
- 결제 성공/실패/만료 처리
- PG webhook 처리
- 환불 미리보기
- 취소 정책 기반 환불 계산
- 환불 요청/재시도
- 결제/환불 알림
- 방문 전 리마인드 스케줄

API 후보:

- `POST /api/public/reservations/{reservationId}/payments`
- `GET /api/public/reservations/{reservationId}/payment-summary`
- `POST /api/public/reservations/{reservationId}/guarantee`
- `GET /api/public/reservations/{reservationId}/refund-preview`
- `PUT /api/business/reservation-products/{productId}/payment-policy`
- `POST /api/business/reservation-products/{productId}/cancellation-policy`
- `GET /api/business/payments`
- `GET /api/business/refunds`
- `POST /api/pg/webhooks`
- `POST /api/admin/refunds/{refundId}/retry`

정책 결정 필요:

- 결제 실패 시 임시 예약 보존 시간
- 부분 환불 정책
- 카드 보증 노쇼 청구 기준
- PG 수수료 처리 방식

완료 기준:

- 결제 완료 후 예약 상태가 확정된다.
- 고객 취소와 매장 취소에 맞는 환불 요청이 생성된다.
- PG webhook은 idempotent하게 처리된다.
- 결제/환불/알림 실패는 재시도 또는 운영 대응 상태로 남는다.

### 4.7 Step 6. 좌석/재고 관리 고도화

연계 Phase: Phase 5. 좌석/재고 관리

목표: 테이블과 타임슬롯 기반의 정교한 재고 계산을 제공한다.

작업 범위:

- `tables`
- `table_combinations`
- 타임슬롯 생성/갱신
- 상품별 좌석 연결
- 기본 이용 시간
- 예약 시간 겹침 판단
- 테이블 배정 후보 계산
- 임시 마감
- 재고 차감/복구
- DB lock 또는 optimistic/pessimistic locking 정책 적용

API 후보:

- `GET /api/business/tables`
- `POST /api/business/tables`
- `PUT /api/business/tables/{tableId}`
- `POST /api/business/reservation-products/{productId}/seat-rules`
- `GET /api/business/time-slots`
- `POST /api/business/time-slots/close`
- `POST /api/business/time-slots/reopen`

완료 기준:

- 예약 가능 시간은 테이블/좌석/이용시간을 반영해 계산된다.
- 동시에 같은 좌석을 중복 예약할 수 없다.
- 임시 마감된 시간대는 고객 예약에서 제외된다.

### 4.8 Step 7. 고객 관리/CRM

연계 Phase: Phase 6. 고객 관리/CRM

목표: 매장 단위 고객 프로필과 이력을 제공한다.

작업 범위:

- `customers` 확장
- `customer_notes`
- 고객 자동 생성/매칭
- 고객 목록/상세
- 예약 이력
- 방문 이력
- 노쇼 이력
- 요청사항
- 알레르기
- 기념일
- VIP/주의 고객 표시
- 차단 고객 범위
- 중복 고객 병합
- 개인정보 익명화/삭제
- 개인정보 접근 감사 로그

API 후보:

- `GET /api/business/customers`
- `GET /api/business/customers/{customerId}`
- `POST /api/business/customers`
- `PUT /api/business/customers/{customerId}`
- `POST /api/business/customers/{customerId}/flags`
- `GET /api/business/customers/{customerId}/reservations`
- `POST /api/business/customers/{customerId}/notes`
- `PUT /api/business/customer-notes/{noteId}`
- `DELETE /api/business/customer-notes/{noteId}`
- `GET /api/business/customers/duplicate-candidates`
- `POST /api/business/customers/merge`
- `POST /api/business/customers/{customerId}/anonymize`

완료 기준:

- 예약 생성 시 고객이 매장 단위로 매칭된다.
- 고객 상세에서 예약/방문/노쇼 이력을 볼 수 있다.
- 고객 메모와 플래그 변경은 감사 로그를 남긴다.
- 개인정보 삭제/익명화 요청을 처리할 수 있다.

### 4.9 Step 8. 운영 통계

연계 Phase: Phase 7. 운영 통계

목표: 단일 매장 기준 예약 성과와 결제/환불 지표를 집계한다.

작업 범위:

- 통계 조회 API
- 예약 수, 확정 수, 방문 완료 수, 취소 수, 노쇼 수
- 예약금 결제 금액
- 전액 선결제 금액
- 환불 금액
- 순 예약금 금액
- 시간대별 예약률
- 상품별 성과
- CSV 내보내기 요청
- 집계 테이블 또는 view 후보 설계

API 후보:

- `GET /api/business/restaurants/{restaurantId}/analytics/summary`
- `GET /api/business/restaurants/{restaurantId}/analytics/time-slots`
- `GET /api/business/restaurants/{restaurantId}/analytics/products`
- `POST /api/business/restaurants/{restaurantId}/analytics/exports`

완료 기준:

- 오너가 단일 매장 통계를 조회할 수 있다.
- CSV 내보내기 요청이 감사 로그를 남긴다.
- 통계는 정산 자동화와 분리되어 운영 참고용으로 제공된다.

## 5. 데이터베이스 개발 순서

| 순서 | 테이블/영역 | 연계 Step |
| --- | --- | --- |
| 1 | `users`, auth session | Step 1 |
| 2 | `restaurants`, `restaurant_applications` | Step 2 |
| 3 | `business_hours`, `holiday_rules`, `reservation_pages` | Step 2 |
| 4 | `reservation_products`, `time_slots` | Step 3 |
| 5 | `customers`, `reservations` | Step 3 |
| 6 | `notifications`, `audit_logs` | Step 3-5 |
| 7 | `payments`, `refunds`, `cancellation_policies` | Step 5 |
| 8 | `tables`, `table_combinations` | Step 6 |
| 9 | `customer_notes` | Step 7 |
| 10 | analytics view/table 후보 | Step 8 |

## 6. API 계약 개발 순서

1. 공통 에러 응답과 인증 정책 정의
2. Phase 1 public/business/admin API 정의
3. Phase 2 예약 생성 API 정의
4. Phase 3 사업자 예약 운영 API 정의
5. Phase 4 결제/환불 API 정의
6. Phase 5 좌석/재고 API 정의
7. Phase 6 고객 관리 API 정의
8. Phase 7 통계 API 정의
9. OpenAPI 기반 FE client 생성 검증

## 7. 테스트 계획

| 테스트 | 범위 |
| --- | --- |
| Unit | 예약 상태 전이, 취소 정책, 환불 계산, 재고 계산 |
| Integration | API 인증, JPA repository, Flyway, webhook idempotency |
| DB concurrency | 동일 타임슬롯 중복 예약 차단 |
| Contract | OpenAPI schema와 FE client 생성 검증 |
| E2E 연계 | 고객 예약 생성, 사업자 방문 완료, 결제 webhook, 취소/환불 |

## 8. 운영과 관측성

초기부터 포함할 항목:

- API traceId
- JSON structured logging
- Actuator health check
- 결제 webhook 실패 알림
- 알림 발송 실패 알림
- 예약 생성 오류 로그
- 주요 변경 감사 로그

## 9. 주요 리스크

| 리스크 | 대응 |
| --- | --- |
| 예약 중복 생성 | 생성 시점 재검증, DB lock, idempotency key |
| 결제 webhook 중복/지연 | webhook idempotency와 상태 전이 검증 |
| 환불 정책 변경 이력 누락 | 예약 시점 정책 snapshot 저장 |
| 개인정보 보존 위험 | 익명화/삭제 API와 접근 감사 로그 |
| API 계약 변경으로 FE 깨짐 | OpenAPI contract check와 generated client 사용 |

## 10. MVP 완료 기준

- 매장 입점, 승인, 예약 페이지 공개 API가 동작한다.
- 고객이 예약을 생성하고 취소할 수 있다.
- 사업자 오너가 예약을 조회하고 상태를 변경할 수 있다.
- 예약금/선결제/카드 보증과 환불 흐름이 추상 PG 인터페이스로 동작한다.
- 예약/결제/환불/승인/설정 변경은 감사 로그가 남는다.
- 웨이팅, 지도, 검색, POS, 멀티지점, 직원 권한, 정산 자동화는 포함하지 않는다.
