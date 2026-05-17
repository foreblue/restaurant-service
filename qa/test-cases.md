# Business FE E2E Test Cases

이 문서는 사업자 FE MVP 운영 콘솔의 qa-flow 기준 baseline TC 인벤토리다. 기대 결과는 현재 구현과 제품 문서가 정의한 의도 동작을 기준으로 작성한다.

## Auth

| ID           | Feature        | Priority | Scenario                   | Steps                                                                    | Expected Result                                                         | Source                                                             | Status | Automated                                         |
| ------------ | -------------- | -------- | -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------ | ------------------------------------------------- |
| BIZ-AUTH-001 | Auth           | P0       | 보호 라우트 접근 후 로그인 | `/reservations` 직접 접근, 로그인 화면 확인, 유효한 이메일/비밀번호 입력 | 로그인 후 원래 요청한 예약 운영 화면으로 이동하고 주요 메뉴가 표시된다. | docs:technical-spec §9, issue:#50, source:ProtectedRoute/LoginPage | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-AUTH-002 | Auth           | P0       | 잘못된 로그인 정보         | 로그인 화면에서 잘못된 이메일 또는 비밀번호 입력                         | 인증 실패 메시지가 표시되고 인증 영역에 머문다.                         | issue:#50, source:LoginPage                                        | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-AUTH-003 | Auth           | P1       | 로그아웃                   | 인증 후 로그아웃 버튼 클릭                                               | 세션이 제거되고 로그인 화면으로 이동한다.                               | issue:#50, source:AppShell/authQueries                             | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-AUTH-004 | Password Reset | P1       | 비밀번호 재설정 요청       | 비밀번호 재설정 화면에서 이메일 입력 후 요청                             | 접수 완료 메시지가 표시된다.                                            | issue:#50, source:PasswordResetRequestPage                         | active | partial: `apps/business-web/src/App.test.tsx`     |

## Onboarding

| ID          | Feature                | Priority | Scenario                          | Steps                                                  | Expected Result                                                    | Source                                           | Status | Automated                                         |
| ----------- | ---------------------- | -------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------ | ------ | ------------------------------------------------- |
| BIZ-ONB-001 | Restaurant Application | P0       | 입점 신청 제출                    | 매장 정보, 사업자 정보, 담당자, 서류 파일 입력 후 제출 | 승인 검토 중 상태가 표시된다.                                      | docs:business-fe-plan §4.2, issue:#51, issue:#52 | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-ONB-002 | Restaurant Application | P0       | 필수값 누락 검증                  | 입점 신청 첫 단계에서 필수값 없이 다음 클릭            | 필수 입력 오류가 표시되고 다음 단계로 이동하지 않는다.             | issue:#51, source:RestaurantApplicationPage      | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-ONB-003 | Restaurant Application | P1       | 반려 사유 확인 후 재작성          | 반려 상태 신청 접근, 재작성 시작                       | 반려 사유가 표시되고 수정 플로우로 진입한다.                       | issue:#52, source:RestaurantApplicationPage      | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-ONB-004 | File Upload            | P0       | 사업자등록증과 대표 이미지 업로드 | 서류 업로드 단계에서 PDF/이미지 파일 선택              | 파일 업로드 완료 메시지가 표시되고 제출 확인 단계로 이동 가능하다. | issue:#51, issue:#52                             | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |

## Store Settings

| ID            | Feature          | Priority | Scenario                   | Steps                                                           | Expected Result                                     | Source                                | Status | Automated                                     |
| ------------- | ---------------- | -------- | -------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------- | ------ | --------------------------------------------- |
| BIZ-STORE-001 | Store Settings   | P0       | 매장 기본 정보 수정        | 매장 설정 화면에서 이름, 전화번호, 주소, 음식 종류 수정 후 저장 | 저장 완료 메시지와 변경된 값이 표시된다.            | docs:business-fe-plan §4.3, issue:#54 | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-STORE-002 | Business Hours   | P1       | 영업시간과 휴무 저장       | 영업시간/휴무 입력 후 저장                                      | 저장 완료 메시지가 표시되고 입력한 일정이 유지된다. | issue:#55                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-STORE-003 | Reservation Page | P1       | 예약 페이지 공개 상태 확인 | 예약 페이지 공개/비공개 상태 변경                               | 공개 가능 조건과 공개 URL이 명확히 표시된다.        | issue:#56                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-STORE-004 | Store Settings   | P1       | 대표 이미지 업로드         | 매장 설정에서 이미지 파일 선택 후 저장                          | 대표 이미지 업로드 완료 메시지가 표시된다.          | issue:#54, source:StoreSettingsPage   | active | partial: `apps/business-web/src/App.test.tsx` |

## Reservation Products

| ID           | Feature             | Priority | Scenario                     | Steps                                               | Expected Result                          | Source                                | Status | Automated                                     |
| ------------ | ------------------- | -------- | ---------------------------- | --------------------------------------------------- | ---------------------------------------- | ------------------------------------- | ------ | --------------------------------------------- |
| BIZ-PROD-001 | Products            | P0       | 예약 상품 생성               | 상품명, 가격, 인원, 요일, 시간, 수용량 입력 후 저장 | 새 상품이 목록에 표시된다.               | docs:business-fe-plan §4.4, issue:#57 | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-PROD-002 | Products            | P0       | 상품 정책 검증               | 잘못된 인원/시간/가격 조합 저장                     | 유효성 오류가 표시되고 저장되지 않는다.  | issue:#57, issue:#58                  | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-PROD-003 | Payment Policy      | P0       | 예약금/선결제/보증 정책 저장 | 상품 결제 정책을 변경하고 저장                      | 정책 요약과 결제 금액이 상품에 반영된다. | issue:#59, docs:business-fe-plan §4.4 | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-PROD-004 | Cancellation Policy | P1       | 취소 정책 저장               | 환불 규칙과 노쇼 규칙 입력 후 저장                  | 정책 저장 완료 메시지와 요약이 표시된다. | issue:#60                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-PROD-005 | Seat Rules          | P2       | 상품별 좌석 연결             | 상품에 좌석 유형/테이블과 기본 이용 시간을 저장     | 좌석 연결 요약이 상품에 표시된다.        | issue:#65                             | active | partial: `apps/business-web/src/App.test.tsx` |

## Reservation Operations

| ID          | Feature            | Priority | Scenario                | Steps                                                      | Expected Result                                                            | Source                                      | Status | Automated                                         |
| ----------- | ------------------ | -------- | ----------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | ------ | ------------------------------------------------- |
| BIZ-RES-001 | Reservations       | P0       | 예약 목록과 캘린더 조회 | 예약 운영 화면 진입                                        | 일별 예약 리스트, 주간 캘린더, 예약 요약이 표시된다.                       | docs:business-fe-plan §4.5, issue:#61       | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-RES-002 | Reservations       | P0       | 예약 상세 확인          | 예약 목록에서 고객 상세 열기                               | 예약번호, 고객 연락처, 요청사항, VIP/주의 표시, 환불 운영 상태가 표시된다. | issue:#61, issue:#72, issue:#73             | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-RES-003 | Reservations       | P0       | 운영 메모 저장          | 예약 상세에서 운영 메모 입력 후 저장                       | 저장 완료 메시지와 수정 상태가 표시된다.                                   | issue:#63, source:ReservationOperationsPage | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-RES-004 | Reservations       | P0       | 예약 변경               | 예약 상세에서 방문 시간/인원 변경                          | 변경 완료 메시지와 변경 상태가 표시된다.                                   | issue:#62, issue:#63                        | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-RES-005 | Reservations       | P0       | 매장 취소               | 예약 상세에서 취소 사유 입력 후 취소 처리                  | 취소 환불 영향 안내 후 매장 취소 상태가 표시된다.                          | issue:#63, issue:#67                        | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-RES-006 | Reservations       | P0       | 방문 완료 처리          | 예약 상세에서 방문 완료 확인                               | 방문 완료 상태가 표시된다.                                                 | docs:technical-spec §12, issue:#63          | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-RES-007 | Reservations       | P0       | 노쇼 처리               | 예약 상세에서 노쇼 사유와 강제 처리 옵션 입력              | 노쇼 상태가 표시되고 고객 리스크 정보에 반영된다.                          | issue:#63, issue:#73                        | active | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-RES-008 | Manual Reservation | P0       | 수동 예약 등록          | 수동 예약 모달에서 상품, 고객, 시간, 인원 입력             | 등록 완료 메시지와 새 예약 고객명이 목록에 표시된다.                       | issue:#62, docs:business-fe-plan §4.5       | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-RES-009 | Reservations       | P1       | 취소 예약 포함 필터     | 취소 예약 미포함 상태에서 취소 고객 검색 후 포함 옵션 선택 | 포함 전 빈 상태, 포함 후 취소 예약과 환불 상태가 표시된다.                 | issue:#61, issue:#67                        | active | partial: `apps/business-web/src/App.test.tsx`     |

## Payments And Refunds

| ID          | Feature  | Priority | Scenario              | Steps                                | Expected Result                                                  | Source                                | Status | Automated                                         |
| ----------- | -------- | -------- | --------------------- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------- | ------ | ------------------------------------------------- |
| BIZ-PAY-001 | Payments | P1       | 결제/환불 화면 조회   | 결제/환불 메뉴 진입                  | 결제 내역, 환불 내역, 요약 카드가 표시된다.                      | docs:business-fe-plan §4.6, issue:#66 | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-PAY-002 | Refunds  | P1       | 실패 환불 상세 확인   | 환불 상태를 실패로 필터 후 상세 보기 | 실패 사유와 플랫폼 관리자 문의 필요 문구가 표시된다.             | issue:#67                             | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-PAY-003 | Payments | P1       | 정산 자동화 오해 방지 | 결제/환불 상세 확인                  | 정산금 계산이나 지급 스케줄을 제공하지 않는다는 안내가 표시된다. | docs:business-fe-plan §4.6, issue:#67 | active | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-PAY-004 | Payments | P2       | 결제 상태 필터        | 결제 상태별 필터 변경                | 조건에 맞는 결제만 표시되고 빈 상태가 명확하다.                  | issue:#66                             | active | partial: `apps/business-web/src/App.test.tsx`     |

## Inventory

| ID          | Feature    | Priority | Scenario                  | Steps                               | Expected Result                                | Source                                | Status | Automated                                     |
| ----------- | ---------- | -------- | ------------------------- | ----------------------------------- | ---------------------------------------------- | ------------------------------------- | ------ | --------------------------------------------- |
| BIZ-INV-001 | Tables     | P2       | 테이블 생성/수정/비활성화 | 좌석/재고 화면에서 테이블 저장      | 테이블 목록과 요약 수치가 갱신된다.            | docs:business-fe-plan §4.7, issue:#64 | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-INV-002 | Time Slots | P2       | 타임슬롯 임시 마감        | 시간대 선택 후 임시 마감            | 해당 시간대가 임시 마감 상태로 표시된다.       | issue:#65                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-INV-003 | Time Slots | P2       | 임시 마감 해제            | 임시 마감 시간대 해제               | 시간대가 예약 가능 상태로 돌아간다.            | issue:#65                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-INV-004 | Inventory  | P2       | 중복 예약 방지 표시       | 동일 시간대 예약이 있는 시간대 조회 | 중복 예약 방지 또는 잔여 수량 상태가 표시된다. | issue:#65                             | active | partial: `apps/business-web/src/App.test.tsx` |

## Customers

| ID           | Feature             | Priority | Scenario                   | Steps                                     | Expected Result                                             | Source                                | Status | Automated                                     |
| ------------ | ------------------- | -------- | -------------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------- | ------ | --------------------------------------------- |
| BIZ-CUST-001 | Customers           | P2       | 고객 목록과 세그먼트 필터  | 고객 관리 화면 진입 후 세그먼트 변경      | 고객 목록, 방문/노쇼/선호정보 요약, 조건별 고객이 표시된다. | docs:business-fe-plan §4.8, issue:#72 | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-CUST-002 | Customers           | P2       | 고객 상세와 예약 이력 확인 | 고객 목록에서 상세 선택                   | 고객 연락처, 방문/취소/노쇼 이력, 예약 이력이 표시된다.     | issue:#72                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-CUST-003 | Customer Notes      | P2       | 고객 메모 CRUD             | 고객 상세에서 메모 추가/수정/삭제         | 메모 변경 완료 메시지와 감사 로그 대상 문구가 표시된다.     | issue:#73                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-CUST-004 | Customer Flags      | P2       | VIP/주의 고객 표시 변경    | 고객 상세에서 VIP 또는 주의 토글          | 고객 상세와 예약 상세에 표시가 반영된다.                    | issue:#73                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-CUST-005 | Duplicate Customers | P2       | 중복 고객 후보 병합        | 중복 후보 선택, 기준 고객 선택, 병합 요청 | 병합 확인 후 기준 고객 상세로 이동한다.                     | issue:#74                             | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-CUST-006 | Privacy             | P1       | 개인정보 삭제/익명화 요청  | 고객 상세에서 삭제/익명화 요청            | 개인정보 처리 주의 안내와 요청 완료 메시지가 표시된다.      | docs:business-fe-plan §4.8, issue:#73 | active | partial: `apps/business-web/src/App.test.tsx` |

## Analytics

| ID          | Feature          | Priority | Scenario                | Steps                             | Expected Result                                                   | Source                                           | Status | Automated                                     |
| ----------- | ---------------- | -------- | ----------------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ | ------ | --------------------------------------------- |
| BIZ-ANL-001 | Analytics        | P2       | 운영 통계 요약 조회     | 운영 통계 화면 진입               | 예약 수, 방문 완료, 취소, 노쇼, 예약금, 환불 지표가 표시된다.     | docs:business-fe-plan §4.9, issue:#75            | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-ANL-002 | Analytics        | P2       | 기간 필터 적용          | 기간 프리셋 변경 후 조회          | 선택한 기간이 유지되고 조회 기준일이 표시된다.                    | issue:#75                                        | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-ANL-003 | Analytics        | P2       | 시간대/상품별 성과 조회 | 운영 통계 화면에서 상세 섹션 확인 | 시간대별 예약률과 상품별 성과 표가 표시된다.                      | issue:#76                                        | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-ANL-004 | Analytics Export | P2       | CSV 내보내기 요청       | CSV 타입 선택 후 내보내기 요청    | 요청 완료 메시지, 파일명, 행 수, 개인정보 마스킹 안내가 표시된다. | issue:#76                                        | active | partial: `apps/business-web/src/App.test.tsx` |
| BIZ-ANL-005 | Analytics        | P2       | 정산 자동화 오해 방지   | 운영 통계와 CSV 내보내기 확인     | 운영 참고용 통계이며 정산 자동화 리포트가 아님을 알 수 있다.      | docs:business-fe-plan §4.9, issue:#75, issue:#76 | active | partial: `apps/business-web/src/App.test.tsx` |

## Visual And Error States

| ID         | Feature     | Priority | Scenario                   | Steps                                                 | Expected Result                                                                  | Source                              | Status             | Automated                                         |
| ---------- | ----------- | -------- | -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- | ------------------ | ------------------------------------------------- |
| BIZ-UI-001 | Visual QA   | P1       | 모바일 예약 운영 화면      | 390px 모바일 뷰포트에서 예약 운영 진입, 상세 열기     | 예약 리스트와 상세 핵심 정보가 보이고 Playwright screenshot artifact가 첨부된다. | issue:#77, docs:business-fe-plan §6 | active             | yes: `apps/business-web/e2e/business-mvp.spec.ts` |
| BIZ-UI-002 | Visual QA   | P1       | 긴 고객명/상품명/상태 배지 | 긴 텍스트 fixture 또는 mock 데이터로 테이블/카드 확인 | 텍스트가 컨테이너를 깨지 않고 truncation 또는 줄바꿈 처리된다.                   | issue:#77                           | needs-confirmation | no                                                |
| BIZ-UI-003 | Error State | P1       | 주요 API 실패 상태         | API 실패 mock 또는 테스트 백엔드 오류 응답 유도       | 화면별 복구 가능한 오류 메시지가 표시된다.                                       | issue:#77, docs:technical-spec §8   | active             | partial: component tests                          |
| BIZ-UI-004 | Empty State | P1       | 주요 빈 상태               | 검색/필터 결과 없음 상태 확인                         | 빈 상태 메시지와 필터 초기화 등 복구 경로가 표시된다.                            | issue:#77                           | active             | partial: `apps/business-web/src/App.test.tsx`     |
| BIZ-UI-005 | Modal QA    | P1       | 확인 모달 키보드/시각 상태 | 취소/노쇼/CSV 내보내기 모달 열기                      | 모달 제목, 주요 설명, 취소/확인 액션이 명확히 표시된다.                          | issue:#77, source:ConfirmDialog     | active             | partial: `apps/business-web/src/App.test.tsx`     |
