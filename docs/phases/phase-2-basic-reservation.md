# Phase 2. 기본 예약 상세 스펙

## 개요

Phase 2는 승인된 매장의 공개 예약 페이지에서 고객이 예약 상품, 날짜, 시간, 인원을 선택하고 고객 정보를 입력해 예약을 확정하거나 취소할 수 있게 만드는 단계다. 기준 문서의 제품 방향에 따라 이 Phase는 맛집 탐색, 지도, 통합 검색, 웨이팅을 제공하지 않고, 매장이 외부 채널에 공유한 예약 링크로 유입된 고객의 예약 생성 흐름만 다룬다.

예약금 결제, 전액 선결제, 카드 보증, 환불은 Phase 4 범위다. Phase 2에서는 무료 예약 또는 결제 전 예약 확정 흐름을 완성하고, 추후 결제 단계가 삽입될 수 있는 상태와 API 확장 지점만 남긴다.

## 목표와 비목표

### 목표

- 고객이 매장 예약 링크로 진입해 실제 예약을 생성할 수 있다.
- 고객이 노출 중인 예약 상품을 조회하고 선택할 수 있다.
- 고객이 날짜, 시간, 인원을 선택하면 예약 가능 여부를 확인할 수 있다.
- 고객이 이름, 휴대폰 번호, 선택 이메일, 요청사항을 입력할 수 있다.
- 시스템이 상품/시간대 단순 재고 기준으로 중복 예약을 방지한다.
- 예약 생성 즉시 예약 확정 상태를 만들고 고객에게 알림을 발송한다.
- 고객이 예약 상세 링크에서 예약을 취소할 수 있다.
- 예약 생성, 취소, 리마인드 알림 기록을 남긴다.

### 비목표

- 웨이팅 등록, 웨이팅 호출, 대기 순번 관리는 제공하지 않는다.
- 지도 기반 매장 탐색, 주변 매장 검색, 통합 검색은 제공하지 않는다.
- 오너용 예약 리스트, 캘린더, 수동 예약 등록, 방문 완료, 노쇼 처리는 Phase 3에서 다룬다.
- 예약금 결제, 카드 보증, 환불, 결제 실패 복구는 Phase 4에서 다룬다.
- 테이블별 좌석 배정, 좌석 유형, 정교한 이용 시간 기반 수용량 계산은 Phase 5에서 다룬다.
- 고객 CRM, VIP/주의 고객, 방문 이력 분석은 Phase 6에서 다룬다.
- 단체 예약, 대관, 별도 견적, 상담 기반 예약은 MVP 제외 범위로 둔다.

## 사용자 역할

| 역할 | Phase 2 권한 |
| --- | --- |
| 고객 | 공개 예약 페이지 조회, 예약 상품 선택, 날짜/시간/인원 선택, 고객 정보 입력, 예약 확정, 본인 예약 취소, 예약 상세 확인 |
| 매장 오너 | Phase 2에서는 고객 예약 결과의 수신자다. 오너 운영 화면과 수동 변경은 Phase 3에서 제공한다. |
| 플랫폼 관리자 | 장애 대응과 데이터 확인 목적의 내부 조회만 가정한다. 관리자 화면 상세는 이 문서 범위 밖이다. |

## 고객 예약 시나리오

### 예약 생성

1. 고객은 매장이 공유한 `https://service.example.com/r/{restaurant_slug}` 형태의 예약 링크로 진입한다.
2. 시스템은 승인 완료 및 운영 중인 매장인지 확인하고 예약 가능한 상품을 보여준다.
3. 고객은 예약 상품을 선택한다.
4. 고객은 날짜를 선택한다. 선택 가능한 날짜는 매장의 예약 오픈 기간, 휴무, 상품 노출 조건을 반영한다.
5. 고객은 인원을 선택한다. 인원 범위는 매장 기본 정책과 상품별 최소/최대 인원을 모두 만족해야 한다.
6. 시스템은 선택한 상품, 날짜, 인원에 대해 가능한 시간대를 조회한다.
7. 고객은 시간대를 선택한다.
8. 고객은 이름, 휴대폰 번호, 선택 이메일, 요청사항, 선택 동의 항목을 입력한다.
9. 고객이 예약 확정을 누르면 서버는 재고를 다시 검증하고 예약을 생성한다.
10. 예약은 Phase 2에서 기본적으로 `confirmed` 상태가 되며, 결제 연계가 필요한 상품은 Phase 4에서 결제 대기 상태가 삽입될 수 있도록 확장 지점만 남긴다.
11. 시스템은 고객에게 예약 확정 알림을 발송하고, 매장 알림 채널이 설정되어 있으면 매장에도 신규 예약 알림을 발송한다.
12. 고객은 예약 완료 화면에서 예약 번호, 날짜, 시간, 인원, 상품명, 매장 연락처, 취소 가능 시각을 확인한다.

### 예약 취소

1. 고객은 예약 확정 알림의 예약 상세 링크로 진입한다.
2. 시스템은 예약 조회 토큰 또는 예약 번호와 휴대폰 번호 인증으로 본인 예약을 확인한다.
3. 고객은 취소 가능 여부와 취소 정책 안내를 확인한다.
4. 고객이 취소를 확정하면 서버는 예약 상태를 `cancelled_by_customer`로 변경한다.
5. 시스템은 고객에게 예약 취소 알림을 발송하고, 매장 알림 채널이 설정되어 있으면 매장에도 취소 알림을 발송한다.
6. Phase 2에서는 결제/환불 처리를 수행하지 않는다. 예약금이 필요한 상품은 Phase 4 이후 취소 시 환불 정책으로 연결한다.

## 기능 상세

### 예약 상품 조회

- 공개 예약 페이지는 `reservation_products` 중 `is_visible = true`, `status = active`인 상품만 노출한다.
- 상품에는 상품명, 설명, 가격 표시용 금액, 예약금 필요 여부, 최소/최대 인원, 예약 가능 요일/시간, 취소 정책 요약, 남은 예약 가능 여부를 표시한다.
- Phase 2에서는 고객 조회만 제공한다. 상품 생성, 수정, 숨김 처리는 Phase 1의 초기 세팅 또는 내부 관리 데이터가 존재한다고 가정하며, 오너용 상품 관리 고도화는 별도 Phase에서 다룰 수 있다.
- 결제 관련 필드가 있더라도 Phase 2에서는 안내용으로만 표시한다. `deposit_amount > 0` 또는 `requires_payment = true`인 상품은 예약 생성 API가 결제 전 확정 흐름으로 처리할 수 있어야 하지만 실제 결제 승인과 환불은 수행하지 않는다.

### 날짜/시간/인원 선택

- 날짜 선택은 매장의 예약 오픈 기간 안에서만 가능하다.
- 영업일, 정기 휴무, 임시 휴무, 브레이크타임, 상품별 예약 가능 요일을 반영한다.
- 시간 선택은 상품별 예약 가능 시간과 `time_slots` 기준으로 제공한다.
- 인원 선택은 다음 조건을 모두 만족해야 한다.
  - 매장 최소/최대 예약 인원
  - 상품 최소/최대 예약 인원
  - 시간대 잔여 재고가 인원을 수용할 수 있는지 여부
- MVP 일반 예약 범위는 기준 문서에 맞춰 예: 1-8인 수준으로 제한한다. 실제 기본값은 매장 정책 필드로 관리한다.

### 예약 가능 여부 계산

Phase 2의 예약 가능 여부는 상품/시간대 단순 재고 기준으로 계산한다.

계산 입력:

- `restaurant_id`
- `reservation_product_id`
- `visit_date`
- `start_time`
- `party_size`
- 상품의 `capacity_per_slot` 또는 `stock_quantity`
- 해당 시간대의 활성 예약 수 또는 예약 인원 합계

기본 규칙:

- `confirmed`, `modified` 상태 예약은 재고를 점유한다.
- `pending_payment`는 Phase 4 확장 상태지만, 결제 연계가 활성화된 경우 일정 시간 동안 재고를 임시 점유할 수 있도록 상태 값을 예약해 둔다.
- `cancelled_by_customer`, `cancelled_by_restaurant`, `expired` 상태 예약은 재고를 점유하지 않는다.
- Phase 2 재고 단위는 상품/시간대 기준이다. 테이블, 좌석 유형, 이용 시간 겹침, 합석 가능 여부는 계산하지 않는다.

재고 차감 방식:

- `capacity_type = reservation_count`이면 같은 상품/시간대의 확정 예약 건수를 기준으로 차감한다.
- `capacity_type = seat_count`이면 같은 상품/시간대의 확정 예약 인원 합계를 기준으로 차감한다.
- 초기 구현은 `seat_count`를 기본으로 권장한다. 단, 상품이 오마카세 좌석처럼 예약 건수 단위로 관리되어야 하면 상품별 설정으로 전환 가능하게 둔다.

동시성 제어:

- 예약 생성 시 조회 결과를 신뢰하지 않고 트랜잭션 안에서 재고를 다시 계산한다.
- 같은 `restaurant_id`, `reservation_product_id`, `visit_date`, `start_time` 범위의 재고 계산 행 또는 집계 대상 예약 행을 잠근다.
- 재고 초과 시 예약을 생성하지 않고 `409 Conflict`를 반환한다.

### 고객 정보 입력

필수 입력:

- 고객 이름
- 휴대폰 번호
- 방문 인원
- 방문 날짜
- 방문 시간
- 예약 상품

선택 입력:

- 이메일
- 요청사항
- 알레르기 메모
- 기념일 메모
- 마케팅 수신 동의

처리 규칙:

- 휴대폰 번호는 예약 본인 확인과 알림 발송의 기본 키로 사용한다.
- 동일 휴대폰 번호로 기존 `customers`가 있으면 같은 매장 기준 고객 정보를 재사용하거나 최신 입력값으로 보완한다.
- 고객 계정 가입은 요구하지 않는다.
- 개인정보 수집 및 이용 동의는 예약 확정 전에 필수로 받는다.
- 마케팅 수신 동의는 선택이며, 동의하지 않아도 예약할 수 있다.

### 요청사항

- 요청사항은 자유 텍스트로 입력한다.
- 최대 길이는 500자로 제한한다.
- 욕설 필터링이나 자동 분류는 Phase 2 범위에 포함하지 않는다.
- 알레르기와 기념일은 별도 선택 필드 또는 요청사항 보조 필드로 저장할 수 있다.
- 요청사항은 예약 상세와 알림 템플릿에 포함하되, SMS 길이 제한으로 인해 외부 알림에는 일부만 표시할 수 있다.

### 예약 확정

- 고객이 예약 확정을 요청하면 서버는 필수 입력값, 상품 상태, 매장 상태, 날짜/시간 유효성, 재고를 모두 검증한다.
- 검증 성공 시 `reservations`를 생성하고 상태를 `confirmed`로 저장한다.
- 예약 번호 `reservation_code`는 고객 안내와 고객센터 확인에 사용할 수 있도록 사람이 읽을 수 있는 짧은 코드로 생성한다.
- 예약 상세 접근용 `manage_token`은 충분히 긴 난수로 생성하고 원문 노출을 최소화한다. 저장 시 해시 저장을 권장한다.
- 확정 후 `notifications`에 고객 예약 확정 알림 발송 요청을 기록한다.
- 매장 알림 채널이 설정된 경우 매장 신규 예약 알림도 기록한다.

결제 연계 지점:

- 상품에 예약금 또는 선결제 정책이 설정되어 있더라도 Phase 2에서는 실제 결제 승인을 호출하지 않는다.
- Phase 4에서 `pending_payment` 상태, 결제 세션 생성, 결제 완료 후 `confirmed` 전이, 결제 실패 시 `expired` 전이를 추가할 수 있도록 `payment_required`, `payment_status`, `payment_due_at` 필드를 확장 후보로 둔다.
- Phase 2 기본 정책은 무료 예약 또는 결제 전 예약 확정이다.

### 예약 취소

- 고객은 예약 상세 링크에서 본인 예약을 취소할 수 있다.
- 취소 가능 시간은 매장 또는 상품의 취소 마감 정책을 따른다. 정책이 없으면 방문 시작 전까지 취소 가능으로 둔다.
- 방문 시간이 지난 예약은 고객이 직접 취소할 수 없다.
- 이미 취소된 예약에 대한 재취소 요청은 멱등하게 성공 응답을 반환하거나 `409 Conflict`로 처리한다. API 일관성을 위해 멱등 성공을 권장한다.
- 취소 성공 시 상태를 `cancelled_by_customer`로 변경하고 `cancelled_at`, `cancel_reason`을 저장한다.
- 취소 후 고객과 매장에 취소 알림을 발송한다.
- 결제/환불 관련 안내 문구는 Phase 4 도입 전까지 "결제 없는 예약" 기준으로 표시한다.

### 예약 변경 범위

Phase 2에서 고객의 직접 예약 변경은 제한한다.

- 고객 직접 변경 가능 범위: 취소 후 새 예약 생성
- 고객 직접 변경 불가 범위: 날짜 변경, 시간 변경, 인원 변경, 상품 변경
- 변경 버튼을 제공하는 경우에도 실제 변경 API를 호출하지 않고, 기존 예약 취소 후 새 예약 생성 흐름으로 안내한다.
- 오너가 예약 시간 또는 인원을 수정하는 기능은 Phase 3에서 제공한다.
- 내부 데이터 모델에는 향후 변경 이력 추적을 위해 `modified` 상태와 `previous_reservation_id` 또는 감사 로그 확장 가능성을 남긴다.

### 예약 알림

알림 유형:

- 예약 확정 알림
- 예약 취소 알림
- 방문 전 리마인드
- 매장 신규 예약 알림
- 매장 예약 취소 알림

채널:

- SMS
- 카카오 알림톡
- 이메일

Phase 2 필수 구현:

- 예약 확정 직후 고객 알림
- 예약 취소 직후 고객 알림
- 예약 확정 직후 매장 알림
- 예약 취소 직후 매장 알림
- 방문 24시간 전 고객 리마인드 예약 작업 생성

처리 규칙:

- 실제 외부 발송 연동이 준비되지 않은 환경에서는 `notifications`에 `queued` 상태로 기록하고 개발용 발송 어댑터로 대체할 수 있다.
- 알림 발송 실패는 예약 생성 성공을 롤백하지 않는다.
- 발송 실패 시 `failed` 상태와 실패 사유를 기록하고 재시도 가능하게 둔다.
- 고객 개인정보가 포함된 알림 본문은 필요한 최소 정보만 포함한다.

## 화면/페이지 목록

| 화면/페이지 | 경로 예시 | 설명 |
| --- | --- | --- |
| 공개 예약 페이지 | `/r/{restaurant_slug}` | 매장 기본 정보, 예약 상품 목록, 예약 시작 진입점 |
| 예약 상품 선택 | `/r/{restaurant_slug}/reserve/product` | 노출 중인 예약 상품 선택 |
| 날짜/시간/인원 선택 | `/r/{restaurant_slug}/reserve/schedule` | 날짜, 시간대, 인원 선택 및 가능 여부 표시 |
| 고객 정보 입력 | `/r/{restaurant_slug}/reserve/customer` | 이름, 휴대폰 번호, 이메일, 요청사항, 동의 입력 |
| 예약 확인 | `/r/{restaurant_slug}/reserve/review` | 선택 정보와 취소 정책 확인 후 확정 |
| 예약 완료 | `/reservations/{reservation_code}/complete?token=...` | 예약 번호, 방문 정보, 매장 연락처, 상세 링크 안내 |
| 예약 상세 | `/reservations/{reservation_code}?token=...` | 고객 본인 예약 상세 확인 |
| 예약 취소 확인 | `/reservations/{reservation_code}/cancel?token=...` | 취소 가능 여부와 취소 확정 |
| 예약 불가/만석 안내 | 공통 상태 화면 | 재고 소진, 영업 외 시간, 상품 미노출 등 예약 불가 사유 표시 |

단일 페이지 앱으로 구현하는 경우에도 위 화면 단계를 라우팅 또는 명확한 스텝 상태로 분리한다.

## 데이터 모델 초안

### `reservation_products`

예약 상품의 고객 노출 및 예약 제약 조건을 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | bigint/uuid | 예약 상품 ID |
| `restaurant_id` | bigint/uuid | 매장 ID |
| `name` | varchar(100) | 상품명 |
| `description` | text | 상품 설명 |
| `display_price` | integer | 고객 표시용 금액. 결제 처리는 Phase 4 |
| `deposit_amount` | integer | 예약금 금액. Phase 2에서는 안내 또는 확장 필드 |
| `requires_payment` | boolean | 결제 필요 여부. 실제 결제는 Phase 4 |
| `min_party_size` | integer | 상품 최소 인원 |
| `max_party_size` | integer | 상품 최대 인원 |
| `available_weekdays` | json/array | 예약 가능 요일 |
| `available_start_time` | time | 상품 예약 시작 시간 |
| `available_end_time` | time | 상품 예약 종료 시간 |
| `slot_interval_minutes` | integer | 30분 또는 60분 등 타임슬롯 간격 |
| `capacity_type` | enum | `seat_count`, `reservation_count` |
| `capacity_per_slot` | integer | 시간대별 재고 |
| `cancellation_policy_summary` | text | 고객 노출용 취소 정책 요약 |
| `is_visible` | boolean | 고객 노출 여부 |
| `status` | enum | `draft`, `active`, `paused`, `archived` |
| `created_at` | datetime | 생성 시각 |
| `updated_at` | datetime | 수정 시각 |

### `time_slots`

날짜별 또는 규칙 기반 시간대 정보를 저장한다. Phase 2에서는 예약 가능 시간 조회를 빠르게 하기 위한 슬롯 단위로 사용한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | bigint/uuid | 타임슬롯 ID |
| `restaurant_id` | bigint/uuid | 매장 ID |
| `reservation_product_id` | bigint/uuid | 예약 상품 ID |
| `slot_date` | date | 방문 날짜 |
| `start_time` | time | 시작 시간 |
| `end_time` | time | 종료 시간 |
| `capacity_type` | enum | `seat_count`, `reservation_count` |
| `capacity` | integer | 이 슬롯의 총 재고 |
| `reserved_count` | integer | 예약 건수 캐시. 선택 구현 |
| `reserved_seats` | integer | 예약 인원 캐시. 선택 구현 |
| `is_open` | boolean | 예약 가능 여부 |
| `closed_reason` | varchar(100) | 닫힘 사유 |
| `created_at` | datetime | 생성 시각 |
| `updated_at` | datetime | 수정 시각 |

구현 선택:

- Phase 2 초기는 `reservation_products`와 영업시간 규칙으로 동적 슬롯을 계산해도 된다.
- 성능 또는 동시성 제어가 필요하면 날짜별 `time_slots`를 미리 생성하고 예약 생성 시 해당 행을 잠근다.

### `customers`

매장별 고객 기본 정보를 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | bigint/uuid | 고객 ID |
| `restaurant_id` | bigint/uuid | 매장 ID |
| `name` | varchar(80) | 고객 이름 |
| `phone` | varchar(30) | 휴대폰 번호 |
| `email` | varchar(255) | 선택 이메일 |
| `marketing_opt_in` | boolean | 마케팅 수신 동의 여부 |
| `last_reserved_at` | datetime | 마지막 예약 시각 |
| `created_at` | datetime | 생성 시각 |
| `updated_at` | datetime | 수정 시각 |

제약:

- `restaurant_id + phone` 기준 중복 방지를 권장한다.
- 같은 휴대폰 번호로 예약하는 경우 이름과 이메일은 최신 입력값으로 갱신할 수 있다.

### `reservations`

예약의 핵심 정보를 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | bigint/uuid | 예약 ID |
| `reservation_code` | varchar(30) | 고객 안내용 예약 번호 |
| `restaurant_id` | bigint/uuid | 매장 ID |
| `reservation_product_id` | bigint/uuid | 예약 상품 ID |
| `time_slot_id` | bigint/uuid/null | 사용한 타임슬롯 ID |
| `customer_id` | bigint/uuid | 고객 ID |
| `customer_name_snapshot` | varchar(80) | 예약 당시 고객명 |
| `customer_phone_snapshot` | varchar(30) | 예약 당시 휴대폰 |
| `customer_email_snapshot` | varchar(255) | 예약 당시 이메일 |
| `visit_date` | date | 방문 날짜 |
| `start_time` | time | 방문 시작 시간 |
| `end_time` | time | 예상 종료 시간 |
| `party_size` | integer | 방문 인원 |
| `status` | enum | 예약 상태 |
| `request_note` | text | 요청사항 |
| `allergy_note` | text | 알레르기 메모 |
| `occasion_note` | text | 기념일 메모 |
| `privacy_agreed_at` | datetime | 개인정보 동의 시각 |
| `marketing_opt_in` | boolean | 예약 시점 마케팅 동의 |
| `manage_token_hash` | varchar(255) | 예약 상세 접근 토큰 해시 |
| `cancelled_at` | datetime | 취소 시각 |
| `cancel_reason` | varchar(255) | 취소 사유 |
| `created_at` | datetime | 생성 시각 |
| `updated_at` | datetime | 수정 시각 |

권장 인덱스:

- `(restaurant_id, visit_date, start_time)`
- `(reservation_product_id, visit_date, start_time, status)`
- `(reservation_code)`
- `(customer_id, created_at)`

### `notifications`

예약 관련 알림 발송 요청과 결과를 저장한다.

| 필드 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | bigint/uuid | 알림 ID |
| `restaurant_id` | bigint/uuid | 매장 ID |
| `reservation_id` | bigint/uuid | 예약 ID |
| `recipient_type` | enum | `customer`, `restaurant` |
| `recipient_name` | varchar(80) | 수신자명 |
| `recipient_contact` | varchar(255) | 전화번호 또는 이메일 |
| `channel` | enum | `sms`, `alimtalk`, `email` |
| `template_key` | varchar(100) | 알림 템플릿 키 |
| `payload` | json | 템플릿 치환 데이터 |
| `status` | enum | `queued`, `sending`, `sent`, `failed`, `cancelled` |
| `scheduled_at` | datetime | 발송 예정 시각 |
| `sent_at` | datetime | 발송 완료 시각 |
| `failed_reason` | text | 실패 사유 |
| `retry_count` | integer | 재시도 횟수 |
| `created_at` | datetime | 생성 시각 |
| `updated_at` | datetime | 수정 시각 |

## API 초안

API 경로는 예시이며 실제 프레임워크 라우팅 규칙에 맞춰 조정할 수 있다. 공개 예약 API는 매장 오너 인증 없이 접근 가능하지만, 예약 생성과 취소에는 토큰, 휴대폰 확인, rate limit을 적용한다.

### 매장 예약 페이지 조회

`GET /api/public/restaurants/{restaurant_slug}/reservation-page`

응답 요약:

```json
{
  "restaurant": {
    "id": "rest_123",
    "name": "서울 다이닝",
    "slug": "seoul-dining",
    "phone": "02-0000-0000",
    "address": "서울시 ...",
    "status": "active"
  },
  "reservationPolicy": {
    "minPartySize": 1,
    "maxPartySize": 8,
    "openDaysAhead": 30,
    "cutoffMinutesBeforeVisit": 120
  }
}
```

### 예약 상품 목록 조회

`GET /api/public/restaurants/{restaurant_slug}/reservation-products`

쿼리:

- `date`: 선택. 특정 날짜 기준 노출 가능 상품 필터링
- `partySize`: 선택. 인원 기준 상품 필터링

응답 요약:

```json
{
  "products": [
    {
      "id": "prod_123",
      "name": "디너 코스",
      "description": "계절 메뉴 코스",
      "displayPrice": 80000,
      "requiresPayment": false,
      "depositAmount": 0,
      "minPartySize": 1,
      "maxPartySize": 4,
      "cancellationPolicySummary": "방문 전까지 취소 가능"
    }
  ]
}
```

### 예약 가능 날짜 조회

`GET /api/public/restaurants/{restaurant_slug}/reservation-products/{product_id}/available-dates`

쿼리:

- `from`: 조회 시작일
- `to`: 조회 종료일
- `partySize`: 방문 인원

응답 요약:

```json
{
  "dates": [
    {
      "date": "2026-06-01",
      "available": true,
      "closedReason": null
    }
  ]
}
```

### 예약 가능 시간 조회

`GET /api/public/restaurants/{restaurant_slug}/reservation-products/{product_id}/available-times`

쿼리:

- `date`: 방문 날짜
- `partySize`: 방문 인원

응답 요약:

```json
{
  "date": "2026-06-01",
  "times": [
    {
      "timeSlotId": "slot_123",
      "startTime": "18:00",
      "endTime": "20:00",
      "remainingCapacity": 4,
      "available": true
    }
  ]
}
```

### 예약 생성

`POST /api/public/reservations`

요청 요약:

```json
{
  "restaurantSlug": "seoul-dining",
  "reservationProductId": "prod_123",
  "timeSlotId": "slot_123",
  "visitDate": "2026-06-01",
  "startTime": "18:00",
  "partySize": 2,
  "customer": {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "email": "guest@example.com"
  },
  "requestNote": "창가 좌석 가능하면 부탁드립니다.",
  "allergyNote": "갑각류 알레르기",
  "occasionNote": "기념일",
  "agreements": {
    "privacy": true,
    "marketing": false
  }
}
```

성공 응답 요약:

```json
{
  "reservation": {
    "id": "resv_123",
    "reservationCode": "R260601A7K",
    "status": "confirmed",
    "restaurantName": "서울 다이닝",
    "productName": "디너 코스",
    "visitDate": "2026-06-01",
    "startTime": "18:00",
    "partySize": 2,
    "manageUrl": "https://service.example.com/reservations/R260601A7K?token=..."
  }
}
```

오류 응답 예:

- `400 Bad Request`: 입력값 형식 오류, 개인정보 동의 누락
- `404 Not Found`: 매장 또는 상품 없음
- `409 Conflict`: 재고 부족, 이미 마감된 시간
- `422 Unprocessable Entity`: 인원 범위 초과, 예약 가능 기간 외 날짜

### 예약 상세 조회

`GET /api/public/reservations/{reservation_code}`

쿼리:

- `token`: 예약 상세 접근 토큰

응답 요약:

```json
{
  "reservation": {
    "reservationCode": "R260601A7K",
    "status": "confirmed",
    "restaurantName": "서울 다이닝",
    "restaurantPhone": "02-0000-0000",
    "productName": "디너 코스",
    "visitDate": "2026-06-01",
    "startTime": "18:00",
    "partySize": 2,
    "requestNote": "창가 좌석 가능하면 부탁드립니다.",
    "canCancel": true,
    "cancelDeadline": "2026-06-01T17:59:59+09:00"
  }
}
```

### 예약 취소

`POST /api/public/reservations/{reservation_code}/cancel`

요청 요약:

```json
{
  "token": "raw-manage-token",
  "reason": "일정 변경"
}
```

성공 응답 요약:

```json
{
  "reservation": {
    "reservationCode": "R260601A7K",
    "status": "cancelled_by_customer",
    "cancelledAt": "2026-05-30T10:00:00+09:00"
  }
}
```

### 알림 작업 처리

`POST /api/internal/notifications/{notification_id}/send`

내부 워커 또는 배치가 호출한다.

요청 요약:

```json
{
  "attempt": 1
}
```

응답 요약:

```json
{
  "notificationId": "noti_123",
  "status": "sent",
  "sentAt": "2026-05-30T10:00:05+09:00"
}
```

## 예약 상태와 상태 전이

### 상태 정의

| 상태 | 설명 | Phase 2 사용 |
| --- | --- | --- |
| `pending` | 예약 생성 검증 중 또는 확정 전 임시 상태 | 선택 |
| `pending_payment` | 결제 대기 | Phase 4 확장용 |
| `confirmed` | 예약 확정 | 필수 |
| `modified` | 예약 변경됨 | Phase 3 확장용 |
| `cancelled_by_customer` | 고객 취소 | 필수 |
| `cancelled_by_restaurant` | 매장 취소 | Phase 3 확장용 |
| `completed` | 방문 완료 | Phase 3 확장용 |
| `no_show` | 노쇼 | Phase 3 확장용 |
| `expired` | 결제 대기 또는 임시 점유 만료 | Phase 4 확장용 |

### 상태 전이

| 시작 상태 | 이벤트 | 종료 상태 | 설명 |
| --- | --- | --- | --- |
| 없음 | 무료 예약 생성 성공 | `confirmed` | Phase 2 기본 흐름 |
| 없음 | 결제 필요 예약 생성 | `confirmed` | Phase 2에서는 결제 전 확정으로 처리하거나 기능 플래그로 제한 |
| `confirmed` | 고객 취소 | `cancelled_by_customer` | 취소 가능 정책 통과 시 |
| `confirmed` | 매장 취소 | `cancelled_by_restaurant` | Phase 3에서 오너 기능으로 제공 |
| `confirmed` | 오너 변경 | `modified` | Phase 3에서 제공 |
| `confirmed` | 방문 완료 처리 | `completed` | Phase 3에서 제공 |
| `confirmed` | 노쇼 처리 | `no_show` | Phase 3에서 제공 |
| `pending_payment` | 결제 완료 | `confirmed` | Phase 4에서 제공 |
| `pending_payment` | 결제 시간 초과 | `expired` | Phase 4에서 제공 |

상태 전이 원칙:

- 취소된 예약은 다시 `confirmed`로 되돌리지 않는다.
- 고객 취소 후 같은 조건으로 예약하려면 새 예약을 생성한다.
- 재고 점유 여부는 상태 기준으로 계산한다.
- 상태 변경은 변경 시각과 변경 주체를 감사 로그로 남기는 것을 권장한다.

## 유효성 검증과 예외 케이스

### 입력값 검증

- 고객 이름은 2-80자 범위로 제한한다.
- 휴대폰 번호는 숫자, 하이픈, 국가번호 입력을 정규화해 저장한다.
- 이메일은 입력된 경우 형식을 검증한다.
- 인원은 정수이며 매장 및 상품의 최소/최대 범위를 만족해야 한다.
- 날짜는 매장 예약 오픈 기간 안이어야 한다.
- 시간은 상품과 매장의 예약 가능 시간이어야 한다.
- 요청사항, 알레르기, 기념일 메모는 최대 길이를 제한한다.
- 개인정보 동의가 없으면 예약을 생성하지 않는다.

### 예약 불가 케이스

- 매장 상태가 승인 완료 또는 운영 중이 아니다.
- 매장이 운영 정지 상태다.
- 예약 페이지가 비공개다.
- 선택한 상품이 숨김, 중지, 삭제 상태다.
- 선택한 날짜가 정기 휴무 또는 임시 휴무다.
- 선택한 시간이 영업시간 밖이거나 브레이크타임이다.
- 예약 마감 시간 이후다.
- 예약 오픈 기간 밖의 날짜다.
- 인원이 허용 범위를 벗어난다.
- 선택한 시간대 재고가 부족하다.
- 예약 생성 중 다른 고객이 마지막 재고를 선점했다.

### 예외 처리

- 예약 생성 직전 재고 부족이 발생하면 `409 Conflict`와 함께 최신 가능한 시간대 재조회 유도 정보를 반환한다.
- 알림 발송 실패는 예약 생성 자체를 실패시키지 않는다.
- 취소 요청 시 이미 취소된 예약이면 현재 취소 상태를 반환해 중복 클릭을 흡수한다.
- 토큰이 없거나 유효하지 않은 예약 상세/취소 요청은 `401 Unauthorized` 또는 `403 Forbidden`을 반환한다.
- 존재하지 않는 예약 번호는 개인정보 보호를 위해 상세한 존재 여부를 노출하지 않고 일반 오류 메시지를 사용한다.
- 외부 발송 서비스 장애 시 알림을 `failed` 또는 `queued`로 남기고 재시도한다.

## 중복 예약 방지 범위

Phase 2의 중복 예약 방지는 상품/시간대 단순 재고 기준으로 정의한다.

포함 범위:

- 같은 매장, 같은 예약 상품, 같은 방문 날짜, 같은 시작 시간의 재고 초과 방지
- `confirmed`와 `modified` 예약의 건수 또는 인원 합산
- 예약 생성 트랜잭션 안에서 최종 재고 재검증
- 동시 요청으로 인한 초과 예약 방지

제외 범위:

- 테이블별 중복 배정 방지
- 서로 다른 상품 간 동일 좌석 풀 공유
- 이용 시간 겹침 계산
- 좌석 합치기 또는 분리
- 매장 전체 수용 인원 최적화
- 고객 1명이 같은 날 여러 예약을 만드는 행위 제한

고객 중복 예약 제한은 오탐 가능성이 높으므로 Phase 2에서는 강제하지 않는다. 필요 시 동일 휴대폰 번호, 같은 매장, 같은 날짜, 가까운 시간대 예약에 대해 경고만 표시한다.

## 완료 기준

- 공개 예약 링크에서 예약 상품 목록을 조회할 수 있다.
- 고객이 날짜, 시간, 인원을 선택하면 예약 가능한 시간대만 선택할 수 있다.
- 예약 생성 API가 서버 측 유효성 검증과 재고 재검증을 수행한다.
- 동시 예약 요청이 들어와도 상품/시간대 재고를 초과해 `confirmed` 예약이 생성되지 않는다.
- 고객 정보와 요청사항이 예약에 저장된다.
- 예약 성공 시 `confirmed` 상태 예약과 예약 번호가 생성된다.
- 예약 완료 화면과 예약 상세 화면에서 핵심 예약 정보를 확인할 수 있다.
- 고객이 예약 상세 링크로 본인 예약을 취소할 수 있다.
- 취소된 예약은 재고 계산에서 제외된다.
- 예약 확정, 예약 취소, 방문 전 리마인드 알림 레코드가 생성된다.
- 알림 발송 실패가 예약 생성 또는 취소 트랜잭션을 깨지 않는다.
- 웨이팅, 지도, 통합 검색 UI/API가 포함되지 않는다.
- 예약금 결제와 환불 처리는 실제 수행하지 않고 Phase 4 연계 지점만 남긴다.

## 후속 Phase 연계

| 후속 Phase | 연계 지점 |
| --- | --- |
| Phase 3. 오너 예약 관리 | `reservations` 상태 변경, 오너 예약 리스트, 캘린더, 수동 예약 등록, 시간/인원 변경, 방문 완료/노쇼 처리 |
| Phase 4. 예약금/환불 | `pending_payment`, 결제 세션, 예약금 결제 완료 후 확정, 환불 정책, 결제/환불 알림 |
| Phase 5. 좌석/재고 관리 | `time_slots` 고도화, 테이블 배정, 좌석 유형, 이용 시간 겹침 계산, 상품 간 공유 재고 |
| Phase 6. 고객 관리/CRM | `customers` 확장, 예약/방문/노쇼 이력, 알레르기, 기념일, VIP/주의 고객, 고객 메모 |
| Phase 7. 운영 통계 | 예약 수, 취소 수, 시간대별 예약률, 상품별 예약률, 알림 성공률 집계 |
