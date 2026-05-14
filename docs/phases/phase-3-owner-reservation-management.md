# Phase 3. 오너 예약 관리 상세 스펙

## 개요

Phase 3은 매장 오너가 확정된 예약을 실제 영업 운영에 사용할 수 있도록 예약 관리 화면과 운영 액션을 제공하는 단계다. Phase 1에서 등록된 단일 매장과 Phase 2에서 생성된 고객 예약을 기준으로, 오너는 일별 예약 현황을 확인하고, 전화/방문 문의로 들어온 예약을 수동 등록하며, 예약 변경/취소, 방문 완료, 노쇼 처리를 수행한다.

이 Phase는 맛집 탐색 플랫폼을 만들지 않는다. 플랫폼 통합 맛집 검색, 지도 기반 검색, 주변 식당 발견 기능은 제외한다. 다만 매장 관리자 화면 내부에서 해당 매장의 예약과 고객을 찾기 위한 검색과 필터는 운영 필수 기능으로 허용한다.

결제/환불의 실제 처리, 예약금 정책 계산, 카드 보증 청구, 정산 자동화는 Phase 4에서 상세화한다. Phase 3에서는 예약 상세에 결제 상태를 표시하고, 예약 취소/노쇼 같은 액션이 결제/환불 판단으로 이어져야 하는 연계 지점만 남긴다.

## 목표와 비목표

### 목표

- 오너가 오늘과 특정 날짜의 예약을 빠르게 확인할 수 있다.
- 오너가 캘린더에서 일자별 예약 밀도를 파악할 수 있다.
- 오너가 예약 상세에서 고객 정보, 요청사항, 운영 메모, 상태 이력을 확인할 수 있다.
- 오너가 전화 예약 또는 현장 문의 예약을 수동으로 등록할 수 있다.
- 오너가 예약 시간, 인원, 고객 요청사항, 운영 메모를 변경할 수 있다.
- 오너가 매장 사유로 예약을 취소할 수 있다.
- 오너가 방문 완료와 노쇼를 수동 처리할 수 있다.
- 오너의 주요 변경 행위가 감사 로그로 남는다.

### 비목표

- 플랫폼 전체의 맛집 검색, 매장 검색, 지도 기반 탐색은 제공하지 않는다.
- 고객용 예약 변경/취소 플로우는 Phase 2의 범위로 보고, 이 문서는 오너 화면 중심으로 정의한다.
- 예약금 결제, 전액 선결제, 카드 보증, 환불 실행, 정산 자동화는 Phase 4에서 상세화한다.
- POS 연동은 MVP에서 제외한다.
- 직원 계정, 직원별 권한, 역할 기반 접근 제어는 MVP에서 제외한다.
- 멀티지점 관리와 지점 간 예약 이동은 MVP에서 제외한다.
- 테이블 단위 배정, 좌석 재고 최적화, 중복 예약 방지 고도화는 Phase 5에서 상세화한다.
- 고객 세그먼트, 마케팅 캠페인, 자동 CRM은 Phase 6 이후 범위로 본다.

## 사용자 역할

MVP에서는 오너 계정 1개만 제공한다.

| 역할 | 설명 | Phase 3 권한 |
| --- | --- | --- |
| 매장 오너 | 단일 매장을 직접 운영하는 관리자 | 본인 매장의 예약 조회, 수동 예약 등록, 예약 변경, 예약 취소, 방문 완료, 노쇼 처리, 운영 메모 작성 |
| 고객 | 예약 페이지에서 예약을 생성한 방문자 | Phase 3 관리자 화면 접근 권한 없음 |
| 플랫폼 관리자 | 운영 및 분쟁 대응 담당자 | Phase 3 MVP 화면의 주 사용자는 아니며, 별도 관리자 기능에서 감사/분쟁 대응 |

권한 전제:

- 오너 계정은 하나의 `restaurant_id`에만 연결된다.
- 모든 예약 조회와 변경 API는 인증된 오너의 `restaurant_id` 범위 안에서만 동작한다.
- 다른 매장의 예약 ID를 알고 있어도 조회, 변경, 취소할 수 없다.

## 매장 운영 시나리오

### 영업 전 예약 점검

1. 오너가 관리자 화면에 로그인한다.
2. 기본 진입 화면에서 오늘 예약 리스트를 확인한다.
3. 시간대별 예약 수, 총 인원, 취소/노쇼 제외 예약 수를 확인한다.
4. 알레르기, 기념일, 요청사항, 운영 메모가 있는 예약을 우선 확인한다.
5. 필요 시 고객에게 전화로 확인한 뒤 운영 메모를 추가한다.

### 전화 예약 등록

1. 고객이 매장으로 전화해 예약을 요청한다.
2. 오너가 수동 예약 등록 화면을 연다.
3. 날짜, 시간, 인원, 예약 상품, 고객 이름, 휴대폰 번호, 요청사항을 입력한다.
4. 현재 Phase에서는 결제 수단을 실제로 처리하지 않고 결제 상태를 `not_required`, `pending_payment`, `offline` 같은 표시값으로만 남긴다.
5. 예약이 `confirmed` 상태로 등록되고, 생성 출처는 `manual_phone`으로 저장된다.
6. 필요 시 Phase 2 알림 기능과 연계해 예약 확정 알림을 발송한다.

### 예약 변경

1. 고객이 전화로 시간 또는 인원 변경을 요청한다.
2. 오너가 예약 상세에서 변경을 실행한다.
3. 변경 가능한 상태인지 검증한다.
4. 변경 전후의 날짜, 시간, 인원, 예약 상품, 요청사항을 저장한다.
5. 예약 상태는 기본적으로 `modified`로 기록하고, 운영 화면에서는 유효 예약으로 계속 노출한다.
6. 변경 이력은 `audit_logs`에 남긴다.

### 예약 취소

1. 매장 사정 또는 고객 전화 요청으로 오너가 예약을 취소한다.
2. 취소 주체와 취소 사유를 입력한다.
3. 예약 상태를 `cancelled_by_restaurant` 또는 `cancelled_by_customer`로 변경한다.
4. 결제/환불이 연결된 예약이면 Phase 4 환불 판단 대상으로 표시한다.
5. 감사 로그와 알림 발송 요청을 남긴다.

### 방문 완료/노쇼 마감

1. 영업 중 또는 영업 종료 후 오너가 일별 리스트를 확인한다.
2. 실제 방문한 예약은 `completed`로 처리한다.
3. 예약 시간이 지났고 방문하지 않은 예약은 `no_show`로 처리한다.
4. 노쇼 처리 시 사유 또는 확인 메모를 입력할 수 있다.
5. 예약금/카드 보증 예약은 Phase 4의 결제/환불 정책 적용 대상으로 표시한다.

## 기능 상세

### 일별 리스트

일별 리스트는 Phase 3의 기본 화면이다.

표시 항목:

- 예약 시간
- 예약 상태
- 고객 이름
- 고객 휴대폰 번호 뒷자리 또는 마스킹 번호
- 방문 인원
- 예약 상품
- 고객 요청사항 유무
- 알레르기/기념일 표시
- 운영 메모 유무
- 결제 상태 요약
- 예약 생성 출처: `online`, `manual_phone`, `manual_walk_in`, `owner_adjusted`

주요 기능:

- 날짜 선택
- 이전/다음 날짜 이동
- 오늘로 이동
- 상태별 필터
- 시간대 정렬
- 예약 상세 열기
- 방문 완료 빠른 처리
- 노쇼 빠른 처리
- 취소된 예약 표시/숨김 전환

기본 정렬:

1. 예약 시작 시간이 빠른 순서
2. 같은 시간 안에서는 생성 시간이 빠른 순서
3. 취소 예약은 기본 숨김 또는 하단 그룹으로 표시

상단 요약:

- 총 예약 수
- 총 방문 예정 인원
- 확정/변경 예약 수
- 완료 수
- 취소 수
- 노쇼 수

### 캘린더

캘린더는 일자별 예약 밀도와 상태 분포를 파악하는 보조 화면이다.

지원 보기:

- 월간 보기
- 주간 보기
- 일자 클릭 시 해당 날짜의 일별 리스트로 이동

일자 셀 표시:

- 전체 예약 수
- 방문 예정 인원 합계
- 완료/취소/노쇼 요약 배지
- 영업일/휴무일 표시

제약:

- MVP에서는 테이블별 배치 캘린더를 제공하지 않는다.
- 좌석 재고, 테이블 타임라인, 드래그 앤 드롭 예약 이동은 Phase 5 이후 범위로 본다.

### 예약 상세

예약 상세는 예약 운영의 단일 기준 화면이다.

표시 정보:

- 예약 ID
- 예약 상태
- 예약 일시
- 방문 인원
- 예약 상품
- 고객 이름
- 고객 휴대폰 번호
- 고객 이메일
- 고객 요청사항
- 알레르기 정보
- 기념일 정보
- 예약 생성 출처
- 예약 생성일
- 마지막 변경일
- 결제 상태 요약
- 환불 필요 여부 또는 Phase 4 연계 상태
- 운영 메모
- 감사 로그 요약

지원 액션:

- 예약 변경
- 예약 취소
- 방문 완료 처리
- 노쇼 처리
- 운영 메모 추가/수정
- 고객 메모 추가
- 감사 로그 보기

### 필터/검색

플랫폼 통합 맛집 검색은 제외하지만, 매장 관리자 화면 내부 검색은 허용한다.

검색 범위:

- 현재 오너의 `restaurant_id`에 속한 예약
- 현재 오너의 `restaurant_id`에 속한 고객

검색 필드:

- 예약 ID
- 고객 이름
- 휴대폰 번호 전체 또는 뒷자리
- 예약 상품명
- 운영 메모 키워드
- 고객 요청사항 키워드

필터:

- 예약 상태
- 날짜 범위
- 예약 상품
- 방문 인원
- 예약 생성 출처
- 결제 상태
- 요청사항 있음
- 운영 메모 있음
- 노쇼 이력 고객

제약:

- 다른 매장의 고객과 예약은 검색 결과에 포함하지 않는다.
- 검색 인덱스가 도입되더라도 매장 범위 필터가 항상 선적용되어야 한다.
- 고객 개인정보 검색 결과는 최소 필요 정보만 표시한다.

### 수동/전화 예약 등록

수동 예약 등록은 온라인 예약 외 경로를 관리자 화면에 반영하기 위한 기능이다.

예약 출처:

- `manual_phone`: 전화 예약
- `manual_walk_in`: 방문 또는 현장 문의 예약
- `owner_adjusted`: 운영자가 내부 보정 목적으로 등록한 예약

입력 필드:

- 예약 날짜
- 예약 시간
- 방문 인원
- 예약 상품
- 고객 이름
- 고객 휴대폰 번호
- 고객 이메일 선택
- 고객 요청사항 선택
- 알레르기 정보 선택
- 기념일 정보 선택
- 운영 메모 선택
- 결제 상태 표시값 선택

처리 규칙:

- 기본 생성 상태는 `confirmed`다.
- 고객 정보가 기존 `customers`에 있으면 같은 고객으로 연결한다.
- 같은 휴대폰 번호와 같은 매장에 기존 고객이 있으면 재사용한다.
- 기존 고객 메모와 노쇼 이력은 예약 등록 중 참고 정보로 표시할 수 있다.
- 알림 발송 여부는 오너가 선택할 수 있다.

MVP 제약:

- 좌석 자동 배정은 하지 않는다.
- 예약 가능 재고의 정교한 검증은 Phase 5에서 고도화한다.
- 결제 요청 링크 발송, 예약금 결제 확정 처리는 Phase 4 범위다.

### 예약 변경

변경 가능 항목:

- 예약 날짜
- 예약 시간
- 방문 인원
- 예약 상품
- 고객 요청사항
- 알레르기 정보
- 기념일 정보
- 운영 메모

처리 규칙:

- `pending`, `confirmed`, `modified` 상태에서만 변경할 수 있다.
- 변경 후 예약 상태는 `modified`로 저장한다.
- 방문 완료, 노쇼, 취소 상태의 예약은 예약 핵심 정보를 변경할 수 없다.
- 단, 운영 메모와 고객 메모는 완료/노쇼/취소 이후에도 추가할 수 있다.
- 변경 전후 값은 감사 로그에 남긴다.
- 변경으로 결제/환불 정책 재판단이 필요하면 Phase 4 연계 플래그를 남긴다.

### 예약 취소

취소 유형:

- 고객 요청 취소: `cancelled_by_customer`
- 매장 사유 취소: `cancelled_by_restaurant`

필수 입력:

- 취소 유형
- 취소 사유
- 고객에게 알림 발송 여부

처리 규칙:

- `pending`, `confirmed`, `modified` 상태에서만 취소할 수 있다.
- `completed`, `no_show` 상태는 취소로 되돌릴 수 없다.
- 취소 후 예약은 기본 리스트에서 숨기되 필터로 조회할 수 있다.
- 결제 상태가 있는 예약은 Phase 4 환불 검토 대상으로 표시한다.
- 취소 사유와 처리자는 감사 로그에 남긴다.

### 방문 완료 처리

방문 완료는 실제 방문이 확인된 예약의 최종 상태다.

처리 조건:

- `confirmed`, `modified` 상태에서 처리할 수 있다.
- `pending` 상태는 먼저 확정하거나, 정책상 바로 완료 처리할 수 있는지 제품 정책을 결정해야 한다.
- 예약 시작 시간 전에도 완료 처리는 가능하지만 확인 모달에서 경고한다.

처리 결과:

- 예약 상태를 `completed`로 변경한다.
- 방문 완료 시간을 기록한다.
- 고객의 방문 이력 집계에 반영한다.
- 감사 로그를 남긴다.

### 노쇼 처리

노쇼는 예약 시간이 지났지만 고객이 방문하지 않은 경우 오너가 수동 처리한다.

처리 조건:

- `confirmed`, `modified` 상태에서 처리할 수 있다.
- 예약 시작 시간이 지나기 전에는 기본적으로 노쇼 처리할 수 없다.
- 운영상 예외 처리가 필요하면 확인 모달에서 강제 처리 사유를 입력해야 한다.

처리 결과:

- 예약 상태를 `no_show`로 변경한다.
- 노쇼 처리 시간을 기록한다.
- 고객의 노쇼 이력 집계에 반영한다.
- 결제/예약금이 연결된 경우 Phase 4 정책 적용 대상으로 표시한다.
- 감사 로그를 남긴다.

### 운영 메모

운영 메모는 매장 내부에서만 보는 예약 단위 메모다.

예시:

- "창가 요청, 가능하면 2인석 배정"
- "생일 케이크 보관 요청"
- "통화 완료, 19:30으로 변경 안내"
- "노쇼 처리 전 2회 전화했으나 미응답"

정책:

- 고객에게 노출하지 않는다.
- 예약 상태와 무관하게 추가/수정할 수 있다.
- 메모 수정 이력은 감사 로그 또는 별도 이력으로 남긴다.
- 민감정보 입력을 최소화하도록 UI 안내를 제공한다.

## 화면/페이지 목록

| 화면 | 경로 예시 | 설명 |
| --- | --- | --- |
| 예약 관리 홈/일별 리스트 | `/owner/reservations` | 오늘 예약을 기본으로 보여주는 운영 메인 화면 |
| 예약 캘린더 | `/owner/reservations/calendar` | 월간/주간 예약 현황 |
| 예약 상세 | `/owner/reservations/{reservation_id}` | 예약 정보, 고객 정보, 운영 메모, 상태 이력 |
| 수동 예약 등록 | `/owner/reservations/new` | 전화/현장 예약 등록 |
| 예약 변경 | `/owner/reservations/{reservation_id}/edit` | 날짜, 시간, 인원, 상품, 요청사항 변경 |
| 취소 처리 모달 | 상세 또는 리스트 내 모달 | 취소 유형과 사유 입력 |
| 방문 완료 처리 모달 | 상세 또는 리스트 내 모달 | 완료 확인과 처리 시간 기록 |
| 노쇼 처리 모달 | 상세 또는 리스트 내 모달 | 노쇼 사유/확인 메모 입력 |
| 고객 간단 정보 패널 | 상세 내 패널 | 예약 이력, 노쇼 이력, 고객 메모 요약 |
| 감사 로그 패널 | 상세 내 패널 | 예약 변경/상태 변경 이력 |

## 데이터 모델 초안

이 문서는 Phase 3에서 직접 사용하는 `reservations`, `customers`, `customer_notes`, `audit_logs`를 중심으로 정의한다. 실제 결제/환불 테이블은 Phase 4에서 상세화한다.

### reservations

예약의 현재 상태와 운영 정보를 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| id | uuid | 예약 ID |
| restaurant_id | uuid | 매장 ID |
| customer_id | uuid | 고객 ID |
| reservation_product_id | uuid | 예약 상품 ID |
| status | enum | `pending`, `confirmed`, `modified`, `cancelled_by_customer`, `cancelled_by_restaurant`, `completed`, `no_show` |
| source | enum | `online`, `manual_phone`, `manual_walk_in`, `owner_adjusted` |
| reserved_date | date | 예약일 |
| reserved_start_at | timestamptz | 예약 시작 시각 |
| reserved_end_at | timestamptz | 예약 종료 예정 시각 |
| party_size | integer | 방문 인원 |
| customer_request | text | 고객 요청사항 |
| allergy_note | text | 알레르기 정보 |
| occasion_note | text | 기념일 정보 |
| owner_note | text | 예약 단위 운영 메모 |
| payment_status | enum | Phase 4 연계용 표시값 |
| payment_action_required | boolean | 환불/청구 등 결제 후속 처리 필요 여부 |
| cancellation_reason | text | 취소 사유 |
| cancelled_at | timestamptz | 취소 처리 시각 |
| completed_at | timestamptz | 방문 완료 처리 시각 |
| no_show_at | timestamptz | 노쇼 처리 시각 |
| last_modified_at | timestamptz | 마지막 변경 시각 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

인덱스 후보:

- `(restaurant_id, reserved_date, reserved_start_at)`
- `(restaurant_id, status, reserved_date)`
- `(restaurant_id, customer_id, reserved_start_at desc)`
- `(restaurant_id, source, reserved_date)`

### customers

매장별 고객 식별과 예약 운영에 필요한 최소 고객 정보를 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| id | uuid | 고객 ID |
| restaurant_id | uuid | 매장 ID |
| name | varchar | 고객 이름 |
| phone | varchar | 휴대폰 번호 |
| phone_last4 | varchar | 검색/표시 보조값 |
| email | varchar | 이메일 선택 |
| visit_count | integer | 방문 완료 수 |
| no_show_count | integer | 노쇼 수 |
| last_visited_at | timestamptz | 마지막 방문 완료 시각 |
| last_reserved_at | timestamptz | 마지막 예약 시각 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

제약:

- 같은 매장 안에서는 휴대폰 번호를 기준으로 기존 고객 연결을 우선 시도한다.
- 플랫폼 전체 고객 통합 식별은 MVP 범위가 아니다.
- 고객 개인정보는 매장 범위 밖에서 조회되지 않아야 한다.

인덱스 후보:

- `(restaurant_id, phone)`
- `(restaurant_id, phone_last4)`
- `(restaurant_id, name)`
- `(restaurant_id, no_show_count)`

### customer_notes

고객 단위 메모를 저장한다. 예약 단위 운영 메모인 `reservations.owner_note`와 구분한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| id | uuid | 고객 메모 ID |
| restaurant_id | uuid | 매장 ID |
| customer_id | uuid | 고객 ID |
| reservation_id | uuid nullable | 특정 예약과 연결된 메모일 때 사용 |
| note | text | 메모 내용 |
| note_type | enum | `general`, `preference`, `caution`, `vip`, `allergy`, `occasion` |
| is_pinned | boolean | 고객 패널 상단 고정 여부 |
| created_by_user_id | uuid | 작성자. MVP에서는 오너 계정 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

정책:

- 고객에게 노출하지 않는 내부 메모다.
- Phase 6 CRM에서 확장 가능하도록 고객 단위로 분리한다.
- MVP에서는 VIP/주의 고객을 별도 세그먼트 기능이 아니라 메모 유형으로만 표현할 수 있다.

### audit_logs

예약 운영의 주요 변경 행위를 감사 로그로 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| id | uuid | 로그 ID |
| restaurant_id | uuid | 매장 ID |
| actor_user_id | uuid | 행위자. MVP에서는 오너 계정 |
| actor_type | enum | `owner`, `system`, `platform_admin` |
| entity_type | enum | `reservation`, `customer`, `customer_note` |
| entity_id | uuid | 대상 ID |
| action | enum | 수행 액션 |
| before_values | jsonb | 변경 전 주요 값 |
| after_values | jsonb | 변경 후 주요 값 |
| reason | text | 취소/노쇼/강제 처리 등 사유 |
| request_id | varchar | 요청 추적 ID |
| ip_address | varchar | 요청 IP |
| user_agent | text | 요청 User-Agent |
| created_at | timestamptz | 생성 시각 |

주요 action 값:

- `reservation.created_manual`
- `reservation.updated`
- `reservation.cancelled_by_customer`
- `reservation.cancelled_by_restaurant`
- `reservation.completed`
- `reservation.no_show`
- `reservation.owner_note_updated`
- `customer_note.created`
- `customer_note.updated`
- `customer_note.deleted`

## API 초안

모든 API는 인증된 오너의 `restaurant_id`를 서버에서 확인한다. 클라이언트가 전달한 `restaurant_id`는 신뢰하지 않는다.

### 예약 일별 리스트 조회

```http
GET /api/owner/reservations?date=2026-05-14&status=confirmed,modified&query=0101
```

요청 쿼리:

| 이름 | 설명 |
| --- | --- |
| date | 조회 기준일 |
| from | 기간 조회 시작일 |
| to | 기간 조회 종료일 |
| status | 상태 필터. 쉼표 구분 |
| product_id | 예약 상품 필터 |
| source | 예약 생성 출처 |
| query | 예약 ID, 고객명, 휴대폰 번호, 메모 키워드 |
| include_cancelled | 취소 예약 포함 여부 |

응답 요약:

```json
{
  "date": "2026-05-14",
  "summary": {
    "total_reservations": 18,
    "total_party_size": 42,
    "confirmed_count": 12,
    "modified_count": 2,
    "completed_count": 3,
    "cancelled_count": 1,
    "no_show_count": 0
  },
  "items": [
    {
      "id": "resv_123",
      "status": "confirmed",
      "source": "online",
      "reserved_start_at": "2026-05-14T10:30:00+09:00",
      "party_size": 2,
      "product_name": "일반 좌석 예약",
      "customer": {
        "id": "cust_123",
        "name": "김예약",
        "phone_masked": "010-****-1234"
      },
      "has_customer_request": true,
      "has_owner_note": false,
      "payment_status": "not_required"
    }
  ]
}
```

### 캘린더 조회

```http
GET /api/owner/reservations/calendar?from=2026-05-01&to=2026-05-31
```

응답 요약:

```json
{
  "from": "2026-05-01",
  "to": "2026-05-31",
  "days": [
    {
      "date": "2026-05-14",
      "is_open": true,
      "reservation_count": 18,
      "party_size_total": 42,
      "completed_count": 3,
      "cancelled_count": 1,
      "no_show_count": 0
    }
  ]
}
```

### 예약 상세 조회

```http
GET /api/owner/reservations/{reservation_id}
```

응답 요약:

```json
{
  "id": "resv_123",
  "status": "confirmed",
  "source": "online",
  "reserved_start_at": "2026-05-14T10:30:00+09:00",
  "reserved_end_at": "2026-05-14T12:00:00+09:00",
  "party_size": 2,
  "product": {
    "id": "prod_123",
    "name": "일반 좌석 예약"
  },
  "customer": {
    "id": "cust_123",
    "name": "김예약",
    "phone": "010-1234-1234",
    "email": "customer@example.com",
    "visit_count": 2,
    "no_show_count": 0
  },
  "customer_request": "창가 자리 요청",
  "owner_note": "통화 완료",
  "payment_status": "not_required",
  "payment_action_required": false,
  "audit_logs": []
}
```

### 수동 예약 등록

```http
POST /api/owner/reservations
```

요청 요약:

```json
{
  "source": "manual_phone",
  "reservation_product_id": "prod_123",
  "reserved_start_at": "2026-05-14T19:00:00+09:00",
  "party_size": 4,
  "customer": {
    "name": "이전화",
    "phone": "010-2222-3333",
    "email": null
  },
  "customer_request": "유아 의자 요청",
  "allergy_note": null,
  "occasion_note": "생일",
  "owner_note": "전화 예약",
  "payment_status": "offline",
  "send_notification": true
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "status": "confirmed",
  "source": "manual_phone",
  "customer_id": "cust_456",
  "reserved_start_at": "2026-05-14T19:00:00+09:00"
}
```

### 예약 변경

```http
PATCH /api/owner/reservations/{reservation_id}
```

요청 요약:

```json
{
  "reserved_start_at": "2026-05-14T19:30:00+09:00",
  "party_size": 5,
  "reservation_product_id": "prod_123",
  "customer_request": "조용한 자리 요청",
  "owner_note": "고객 전화로 시간 변경",
  "send_notification": true
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "status": "modified",
  "reserved_start_at": "2026-05-14T19:30:00+09:00",
  "party_size": 5,
  "payment_action_required": false
}
```

### 예약 취소

```http
POST /api/owner/reservations/{reservation_id}/cancel
```

요청 요약:

```json
{
  "cancelled_by": "restaurant",
  "reason": "매장 임시 휴무",
  "send_notification": true
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "status": "cancelled_by_restaurant",
  "cancelled_at": "2026-05-14T15:00:00+09:00",
  "payment_action_required": true
}
```

### 방문 완료 처리

```http
POST /api/owner/reservations/{reservation_id}/complete
```

요청 요약:

```json
{
  "completed_at": "2026-05-14T19:42:00+09:00",
  "note": "정상 방문"
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "status": "completed",
  "completed_at": "2026-05-14T19:42:00+09:00"
}
```

### 노쇼 처리

```http
POST /api/owner/reservations/{reservation_id}/no-show
```

요청 요약:

```json
{
  "no_show_at": "2026-05-14T20:20:00+09:00",
  "reason": "예약 시간 30분 경과, 전화 미응답",
  "force": false
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "status": "no_show",
  "no_show_at": "2026-05-14T20:20:00+09:00",
  "payment_action_required": true
}
```

### 운영 메모 수정

```http
PATCH /api/owner/reservations/{reservation_id}/owner-note
```

요청 요약:

```json
{
  "owner_note": "창가 요청, 가능하면 반영"
}
```

응답 요약:

```json
{
  "id": "resv_456",
  "owner_note": "창가 요청, 가능하면 반영",
  "updated_at": "2026-05-14T15:10:00+09:00"
}
```

### 고객 메모 생성

```http
POST /api/owner/customers/{customer_id}/notes
```

요청 요약:

```json
{
  "reservation_id": "resv_456",
  "note_type": "preference",
  "note": "매운 음식을 선호하지 않음",
  "is_pinned": false
}
```

응답 요약:

```json
{
  "id": "note_123",
  "customer_id": "cust_456",
  "note_type": "preference",
  "note": "매운 음식을 선호하지 않음",
  "is_pinned": false
}
```

### 감사 로그 조회

```http
GET /api/owner/reservations/{reservation_id}/audit-logs
```

응답 요약:

```json
{
  "items": [
    {
      "id": "audit_123",
      "actor_type": "owner",
      "action": "reservation.updated",
      "before_values": {
        "party_size": 4
      },
      "after_values": {
        "party_size": 5
      },
      "reason": "고객 전화 요청",
      "created_at": "2026-05-14T15:12:00+09:00"
    }
  ]
}
```

## 예약 상태 전이와 권한/제약

### 상태 전이

| 현재 상태 | 허용 액션 | 다음 상태 |
| --- | --- | --- |
| `pending` | 예약 변경 | `modified` |
| `pending` | 예약 취소 | `cancelled_by_customer` 또는 `cancelled_by_restaurant` |
| `pending` | 예약 확정 | `confirmed` |
| `confirmed` | 예약 변경 | `modified` |
| `confirmed` | 예약 취소 | `cancelled_by_customer` 또는 `cancelled_by_restaurant` |
| `confirmed` | 방문 완료 | `completed` |
| `confirmed` | 노쇼 처리 | `no_show` |
| `modified` | 예약 변경 | `modified` |
| `modified` | 예약 취소 | `cancelled_by_customer` 또는 `cancelled_by_restaurant` |
| `modified` | 방문 완료 | `completed` |
| `modified` | 노쇼 처리 | `no_show` |
| `cancelled_by_customer` | 운영 메모/고객 메모 추가 | 상태 유지 |
| `cancelled_by_restaurant` | 운영 메모/고객 메모 추가 | 상태 유지 |
| `completed` | 운영 메모/고객 메모 추가 | 상태 유지 |
| `no_show` | 운영 메모/고객 메모 추가 | 상태 유지 |

### 권한/제약

- 오너는 본인 매장의 예약만 조회하고 변경할 수 있다.
- 예약 변경, 취소, 방문 완료, 노쇼 처리는 모두 감사 로그 대상이다.
- 취소, 방문 완료, 노쇼 상태는 최종 상태로 본다.
- 최종 상태에서 상태 되돌리기는 MVP에서 제공하지 않는다. 운영 실수 보정이 필요하면 플랫폼 관리자 수동 대응 또는 후속 Phase에서 별도 정책을 둔다.
- 결제/환불과 연결된 상태 변경은 실제 결제 처리를 실행하지 않고 `payment_action_required`를 통해 Phase 4 처리 대상으로 남긴다.
- 직원 계정이 없으므로 `actor_user_id`는 오너 계정 하나로 기록한다.

## 유효성 검증과 예외 케이스

### 공통 검증

- 인증된 오너의 `restaurant_id`와 예약의 `restaurant_id`가 일치해야 한다.
- 예약 날짜와 시간은 매장 영업시간과 휴무 정책을 기준으로 검증한다.
- 예약 인원은 상품 또는 매장 정책의 최소/최대 인원 안에 있어야 한다.
- 예약 상품은 해당 매장에서 노출 또는 운영 가능한 상품이어야 한다.
- 고객 이름과 휴대폰 번호는 수동 예약 등록 시 필수다.
- 휴대폰 번호는 정규화된 형식으로 저장한다.
- 날짜/시간은 서버 기준 타임존 정책에 맞춰 저장하고, 화면에서는 매장 로컬 시간으로 표시한다.

### 일별 리스트/캘린더 예외

- 해당 날짜 예약이 없으면 빈 상태와 수동 예약 등록 진입점을 표시한다.
- 휴무일에도 기존 예약이 있으면 경고와 함께 예약을 표시한다.
- 취소 예약은 기본 숨김이지만 필터로 조회 가능해야 한다.

### 수동 예약 등록 예외

- 같은 시간대에 같은 휴대폰 번호의 예약이 이미 있으면 중복 가능성을 경고한다.
- 영업시간 밖 예약은 기본 차단한다. 단, 운영 정책상 예외 등록이 필요하면 사유 입력 후 허용할지 제품 정책을 결정한다.
- Phase 5 전에는 재고 검증이 단순할 수 있으므로, 과예약 위험이 있으면 경고를 표시한다.
- 기존 고객이 여러 명으로 중복 매칭되면 오너가 선택하거나 새 고객으로 등록할 수 있어야 한다.

### 예약 변경 예외

- 최종 상태 예약은 날짜, 시간, 인원, 상품을 변경할 수 없다.
- 변경 후 시간이 영업시간 밖이면 차단 또는 사유 입력 후 예외 처리한다.
- 변경으로 인원이 상품 최대 인원을 초과하면 차단한다.
- 변경 대상 예약이 동시에 다른 요청으로 수정된 경우 낙관적 잠금 또는 `updated_at` 비교로 충돌을 감지한다.

### 예약 취소 예외

- 이미 취소된 예약을 다시 취소하면 멱등 응답을 반환하거나 409 충돌을 반환한다.
- 완료/노쇼 예약은 취소할 수 없다.
- 취소 사유가 비어 있으면 처리할 수 없다.
- 환불 대상 가능성이 있으면 취소 완료 후 결제/환불 상태 안내를 표시한다.

### 방문 완료/노쇼 예외

- 이미 완료된 예약을 다시 완료 처리하면 멱등 응답을 반환한다.
- 완료된 예약은 노쇼로 변경할 수 없다.
- 노쇼 예약은 완료로 변경할 수 없다.
- 예약 시작 전 노쇼 처리는 기본 차단한다.
- 예약 시작 전 방문 완료 처리는 경고 후 허용할 수 있다.

## 감사 로그 정책

감사 로그는 운영 분쟁, 고객 문의, 결제/환불 판단, 내부 오류 추적을 위해 보존한다.

로그 대상:

- 수동 예약 등록
- 예약 날짜/시간 변경
- 방문 인원 변경
- 예약 상품 변경
- 고객 요청사항 변경
- 운영 메모 변경
- 고객 메모 생성/수정/삭제
- 예약 취소
- 방문 완료 처리
- 노쇼 처리
- 결제/환불 연계 플래그 변경

저장 원칙:

- 누가, 언제, 어떤 예약을, 어떤 값에서 어떤 값으로 바꿨는지 남긴다.
- 취소, 노쇼, 강제 예외 처리에는 사유를 저장한다.
- 개인정보는 필요한 최소 범위만 저장한다.
- 고객 휴대폰 번호 전체를 감사 로그의 before/after에 반복 저장하지 않는다.
- 로그는 일반 오너 화면에서는 요약 중심으로 보여주고, 원본 상세는 분쟁 대응이나 운영자 권한에서 사용한다.
- MVP에서는 오너 계정 1개만 있으므로 작성자 구분은 단순하지만, 후속 직원 권한 도입을 고려해 `actor_user_id`를 유지한다.

## 완료 기준

Phase 3은 다음 조건을 만족하면 완료로 본다.

- 오너가 오늘 예약과 임의 날짜의 예약 리스트를 조회할 수 있다.
- 오너가 월간 또는 주간 캘린더에서 일자별 예약 현황을 확인할 수 있다.
- 오너가 예약 상세에서 고객 정보, 요청사항, 운영 메모, 결제 상태 요약을 확인할 수 있다.
- 오너가 전화/현장 예약을 수동 등록할 수 있다.
- 오너가 예약 날짜, 시간, 인원, 상품, 요청사항, 운영 메모를 변경할 수 있다.
- 오너가 예약을 고객 취소 또는 매장 취소로 처리할 수 있다.
- 오너가 예약을 방문 완료로 처리할 수 있다.
- 오너가 예약을 노쇼로 처리할 수 있다.
- 매장 내부 예약/고객 검색과 필터가 본인 매장 범위 안에서만 동작한다.
- 예약 상태 전이 제약이 서버에서 검증된다.
- 주요 변경 행위가 `audit_logs`에 기록된다.
- 결제/환불 처리는 실행하지 않지만, Phase 4 연계를 위한 결제 상태 표시와 후속 처리 필요 플래그가 남는다.
- POS, 직원 권한, 멀티지점 기능이 MVP 제외로 유지된다.

## 후속 Phase 연계

### Phase 4. 예약금/환불

- `payment_status`와 `payment_action_required`를 실제 결제/환불 처리와 연결한다.
- 취소와 노쇼 처리 시 예약금 환불/미환불 정책을 자동 판단한다.
- 결제 완료, 환불 완료, 카드 보증 관련 알림을 확장한다.

### Phase 5. 좌석/재고 관리

- 예약 변경과 수동 등록 시 시간대별 재고와 테이블 수용량을 정교하게 검증한다.
- 테이블 배정, 좌석 유형, 이용 시간, 타임슬롯 재고를 예약 운영 화면에 연결한다.
- 캘린더를 테이블 타임라인 또는 좌석 현황 보기로 확장할 수 있다.

### Phase 6. 고객 관리/CRM

- `customers`와 `customer_notes`를 고객 프로필, 방문 이력, 노쇼 이력, 선호도, VIP/주의 고객 표시로 확장한다.
- 예약 상세의 고객 패널을 CRM 상세 화면과 연결한다.
- 고객 검색을 예약 운영용 검색에서 고객 관리용 검색으로 확장한다.

### Phase 7. 운영 통계

- 예약 수, 방문 완료 수, 취소 수, 노쇼 수를 통계 화면에 집계한다.
- 시간대별 예약률과 예약 상품별 성과를 분석한다.
- Phase 4 결제 데이터와 연결해 예약금 매출과 환불 금액을 표시한다.
