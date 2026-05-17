# QA E2E And API Coverage

## Business FE 실행 기준

| 항목                   | 기준                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| Primary command        | `pnpm test:e2e:business`                                                    |
| Regression gate        | `./qa-regression.sh` 또는 `pnpm qa:regression`                              |
| Playwright config      | `apps/business-web/playwright.config.ts`                                    |
| HTML report            | `apps/business-web/playwright-report/index.html`                            |
| Raw results            | `apps/business-web/test-results/results.json`                               |
| Trace/video/screenshot | `apps/business-web/test-results/`                                           |
| Web server             | Playwright `webServer`가 `pnpm exec vite --host 127.0.0.1 --port 4177` 실행 |

`./qa-regression.sh`는 사업자 FE의 `lint`, `test`, `build`, `test:e2e`를 순서대로 실행한다. 배포 전 regression gate에서는 이 명령이 실패하면 배포를 중단한다.

## Feature Coverage

| Feature                 | Critical TCs                                                                                                        | Automated Specs                                                                    | Coverage | Gaps                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| Auth                    | BIZ-AUTH-001, BIZ-AUTH-002, BIZ-AUTH-003, BIZ-AUTH-004                                                              | `apps/business-web/e2e/business-mvp.spec.ts`, `apps/business-web/src/App.test.tsx` | partial  | 세션 만료 후 silent refresh 정책은 backend/session 정책 확정 후 보강              |
| Onboarding              | BIZ-ONB-001, BIZ-ONB-002, BIZ-ONB-003, BIZ-ONB-004                                                                  | `apps/business-web/e2e/business-mvp.spec.ts`, `apps/business-web/src/App.test.tsx` | partial  | 파일 업로드 실패, 파일 형식 제한 E2E는 테스트 백엔드 또는 API mock 필요           |
| Store Settings          | BIZ-STORE-001, BIZ-STORE-002, BIZ-STORE-003, BIZ-STORE-004                                                          | `apps/business-web/src/App.test.tsx`                                               | partial  | 예약 페이지 공개/비공개 전환의 브라우저 E2E 미자동화                              |
| Reservation Products    | BIZ-PROD-001, BIZ-PROD-002, BIZ-PROD-003, BIZ-PROD-004, BIZ-PROD-005                                                | `apps/business-web/src/App.test.tsx`                                               | partial  | 상품 생성 full browser E2E는 우선순위 P1 후속                                     |
| Reservation Operations  | BIZ-RES-001, BIZ-RES-002, BIZ-RES-003, BIZ-RES-004, BIZ-RES-005, BIZ-RES-006, BIZ-RES-007, BIZ-RES-008, BIZ-RES-009 | `apps/business-web/e2e/business-mvp.spec.ts`, `apps/business-web/src/App.test.tsx` | partial  | 예약 변경/취소/노쇼는 component-level 자동화이며 full browser 상태 전이 추가 필요 |
| Payments And Refunds    | BIZ-PAY-001, BIZ-PAY-002, BIZ-PAY-003, BIZ-PAY-004                                                                  | `apps/business-web/e2e/business-mvp.spec.ts`, `apps/business-web/src/App.test.tsx` | partial  | PG webhook 연동 결과는 BE/API 통합 테스트와 연결 필요                             |
| Inventory               | BIZ-INV-001, BIZ-INV-002, BIZ-INV-003, BIZ-INV-004                                                                  | `apps/business-web/src/App.test.tsx`                                               | partial  | 모바일/시각 regression은 후속 screenshot coverage 필요                            |
| Customers               | BIZ-CUST-001, BIZ-CUST-002, BIZ-CUST-003, BIZ-CUST-004, BIZ-CUST-005, BIZ-CUST-006                                  | `apps/business-web/src/App.test.tsx`                                               | partial  | 개인정보 삭제/익명화 API 실패 상태 E2E 미자동화                                   |
| Analytics               | BIZ-ANL-001, BIZ-ANL-002, BIZ-ANL-003, BIZ-ANL-004, BIZ-ANL-005                                                     | `apps/business-web/src/App.test.tsx`                                               | partial  | CSV 다운로드 파일 저장까지는 backend file delivery 정책 확정 후 보강              |
| Visual And Error States | BIZ-UI-001, BIZ-UI-002, BIZ-UI-003, BIZ-UI-004, BIZ-UI-005                                                          | `apps/business-web/e2e/business-mvp.spec.ts`, `apps/business-web/src/App.test.tsx` | partial  | 긴 고객명/상품명 fixture 기반 visual snapshot은 needs-confirmation                |

## Automated Spec Map

| Spec                                                                | Linked TC IDs                                      | Purpose                                                     | Artifacts                                         |
| ------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `apps/business-web/e2e/business-mvp.spec.ts`                        | BIZ-AUTH-001, BIZ-AUTH-003                         | 보호 라우트 인증, 로그인, 로그아웃 full browser smoke       | trace/video/screenshot on failure                 |
| `apps/business-web/e2e/business-mvp.spec.ts`                        | BIZ-ONB-001, BIZ-ONB-004                           | 입점 신청과 파일 업로드 full browser flow                   | trace/video/screenshot on failure                 |
| `apps/business-web/e2e/business-mvp.spec.ts`                        | BIZ-RES-001, BIZ-RES-002, BIZ-RES-003, BIZ-RES-008 | 예약 목록/상세, 운영 메모, 수동 예약 등록 full browser flow | trace/video/screenshot on failure                 |
| `apps/business-web/e2e/business-mvp.spec.ts`                        | BIZ-PAY-001, BIZ-PAY-002, BIZ-PAY-003              | 결제/환불 화면과 실패 환불 운영 안내 full browser flow      | trace/video/screenshot on failure                 |
| `apps/business-web/e2e/business-mvp.spec.ts`                        | BIZ-UI-001                                         | 모바일 예약 상세 visual smoke와 screenshot attachment       | Playwright attachment `mobile-reservation-detail` |
| `apps/business-web/src/App.test.tsx`                                | 다수 partial TC                                    | 빠른 jsdom route/component regression                       | Vitest terminal report                            |
| `apps/business-web/src/components/ui/managementComponents.test.tsx` | BIZ-UI-003, BIZ-UI-005 partial                     | 공통 버튼, 테이블, 확인 모달, 토스트, 폼 검증               | Vitest terminal report                            |

## Coverage Gaps

| Gap                       | Risk                                                                      | Follow-up                                                            |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 테스트 백엔드 연결 전략   | mock adapter 기반 E2E는 API 계약/서버 권한 회귀를 완전히 보장하지 못한다. | BE Quality 이슈 #158의 API 통합 테스트와 Playwright API setup을 연결 |
| 결제 SDK/PG 결과          | 실제 PG SDK와 webhook은 business-web mock E2E로 검증하지 않는다.          | payment sandbox 또는 contract fixture 확정 후 별도 E2E 추가          |
| 긴 텍스트 visual snapshot | 현재 mock fixture는 일부 긴 텍스트만 포함한다.                            | 긴 고객명/상품명/상태 배지 전용 fixture와 screenshot baseline 추가   |
| 접근성 자동 점검          | Playwright 기본 assertion만 있고 axe 등 자동 a11y 도구는 없다.            | a11y dependency 도입 여부 확인 후 별도 이슈로 분리                   |
| 오류 응답 지연/실패 상태  | 대부분 jsdom mock과 component assertion으로 보호된다.                     | API route mock 또는 MSW 도입 후 full browser 오류 상태 E2E 추가      |

## Backend API 실행 기준

| 항목                    | 기준                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| Primary command         | `cd apps/api && ./gradlew test`                                                        |
| Regression gate         | `./qa-regression.sh` 또는 `pnpm qa:regression`                                         |
| Test framework          | JUnit 5, `@SpringBootTest`, `MockMvc`, Testcontainers MySQL                             |
| Spring profile          | `test`                                                                                 |
| Database                | Testcontainers `mysql:8.4`; Docker가 없으면 JUnit Testcontainers 조건에 따라 skip 가능 |
| API contract artifact   | `/v3/api-docs` 응답을 테스트 중 조회                                                   |
| Raw reports             | `apps/api/build/test-results/test/`, `apps/api/build/reports/tests/test/index.html`     |
| Log/artifact collection | Gradle test XML, HTML report, failed test stacktrace, Testcontainers/Docker daemon log  |

`./qa-regression.sh`는 BE API의 `./gradlew test`를 먼저 실행한 뒤 사업자 FE의 `lint`, `test`, `build`, `test:e2e`를 실행한다. 배포 전 regression gate에서는 이 명령이 실패하면 배포를 중단한다.

## Backend API Coverage

| Feature                 | Critical TCs                                                                                         | Automated Specs                                                                  | Coverage | Gaps                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| Foundation/Error        | BE-FND-001, BE-FND-002, BE-FND-003, BE-FND-004                                                       | `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | covered  | traceId log correlation은 로그 수집 환경 확정 후 관측성 gate에서 보강                 |
| OpenAPI Contract        | BE-CON-001, BE-CON-002                                                                               | `RestaurantApiApplicationTests.openApiDocsAreExposed`, `openApiContractIncludesCoreApiPathsSchemasAndEnums` | covered  | FE generated client compile check는 `packages/api-client` 도입 후 별도 gate로 연결    |
| Auth And Access Control | BE-AUTH-001, BE-AUTH-002, BE-AUTH-003, BE-AUTH-004, BE-AUTH-005, BE-AUTH-006, BE-AUTH-007            | `RestaurantApiApplicationTests.kt` auth/lookup token tests                         | covered  | session expiry/refresh 세부 UX는 FE 연계 TC에서 보강                                  |
| Onboarding And Settings | BE-ONB-001, BE-ONB-002, BE-ONB-003, BE-ONB-004, BE-ONB-005, BE-SET-001, BE-SET-002                   | `RestaurantApiApplicationTests.kt` application/file/settings tests                 | covered  | 외부 object storage provider contract는 provider 확정 후 추가                         |
| Products And Inventory  | BE-PROD-001, BE-PROD-002, BE-PROD-003, BE-INV-001, BE-INV-002, BE-INV-003, BE-INV-004                | `RestaurantApiApplicationTests.kt` product/availability/inventory tests            | covered  | 복잡한 테이블 조합 최적 배정 성능 테스트는 post-MVP load test 후보                   |
| Reservation Operations  | BE-RES-001, BE-RES-002, BE-RES-003, BE-RES-004, BE-RES-005, BE-RES-006, BE-RES-007                   | `RestaurantApiApplicationTests.kt` public/business reservation tests               | covered  | 고객 FE full browser E2E는 #155, #48에서 별도 연결                                    |
| Payments And Refunds    | BE-PAY-001, BE-PAY-002, BE-REF-001                                                                   | `RestaurantApiApplicationTests.kt` payment/refund/webhook tests                    | covered  | 실제 PG sandbox signature와 결제창 redirect는 계약 확정 후 추가                      |
| Notification            | BE-NOT-001                                                                                           | `RestaurantApiApplicationTests.adminNotificationRetryUsesFakeSenderAndTracksFailureState` | covered  | 실제 SMS/email provider delivery report contract는 provider 확정 후 추가              |
| CRM And Analytics       | BE-CUST-001, BE-CUST-002, BE-CUST-003, BE-ANL-001, BE-ANL-002                                        | `RestaurantApiApplicationTests.kt` customer/analytics tests                        | covered  | 개인정보 삭제 증적 export는 운영 정책 확정 후 추가                                   |
| Multi-Tenant AuthZ      | BE-AUTHZ-001                                                                                         | onboarding, reservation, inventory, customer API tests                             | partial  | 모든 business endpoint의 cross-owner matrix는 반복 테스트 helper 도입 후 보강         |

## Backend Automated Spec Map

| Spec                                                                 | Linked TC IDs                    | Purpose                                                        | Artifacts                                      |
| -------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-FND-001~004, BE-CON-001~002   | context, Flyway/MySQL, error response, OpenAPI contract smoke  | Gradle test XML/HTML report                    |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-AUTH-001~007                  | business/admin/public 인증과 token 정책                       | Gradle test XML/HTML report                    |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-ONB-001~005, BE-SET-001~002   | 입점 신청, 파일 업로드, 매장 설정, 공개 페이지                 | Gradle test XML/HTML report                    |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-PROD-001~003, BE-INV-001~004  | 예약 상품, 결제/취소 정책, 좌석/타임슬롯/availability          | Gradle test XML/HTML report, Testcontainers DB |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-RES-001~007                   | 공개 예약, 사업자 예약 운영, 상태 전이, 동시성 재검증          | Gradle test XML/HTML report, Testcontainers DB |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-PAY-001~002, BE-REF-001, BE-NOT-001 | 결제 시작, PG webhook, 환불, 알림 dispatch/retry        | Gradle test XML/HTML report                    |
| `apps/api/src/test/kotlin/com/example/restaurant/RestaurantApiApplicationTests.kt` | BE-CUST-001~003, BE-ANL-001~002, BE-AUTHZ-001 | CRM, 개인정보 익명화, 운영 통계/CSV, tenant isolation | Gradle test XML/HTML report                    |

## Backend Coverage Gaps

| Gap                         | Risk                                                                      | Follow-up                                                                     |
| --------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| FE generated client compile | OpenAPI JSON은 검증하지만 생성된 TypeScript client compile까지는 검증하지 않는다. | `packages/api-client`가 도입되면 `openapi -> client generate -> tsc` gate 추가 |
| 실제 PG/provider sandbox    | Fake gateway/sender 기반이라 외부 provider 계약 drift를 직접 감지하지 않는다. | provider sandbox credential과 callback URL 확정 후 별도 contract suite 추가   |
| 전체 cross-owner matrix     | 핵심 흐름은 tenant 분리를 검증하지만 모든 business endpoint matrix는 아니다. | 공통 owner/restaurant fixture helper로 endpoint별 negative matrix 추가         |
| 부하/성능 회귀              | 동시성 correctness는 검증하지만 고부하 latency/throughput은 측정하지 않는다. | post-MVP load test와 DB lock metric 수집으로 분리                              |
