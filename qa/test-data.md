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
