# 식당 예약 플랫폼 기술 스펙

## 1. 문서 목적

이 문서는 식당 예약 플랫폼을 사용자 FE, 사업자 FE, 백엔드 3개 모듈로 구현하기 위한 기술 스택과 기본 아키텍처 기준을 정의한다.

제품 기획 문서는 [restaurant-reservation-platform-plan.md](./restaurant-reservation-platform-plan.md)를 기준으로 한다.

## 2. 시스템 구성

| 모듈 | 역할 | 권장 구현 방식 |
| --- | --- | --- |
| 사용자 FE | 고객 예약 페이지, 예약 생성, 예약 조회/취소 | Next.js 기반 공개 웹 |
| 사업자 FE | 매장 입점, 예약 운영, 상품/고객/통계 관리 | Vite React 기반 운영 SPA |
| 백엔드 | 예약 도메인, 결제/환불, 알림, 인증, 관리자 운영 API | Kotlin + Spring Boot + MySQL |

초기 구조는 모듈러 모놀리스로 시작한다. 예약, 결제, 알림, 고객 관리가 같은 트랜잭션 흐름 안에서 강하게 연결되므로 MVP 단계에서 마이크로서비스로 분리하지 않는다.

## 3. 공통 기술 기준

| 항목 | 선택 |
| --- | --- |
| FE 언어 | TypeScript strict mode |
| FE 런타임 | Node.js 24 LTS |
| FE 패키지 매니저 | pnpm |
| FE 모노레포 | pnpm workspace |
| API 계약 | OpenAPI 3.1 |
| API 클라이언트 | OpenAPI 기반 TypeScript client 생성 |
| BE 언어 | Kotlin |
| BE 런타임 | Java 21 LTS |
| BE 프레임워크 | Spring Boot 4.x |
| DB | MySQL 8.4 LTS |
| DB 마이그레이션 | Flyway |
| 컨테이너 | Docker |

Node.js는 프로덕션 애플리케이션에서 Active LTS 또는 Maintenance LTS만 사용한다. 2026년 5월 기준 Node.js 24가 LTS이므로 FE 기준 런타임으로 사용한다.

Spring Boot는 4.x를 기본 선택으로 둔다. 다만 결제, 알림, 모니터링 등 필수 라이브러리 호환성 문제가 확인되면 Spring Boot 3.5.x를 임시 대안으로 검토할 수 있다.

MySQL은 운영 안정성을 우선해 8.4 LTS를 기본 선택으로 둔다. 더 최신 LTS 라인은 관리형 DB, 백업, 모니터링, JDBC driver, 운영 도구 호환성을 확인한 뒤 도입한다.

## 4. 저장소 구조

권장 저장소 구조는 다음과 같다.

```text
restaurant-service/
  apps/
    customer-web/
    business-web/
    api/
  packages/
    api-client/
    shared-types/
    ui-tokens/
  docs/
```

| 경로 | 설명 |
| --- | --- |
| `apps/customer-web` | 사용자 FE |
| `apps/business-web` | 사업자 FE |
| `apps/api` | 백엔드 |
| `packages/api-client` | OpenAPI로 생성한 FE API 클라이언트 |
| `packages/shared-types` | FE 공통 타입과 상수 |
| `packages/ui-tokens` | 색상, spacing, typography 등 공통 디자인 토큰 |

FE와 BE는 같은 저장소에서 관리하되, 빌드/배포 단위는 분리한다.

## 5. 사용자 FE 기술 스택

사용자 FE는 식당이 외부에 공유하는 예약 링크를 제공한다. 예약 페이지는 SNS, QR, 네이버 플레이스, 홈페이지 등에서 바로 진입할 수 있으므로 초기 로딩, 모바일 사용성, 공유 미리보기, 검색엔진 접근성을 고려해야 한다.

| 영역 | 선택 |
| --- | --- |
| Framework | Next.js App Router |
| UI Runtime | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component | 자체 컴포넌트 + 필요 시 shadcn/ui |
| Server State | TanStack Query |
| Form | React Hook Form |
| Validation | Zod |
| API Client | OpenAPI 기반 `typescript-fetch` 또는 `orval` |
| Unit Test | Vitest |
| Component Test | Testing Library |
| E2E Test | Playwright |

### 5.1 사용자 FE 선택 이유

- 공개 예약 페이지에 SSR/SEO가 필요하다.
- 매장별 예약 링크 공유 시 Open Graph 메타데이터가 필요하다.
- 예약 흐름은 모바일 비중이 높으므로 첫 화면 로딩과 라우팅 안정성이 중요하다.
- 결제 SDK는 예약금/보증 결제 단계에서만 lazy load한다.

### 5.2 사용자 FE 주요 화면

| 화면 | 설명 |
| --- | --- |
| 예약 페이지 | 매장 정보, 대표 이미지, 예약 상품, 예약 정책 |
| 예약 생성 | 상품, 날짜, 시간, 인원, 고객 정보, 요청사항 입력 |
| 결제/보증 | 예약금 결제, 전액 선결제, 카드 보증 |
| 예약 완료 | 예약 번호, 예약 상태, 방문 안내 |
| 예약 조회 | 휴대폰 인증 또는 예약 조회 토큰 기반 조회 |
| 예약 취소 | 취소 가능 여부, 환불 예상 정보, 취소 요청 |

## 6. 사업자 FE 기술 스택

사업자 FE는 로그인 후 사용하는 운영 도구다. SEO가 필요하지 않고, 예약 리스트, 캘린더, 필터, 상품 설정, 고객 메모 등 클라이언트 상호작용이 많으므로 Vite 기반 SPA로 구성한다.

| 영역 | 선택 |
| --- | --- |
| Build Tool | Vite |
| UI Runtime | React |
| Language | TypeScript |
| Router | React Router 또는 TanStack Router |
| Styling | Tailwind CSS |
| Component | shadcn/ui 기반 관리 UI |
| Server State | TanStack Query |
| Local State | Zustand |
| Table | TanStack Table |
| Form | React Hook Form |
| Validation | Zod |
| API Client | OpenAPI 기반 `typescript-fetch` 또는 `orval` |
| Unit Test | Vitest |
| Component Test | Testing Library |
| E2E Test | Playwright |

### 6.1 사업자 FE 선택 이유

- 운영 화면은 SEO보다 빠른 개발과 클라이언트 상호작용이 중요하다.
- 캘린더, 테이블, 필터, 상태 변경 액션이 많아 SPA 구조가 단순하다.
- 사용자 FE와 공통으로 React, TypeScript, TanStack Query, Zod를 사용해 개발 경험을 맞춘다.

### 6.2 사업자 FE 주요 화면

| 화면 | 설명 |
| --- | --- |
| 로그인/계정 | 사업자 로그인, 비밀번호 재설정 |
| 매장 입점 | 매장 정보, 사업자 정보, 서류 업로드, 승인 상태 |
| 매장 설정 | 영업시간, 브레이크타임, 휴무, 예약 정책 |
| 예약 상품 관리 | 상품, 가격, 예약금, 노출 여부, 가능 시간 |
| 예약 운영 | 일별 리스트, 캘린더, 예약 상세, 수동 예약 |
| 예약 상태 관리 | 변경, 취소, 방문 완료, 노쇼 처리 |
| 고객 관리 | 방문 이력, 요청사항, 메모, VIP/주의 고객 |
| 결제/환불 확인 | 결제 내역, 환불 내역, 예약금 상태 |
| 운영 통계 | 예약 수, 방문 완료, 취소, 노쇼, 매출 지표 |

## 7. 백엔드 기술 스택

백엔드는 예약 가능 여부 계산, 예약 상태 전이, 결제/환불, 알림, 사업자 운영 API, 플랫폼 운영 API를 제공한다.

| 영역 | 선택 |
| --- | --- |
| Language | Kotlin |
| Runtime | Java 21 LTS |
| Framework | Spring Boot 4.x |
| Web | Spring MVC REST API |
| Security | Spring Security |
| Persistence | Spring Data JPA |
| Database | MySQL 8.4 LTS |
| Migration | Flyway |
| API Docs | springdoc-openapi 3.x |
| Validation | Bean Validation |
| Batch/Schedule | Spring Scheduler |
| Observability | Spring Boot Actuator, Micrometer |
| Test | JUnit 5, Spring Boot Test, Testcontainers MySQL |
| Build | Gradle Kotlin DSL |

Spring Boot 4.x는 Java 17 이상을 요구하지만, 신규 프로젝트 기준으로 Java 21 LTS를 사용한다. MySQL은 기능 변화가 적고 지원 기간이 긴 LTS 트랙을 사용한다.

### 7.1 백엔드 패키지 구성

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

### 7.2 백엔드 설계 원칙

- Controller는 HTTP 요청/응답 변환만 담당한다.
- Service는 유스케이스 단위 트랜잭션을 담당한다.
- 도메인 규칙은 Entity 또는 Domain Service에 위치시킨다.
- 외부 PG, SMS, 카카오 알림톡, 이메일 연동은 인터페이스 뒤로 숨긴다.
- 예약 생성, 결제 승인, webhook 처리는 idempotency key를 사용한다.
- 예약/결제/환불/승인/설정 변경은 감사 로그를 남긴다.

## 8. API 계약

백엔드는 OpenAPI 문서를 생성하고, FE는 이 문서에서 타입이 포함된 API 클라이언트를 생성한다.

| 항목 | 기준 |
| --- | --- |
| API Style | REST |
| Spec | OpenAPI 3.1 |
| Public API prefix | `/api/public` |
| Business API prefix | `/api/business` |
| Admin API prefix | `/api/admin` |
| API Docs | `/v3/api-docs`, 내부 환경에서만 Swagger/Scalar 노출 |
| Error Format | 공통 에러 응답 |

공통 에러 응답 예시는 다음과 같다.

```json
{
  "code": "RESERVATION_SLOT_UNAVAILABLE",
  "message": "선택한 시간은 예약할 수 없습니다.",
  "traceId": "01HX..."
}
```

## 9. 인증과 권한

| 대상 | 방식 |
| --- | --- |
| 사업자 | HttpOnly Secure Cookie 기반 세션 또는 토큰 |
| 고객 예약 조회 | 예약번호 + 휴대폰 인증 또는 예약 조회 토큰 |
| 플랫폼 관리자 | MVP에서는 내부 운영 API 또는 제한된 운영 도구 |
| API 권한 | Spring Security 기반 endpoint 권한 분리 |

MVP에서는 고객 회원가입을 강제하지 않는다. 고객은 예약 생성에 필요한 최소 정보만 입력하고, 예약 조회/취소 시 소유자 검증을 수행한다.

## 10. 데이터베이스

초기 DB는 MySQL 단일 인스턴스로 시작한다.

| 항목 | 기준 |
| --- | --- |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_0900_ai_ci` 또는 운영 환경 표준 |
| Timezone | UTC 저장, FE에서 지역 시간 표시 |
| ID | Long auto increment 또는 UUID/ULID 중 하나로 통일 |
| Migration | Flyway SQL migration |
| Soft Delete | 운영 이력 보존이 필요한 도메인에 한해 사용 |

예약 가능 여부 계산은 동시성 문제가 발생하기 쉬우므로 예약 생성 시점에 DB 제약과 트랜잭션을 함께 사용한다.

필수 인덱스 후보:

| 테이블 | 인덱스 후보 |
| --- | --- |
| `reservations` | `restaurant_id`, `visit_date_time`, `status` |
| `reservation_products` | `restaurant_id`, `visible` |
| `customers` | `restaurant_id`, `phone_number` |
| `payments` | `reservation_id`, `status`, `pg_transaction_id` |
| `audit_logs` | `target_type`, `target_id`, `created_at` |

## 11. 외부 연동

| 연동 | MVP 기준 |
| --- | --- |
| PG | 예약금 결제, 전액 선결제, 카드 보증 |
| SMS | 예약 확정/변경/취소/리마인드 |
| 카카오 알림톡 | SMS 대체 또는 병행 |
| 이메일 | 선택 채널 |
| 파일 저장소 | 대표 이미지, 사업자등록증 업로드 |

외부 연동은 다음 인터페이스로 추상화한다.

```text
PaymentGateway
RefundGateway
NotificationSender
FileStorage
```

## 12. 테스트 전략

| 영역 | 도구 | 기준 |
| --- | --- | --- |
| FE unit | Vitest | 포맷팅, 유틸, hooks |
| FE component | Testing Library | 예약 폼, 상품 설정 폼 |
| FE E2E | Playwright | 예약 생성, 사업자 예약 상태 변경 |
| BE unit | JUnit 5 | 예약 가능 여부, 취소 정책, 상태 전이 |
| BE integration | Spring Boot Test | API, 트랜잭션, 보안 |
| DB integration | Testcontainers MySQL | Flyway, JPA, 동시성 |

MVP 필수 E2E 시나리오:

1. 고객이 예약 페이지에서 예약을 생성한다.
2. 사업자가 예약 상세를 확인하고 방문 완료 처리한다.
3. 고객이 취소 정책 내에서 예약을 취소한다.
4. 예약금 결제 성공 후 webhook으로 결제 상태가 확정된다.
5. 동일 타임슬롯 중복 예약이 차단된다.

## 13. 배포 기준

| 모듈 | 배포 단위 |
| --- | --- |
| 사용자 FE | 정적/SSR 웹 애플리케이션 |
| 사업자 FE | 정적 SPA |
| 백엔드 | JVM 애플리케이션 컨테이너 |
| DB | 관리형 MySQL 또는 Docker 기반 개발 DB |

환경은 다음처럼 구분한다.

```text
local
dev
staging
production
```

환경 변수는 모듈별로 분리하고, 결제/알림/파일 저장소 credential은 secret manager 또는 배포 플랫폼의 secret 기능으로 관리한다.

## 14. 운영과 관측성

| 항목 | 기준 |
| --- | --- |
| Health Check | Spring Boot Actuator |
| Metrics | Micrometer |
| Log | JSON structured logging |
| Trace ID | 모든 API 응답과 로그에 포함 |
| Audit | 예약, 결제, 환불, 승인, 설정 변경 이력 저장 |
| Alert | 결제 webhook 실패, 알림 발송 실패, 예약 생성 오류 |

FE는 주요 예약 플로우에서 client-side error reporting을 붙일 수 있도록 설계한다.

## 15. 주요 기술 결정

| 결정 | 내용 |
| --- | --- |
| FE 분리 | 사용자 FE와 사업자 FE는 사용 목적이 다르므로 앱을 분리한다. |
| 사용자 FE | 공개 예약 링크와 공유 미리보기가 중요하므로 Next.js를 사용한다. |
| 사업자 FE | 운영 대시보드는 SPA가 단순하므로 Vite React를 사용한다. |
| BE 구조 | MVP는 모듈러 모놀리스로 시작한다. |
| API 계약 | 백엔드 OpenAPI를 기준으로 FE 클라이언트를 생성한다. |
| DB | 운영 안정성을 위해 MySQL LTS 트랙을 사용한다. |
| 인증 | 사업자와 고객 인증 방식을 분리한다. |
| 결제/알림 | 외부 provider 직접 의존을 인터페이스로 격리한다. |

## 16. 향후 확장 후보

MVP 이후 다음 기능이 필요해지면 기술 구성을 확장한다.

| 확장 | 후보 |
| --- | --- |
| 관리자 FE | 별도 `apps/admin-web` 추가 |
| 비동기 작업 | Queue 또는 outbox pattern 도입 |
| 알림 대량 발송 | 메시지 큐와 worker 분리 |
| 정산 자동화 | settlement 도메인과 배치 작업 추가 |
| 멀티지점 | restaurant/branch 모델 분리 |
| 직원 권한 | role/permission 모델 추가 |
| 검색/지도 | 제품 방향이 바뀔 때 별도 탐색 서비스로 검토 |

## 17. 참고 문서

- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vite Guide](https://vite.dev/guide/)
- [Spring Boot System Requirements](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Boot Kotlin Support](https://docs.spring.io/spring-boot/reference/features/kotlin.html)
- [MySQL Releases: Innovation and LTS](https://dev.mysql.com/doc/mysql/en/mysql-releases.html)
- [TanStack Query TypeScript](https://tanstack.com/query/v5/docs/framework/react/typescript)
- [Zod](https://zod.dev/)
- [springdoc-openapi](https://springdoc.org/)
- [Gradle Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
