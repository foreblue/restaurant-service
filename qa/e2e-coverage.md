# Business FE E2E Coverage

## 실행 기준

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
