# Phase 6. 고객 관리/CRM 상세 스펙

## 개요

Phase 6은 매장 오너가 예약 과정에서 축적된 고객 정보를 바탕으로 재방문 가능성을 높이고 운영 리스크를 관리할 수 있게 하는 고객 관리 기능이다. 플랫폼은 맛집 탐색 서비스가 아니라 매장 자체 예약 링크를 중심으로 운영되는 예약 관리 SaaS이므로, 고객 데이터는 특정 매장의 예약 운영과 응대 품질 개선에 한정해 사용한다.

이 Phase의 핵심은 고객 프로필, 예약/방문/노쇼 이력, 요청사항, 알레르기, 기념일, 매장 메모, VIP/주의 고객 표시를 한 화면에서 확인하고 관리하는 것이다. 마케팅 자동화, 쿠폰, 고객 세그먼트 캠페인, 매장 간 고객 데이터 공유는 MVP 이후 확장으로만 다룬다.

## 목표와 비목표

### 목표

- 예약 생성 시 고객 정보를 자동으로 고객 프로필에 연결한다.
- 매장 오너가 고객별 예약, 방문 완료, 취소, 노쇼 이력을 확인할 수 있다.
- 고객 요청사항, 알레르기, 기념일, 내부 메모를 예약 운영에 활용할 수 있다.
- VIP 고객과 주의 고객을 매장 내부 기준으로 표시할 수 있다.
- 중복 고객을 병합하고, 병합 이력을 감사 로그로 남길 수 있다.
- 개인정보 조회, 수정, 삭제 요청에 대응할 수 있는 최소 관리 기능과 접근 로그를 마련한다.

### 비목표

- 마케팅 자동화, 쿠폰 발급, 캠페인 발송, 고객 세그먼트 기반 타깃팅은 제공하지 않는다.
- 직원별 권한 분리, 세부 권한 정책, 승인 워크플로우는 MVP에서 제외한다. 향후 매장 직원 계정이 도입될 때 고객 정보 접근 권한 분리가 필요하다.
- 여러 매장 또는 지점 간 고객 프로필 공유는 제공하지 않는다.
- 플랫폼 전체 블랙리스트, 매장 간 노쇼 정보 공유, 외부 신용/리스크 평가 연동은 제공하지 않는다.
- POS 연동 기반 실방문 자동 확인은 제공하지 않는다. 방문 완료와 노쇼는 매장 오너가 수동 처리한다.

## 사용자 역할

| 역할 | Phase 6에서의 권한 |
| --- | --- |
| 고객 | 예약 생성 시 본인 정보, 요청사항, 알레르기, 기념일을 입력한다. 본인 개인정보 조회/정정/삭제 요청의 대상이 된다. |
| 매장 오너 | 고객 목록과 상세를 조회하고, 메모/태그/VIP/주의 표시를 관리하며, 고객 병합과 개인정보 요청을 처리한다. |
| 플랫폼 관리자 | 분쟁, 개인정보 요청, 감사 대응을 위해 제한적으로 고객 데이터와 접근 로그를 확인한다. |

MVP에서는 매장 직원 역할과 권한 분리를 제공하지 않는다. 오너 계정 1개가 매장 CRM 기능을 사용한다.

## 고객 관리 시나리오

### 예약 고객 자동 생성

1. 고객이 매장 예약 페이지에서 이름, 휴대폰 번호, 선택 이메일을 입력한다.
2. 예약 확정 시 시스템이 동일 매장 내 고객 프로필을 검색한다.
3. 일치 고객이 있으면 예약을 기존 고객에 연결한다.
4. 일치 고객이 없으면 신규 고객 프로필을 생성한다.
5. 고객 상세에는 방금 생성된 예약과 요청사항, 알레르기, 기념일이 표시된다.

### 재방문 고객 응대

1. 오너가 오늘 예약 리스트에서 고객명을 선택한다.
2. 고객 프로필에서 과거 방문 횟수, 최근 방문일, 노쇼 횟수, 선호 요청사항, 알레르기, 기념일을 확인한다.
3. 필요한 경우 예약 상세에 응대 메모를 추가하거나 고객 메모를 갱신한다.
4. 방문 완료 처리 시 방문 이력이 자동 갱신된다.

### 주의 고객 리스크 관리

1. 오너가 반복 노쇼 또는 문제 이력이 있는 고객을 주의 고객으로 표시한다.
2. 이후 동일 고객의 예약이 생성되면 예약 상세와 고객 목록에 주의 표시가 노출된다.
3. 예약 자체는 자동 차단하지 않는다. 오너가 예약금, 카드 보증, 전화 확인 등 기존 예약 정책 안에서 수동 대응한다.

### 고객 병합

1. 같은 휴대폰 번호 또는 유사 이름으로 중복 고객 후보가 발견된다.
2. 오너가 고객 상세에서 중복 후보를 확인하고 병합을 실행한다.
3. 대상 고객의 예약, 메모, 표시 정보가 기준 고객으로 이동한다.
4. 병합 전후 고객 ID와 실행자를 `audit_logs`에 기록한다.

### 개인정보 정정/삭제 요청

1. 고객이 매장 또는 플랫폼에 개인정보 정정/삭제를 요청한다.
2. 오너 또는 플랫폼 관리자가 고객 프로필을 확인한다.
3. 법적 보존이 필요한 예약/결제/분쟁 기록은 유지하고, 운영 메모와 선택 정보는 익명화 또는 삭제한다.
4. 처리 결과와 처리자를 `audit_logs`에 기록한다.

## 기능 상세

### 고객 자동 생성/매칭

- 예약 확정 시 `restaurant_id` 범위 안에서 고객을 자동 매칭한다.
- 기본 매칭 키는 정규화된 휴대폰 번호다.
- 보조 매칭 정보는 이름과 이메일이다.
- 휴대폰 번호가 동일하면 기존 고객으로 연결한다.
- 휴대폰 번호가 다르고 이메일만 동일한 경우 자동 병합하지 않고 중복 후보로 표시한다.
- 이름만 동일한 경우 자동 매칭하지 않는다.
- 수동 예약 등록과 전화 예약 등록에서도 동일한 매칭 규칙을 적용한다.
- 예약 취소 상태여도 최초 예약 시점의 고객 프로필 생성은 유지한다.

### 고객 프로필

고객 프로필은 특정 매장에 귀속된다. 동일 인물이 다른 매장에서 예약하더라도 MVP에서는 별도 고객으로 관리한다.

필수 표시 정보:

- 고객명
- 휴대폰 번호
- 이메일
- 최근 예약일
- 최근 방문일
- 누적 예약 수
- 방문 완료 수
- 취소 수
- 노쇼 수
- VIP 여부
- 주의 고객 여부
- 차단 고객 여부
- 등록일
- 마지막 업데이트 일시

관리 가능 정보:

- 이름
- 휴대폰 번호
- 이메일
- 요청사항 요약
- 알레르기
- 기념일
- 매장 내부 메모
- VIP 표시
- 주의 고객 표시
- 차단 고객 표시

### 예약 이력

- 고객 상세에서 예약 상태별 이력을 최신순으로 보여준다.
- 표시 항목은 예약 일시, 상품, 인원, 예약 상태, 예약금/결제 상태, 요청사항, 생성 경로다.
- 예약 상태는 기준 문서의 `pending`, `confirmed`, `modified`, `cancelled_by_customer`, `cancelled_by_restaurant`, `completed`, `no_show`를 따른다.
- 예약 상세로 이동할 수 있어야 한다.

### 방문 이력

- `reservations.status = completed`인 예약을 방문 이력으로 집계한다.
- 최근 방문일, 총 방문 횟수, 평균 인원, 자주 예약한 상품을 계산한다.
- POS 연동이 없으므로 방문 완료 처리는 오너 수동 처리 결과를 신뢰한다.

### 노쇼 이력

- `reservations.status = no_show`인 예약을 노쇼 이력으로 집계한다.
- 노쇼 처리 일시, 예약 일시, 상품, 인원, 예약금 환불 여부를 표시한다.
- 노쇼 횟수가 매장 설정 기준 이상이면 중복 예약 생성 시 주의 배지를 노출한다.
- 자동으로 주의 고객으로 변경하지 않고, 오너가 확인 후 수동 표시한다.

### 요청사항

- 예약별 요청사항은 `reservations.special_request`에 저장한다.
- 고객 프로필에는 반복 요청사항 요약을 표시한다.
- 오너는 고객 프로필에 기본 요청사항 메모를 별도로 작성할 수 있다.
- 고객이 새 예약에서 입력한 요청사항은 기존 고객 메모를 덮어쓰지 않는다.

### 알레르기

- 고객 입력 알레르기는 예약 단위와 고객 프로필 단위에서 모두 확인 가능해야 한다.
- 알레르기 정보는 민감도가 높은 건강 관련 정보로 간주해 접근 로그 대상에 포함한다.
- 알레르기 값은 자유 입력을 허용하되 최대 길이와 금칙 문자를 검증한다.
- 알레르기 정보가 있는 고객의 예약 상세에는 눈에 띄는 표시를 제공한다.

### 기념일

- 고객은 예약 시 기념일 유형과 날짜 또는 간단한 메모를 선택 입력할 수 있다.
- 지원 유형 예시는 생일, 결혼기념일, 기타다.
- 기념일 정보는 예약 응대 참고용이며, 자동 혜택이나 쿠폰 발급에는 사용하지 않는다.
- 기념일 날짜는 연도 없는 월/일 입력을 허용할 수 있다.

### 매장 메모

- 매장 메모는 고객에게 노출되지 않는 내부 운영 정보다.
- 메모 작성, 수정, 삭제는 `customer_notes`에 기록한다.
- 메모에는 작성자, 내용, 공개 범위, 생성/수정 일시를 저장한다.
- MVP의 공개 범위는 `owner_only` 하나로 시작한다.
- 비방, 차별, 불필요한 민감정보 저장을 방지하기 위해 안내 문구와 최대 길이를 둔다.

### VIP 표시

- VIP 표시는 매장 내부 운영 표시다.
- VIP 기준은 시스템이 강제하지 않고 오너가 수동으로 지정한다.
- 고객 목록, 고객 상세, 예약 상세, 일별 예약 리스트에 VIP 배지를 노출한다.
- VIP 표시는 할인, 쿠폰, 자동 혜택과 연결하지 않는다.

### 주의 고객 표시

- 주의 고객 표시는 반복 노쇼, 악성 취소, 특이 응대 필요 등 매장 내부 리스크 관리를 위한 표시다.
- 오너가 수동으로 켜고 끌 수 있다.
- 주의 사유는 짧은 내부 메모로 남길 수 있다.
- 주의 표시는 예약 확정 여부를 자동 변경하지 않는다.
- 고객에게 주의 표시 자체를 노출하지 않는다.

### 차단 고객 범위

- 차단 고객은 특정 매장 안에서만 적용되는 내부 상태다.
- MVP에서는 차단 고객의 신규 예약을 자동 거절하지 않고, 예약 생성 후 예약 상세와 예약 리스트에 강한 경고를 표시한다.
- 자동 예약 차단, 차단 고객 예약 시 관리자 승인, 플랫폼 전체 차단은 후속 과제로 둔다.
- 차단 사유는 고객에게 노출하지 않는다.
- 고객 차단 상태 변경은 `audit_logs`에 남긴다.

### 개인정보 관리

- 고객 프로필의 개인정보 항목은 이름, 휴대폰 번호, 이메일, 알레르기, 기념일, 요청사항, 내부 메모다.
- 휴대폰 번호는 화면에서 기본 마스킹하고, 예약 운영에 필요한 상세 화면에서만 전체 표시한다.
- 고객 삭제 요청 시 예약/결제/환불/분쟁 기록 보존 필요성을 확인한다.
- 보존이 필요한 예약 기록은 유지하되 고객 식별 정보는 가능한 범위에서 익명화한다.
- 알레르기, 기념일, 요청사항, 메모는 운영상 필요가 사라지면 삭제할 수 있어야 한다.
- 개인정보 조회, 수정, 삭제, 병합, 표시 변경은 감사 로그 대상이다.

## 화면/페이지 목록

| 화면 | 경로 예시 | 주요 기능 |
| --- | --- | --- |
| 고객 목록 | `/owner/customers` | 고객 검색, 필터, VIP/주의/차단 배지, 최근 방문일, 노쇼 수 표시 |
| 고객 상세 | `/owner/customers/{customerId}` | 프로필, 예약/방문/노쇼 이력, 요청사항, 알레르기, 기념일, 메모 관리 |
| 고객 편집 | `/owner/customers/{customerId}/edit` | 이름, 연락처, 이메일, 알레르기, 기념일, 표시 상태 수정 |
| 고객 병합 | `/owner/customers/{customerId}/merge` | 중복 후보 확인, 기준 고객 선택, 병합 실행 |
| 예약 상세 내 고객 패널 | `/owner/reservations/{reservationId}` | 연결 고객 요약, VIP/주의/차단/알레르기 표시, 고객 상세 이동 |
| 개인정보 처리 로그 | `/owner/customers/{customerId}/privacy-logs` | 조회/수정/삭제/병합/표시 변경 이력 확인 |
| 관리자 고객 조회 | `/admin/customers/{customerId}` | 분쟁/개인정보 요청 대응용 제한 조회 |

## 데이터 모델 초안

### `customers`

고객 프로필의 기준 테이블이다. 특정 매장 범위의 고객 단위로 생성한다.

| 컬럼 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | UUID | 고객 ID |
| `restaurant_id` | UUID | 소속 매장 ID |
| `name` | varchar(80) | 고객명 |
| `phone` | varchar(30) | 원본 휴대폰 번호 |
| `phone_normalized` | varchar(30) | 숫자 중심 정규화 번호 |
| `email` | varchar(255), nullable | 이메일 |
| `allergy_note` | text, nullable | 고객 단위 알레르기 메모 |
| `anniversary_type` | varchar(40), nullable | 생일, 결혼기념일, 기타 |
| `anniversary_date` | varchar(10), nullable | `MM-DD` 또는 `YYYY-MM-DD` |
| `preference_note` | text, nullable | 반복 요청사항/선호 메모 |
| `is_vip` | boolean | VIP 여부 |
| `is_caution` | boolean | 주의 고객 여부 |
| `caution_reason` | text, nullable | 주의 사유 |
| `is_blocked` | boolean | 매장 내 차단 고객 여부 |
| `blocked_reason` | text, nullable | 차단 사유 |
| `last_reserved_at` | datetime, nullable | 최근 예약 생성 일시 |
| `last_visited_at` | datetime, nullable | 최근 방문 완료 일시 |
| `reservation_count` | integer | 누적 예약 수 |
| `completed_count` | integer | 방문 완료 수 |
| `cancelled_count` | integer | 취소 수 |
| `no_show_count` | integer | 노쇼 수 |
| `merged_into_customer_id` | UUID, nullable | 병합된 경우 기준 고객 ID |
| `deleted_at` | datetime, nullable | 소프트 삭제 일시 |
| `created_at` | datetime | 생성 일시 |
| `updated_at` | datetime | 수정 일시 |

인덱스:

- `idx_customers_restaurant_phone_normalized` on (`restaurant_id`, `phone_normalized`)
- `idx_customers_restaurant_name` on (`restaurant_id`, `name`)
- `idx_customers_restaurant_flags` on (`restaurant_id`, `is_vip`, `is_caution`, `is_blocked`)
- `idx_customers_merged_into_customer_id` on (`merged_into_customer_id`)

### `customer_notes`

매장 내부 메모와 개인정보 처리 관련 운영 메모를 저장한다.

| 컬럼 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | UUID | 메모 ID |
| `restaurant_id` | UUID | 매장 ID |
| `customer_id` | UUID | 고객 ID |
| `author_user_id` | UUID | 작성자 ID |
| `note_type` | enum | `general`, `caution`, `privacy_request`, `merge` |
| `content` | text | 메모 내용 |
| `visibility` | enum | MVP 기본값 `owner_only` |
| `created_at` | datetime | 생성 일시 |
| `updated_at` | datetime | 수정 일시 |
| `deleted_at` | datetime, nullable | 삭제 일시 |

인덱스:

- `idx_customer_notes_customer_created_at` on (`customer_id`, `created_at desc`)
- `idx_customer_notes_restaurant_type` on (`restaurant_id`, `note_type`)

### `reservations`

기존 예약 테이블에 고객 연결과 CRM 표시를 위해 필요한 필드를 명확히 사용한다.

| 컬럼 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | UUID | 예약 ID |
| `restaurant_id` | UUID | 매장 ID |
| `customer_id` | UUID, nullable | 연결 고객 ID |
| `customer_name` | varchar(80) | 예약 당시 고객명 스냅샷 |
| `customer_phone` | varchar(30) | 예약 당시 휴대폰 스냅샷 |
| `customer_email` | varchar(255), nullable | 예약 당시 이메일 스냅샷 |
| `product_id` | UUID | 예약 상품 ID |
| `reserved_at` | datetime | 예약 방문 예정 일시 |
| `party_size` | integer | 방문 인원 |
| `status` | enum | 예약 상태 |
| `special_request` | text, nullable | 예약별 요청사항 |
| `allergy_note` | text, nullable | 예약별 알레르기 |
| `anniversary_note` | text, nullable | 예약별 기념일 메모 |
| `source` | enum | `public_page`, `manual`, `phone` |
| `completed_at` | datetime, nullable | 방문 완료 처리 일시 |
| `no_show_at` | datetime, nullable | 노쇼 처리 일시 |
| `created_at` | datetime | 생성 일시 |
| `updated_at` | datetime | 수정 일시 |

인덱스:

- `idx_reservations_customer_reserved_at` on (`customer_id`, `reserved_at desc`)
- `idx_reservations_restaurant_status_reserved_at` on (`restaurant_id`, `status`, `reserved_at`)

### `audit_logs`

고객 정보 접근과 변경 이력을 남긴다.

| 컬럼 | 타입 예시 | 설명 |
| --- | --- | --- |
| `id` | UUID | 로그 ID |
| `restaurant_id` | UUID, nullable | 매장 ID |
| `actor_user_id` | UUID, nullable | 실행 사용자 ID |
| `actor_role` | enum | `owner`, `admin`, `system` |
| `action` | enum | `customer_viewed`, `customer_updated`, `customer_deleted`, `customer_merged`, `customer_flag_changed`, `privacy_exported` |
| `resource_type` | varchar(80) | 예: `customer`, `reservation`, `customer_note` |
| `resource_id` | UUID | 대상 리소스 ID |
| `metadata` | json | 변경 전후 주요 값, 병합 대상, 요청 IP 등 |
| `ip_address` | varchar(45), nullable | 요청 IP |
| `user_agent` | text, nullable | 사용자 에이전트 |
| `created_at` | datetime | 생성 일시 |

인덱스:

- `idx_audit_logs_resource_created_at` on (`resource_type`, `resource_id`, `created_at desc`)
- `idx_audit_logs_restaurant_action_created_at` on (`restaurant_id`, `action`, `created_at desc`)

## API 초안

### 고객 목록 조회

`GET /api/owner/customers`

요청 쿼리:

- `q`: 이름, 휴대폰 번호, 이메일 검색어
- `flag`: `vip`, `caution`, `blocked`
- `has_allergy`: `true` 또는 `false`
- `min_no_show_count`
- `page`, `limit`

응답 요약:

```json
{
  "items": [
    {
      "id": "cus_123",
      "name": "김민수",
      "phoneMasked": "010-****-1234",
      "email": "minsu@example.com",
      "isVip": true,
      "isCaution": false,
      "isBlocked": false,
      "reservationCount": 8,
      "completedCount": 6,
      "noShowCount": 1,
      "lastVisitedAt": "2026-05-01T10:00:00+09:00"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42
}
```

### 고객 상세 조회

`GET /api/owner/customers/{customerId}`

응답 요약:

```json
{
  "id": "cus_123",
  "name": "김민수",
  "phone": "010-1234-1234",
  "email": "minsu@example.com",
  "allergyNote": "갑각류 알레르기",
  "anniversaryType": "birthday",
  "anniversaryDate": "05-20",
  "preferenceNote": "창가 좌석 선호",
  "isVip": true,
  "isCaution": false,
  "isBlocked": false,
  "stats": {
    "reservationCount": 8,
    "completedCount": 6,
    "cancelledCount": 1,
    "noShowCount": 1
  }
}
```

개인정보 상세 조회이므로 `audit_logs.action = customer_viewed`를 기록한다.

### 고객 생성

`POST /api/owner/customers`

매장 수동 등록 고객을 생성한다.

요청 요약:

```json
{
  "name": "김민수",
  "phone": "010-1234-1234",
  "email": "minsu@example.com",
  "allergyNote": "갑각류 알레르기",
  "anniversaryType": "birthday",
  "anniversaryDate": "05-20"
}
```

응답 요약:

```json
{
  "id": "cus_123",
  "matchedDuplicateCandidates": []
}
```

### 고객 수정

`PATCH /api/owner/customers/{customerId}`

요청 요약:

```json
{
  "name": "김민수",
  "phone": "010-1234-1234",
  "email": "minsu@example.com",
  "allergyNote": "갑각류 알레르기",
  "preferenceNote": "창가 좌석 선호",
  "anniversaryType": "birthday",
  "anniversaryDate": "05-20"
}
```

응답은 수정된 고객 요약을 반환한다. 개인정보 수정은 `customer_updated` 로그를 남긴다.

### 고객 표시 변경

`PATCH /api/owner/customers/{customerId}/flags`

요청 요약:

```json
{
  "isVip": true,
  "isCaution": true,
  "cautionReason": "반복 노쇼",
  "isBlocked": false,
  "blockedReason": null
}
```

응답은 표시 변경 후 상태를 반환한다. 변경 전후 값은 `customer_flag_changed` 로그에 저장한다.

### 고객 예약 이력 조회

`GET /api/owner/customers/{customerId}/reservations`

요청 쿼리:

- `status`: 예약 상태 필터
- `from`, `to`: 예약 방문 예정일 범위
- `page`, `limit`

응답 요약:

```json
{
  "items": [
    {
      "id": "res_123",
      "reservedAt": "2026-05-20T19:00:00+09:00",
      "productName": "디너 코스",
      "partySize": 2,
      "status": "completed",
      "specialRequest": "창가 좌석 요청",
      "hasAllergy": true
    }
  ]
}
```

### 고객 메모 목록 조회

`GET /api/owner/customers/{customerId}/notes`

응답 요약:

```json
{
  "items": [
    {
      "id": "note_123",
      "noteType": "general",
      "content": "창가 좌석 선호",
      "authorName": "오너",
      "createdAt": "2026-05-14T12:00:00+09:00"
    }
  ]
}
```

### 고객 메모 생성

`POST /api/owner/customers/{customerId}/notes`

요청 요약:

```json
{
  "noteType": "general",
  "content": "콜키지 문의가 잦음"
}
```

응답은 생성된 메모를 반환한다.

### 고객 메모 수정/삭제

- `PATCH /api/owner/customers/{customerId}/notes/{noteId}`
- `DELETE /api/owner/customers/{customerId}/notes/{noteId}`

메모 수정/삭제는 소프트 삭제와 감사 로그 기록을 기본으로 한다.

### 중복 고객 후보 조회

`GET /api/owner/customers/{customerId}/duplicate-candidates`

응답 요약:

```json
{
  "items": [
    {
      "id": "cus_456",
      "name": "김민수",
      "phoneMasked": "010-****-1234",
      "matchReasons": ["same_phone"],
      "reservationCount": 2
    }
  ]
}
```

### 고객 병합

`POST /api/owner/customers/{customerId}/merge`

요청 요약:

```json
{
  "sourceCustomerIds": ["cus_456", "cus_789"],
  "mergeStrategy": {
    "profile": "keep_target",
    "notes": "append_all",
    "flags": "true_wins"
  }
}
```

응답 요약:

```json
{
  "targetCustomerId": "cus_123",
  "mergedCustomerIds": ["cus_456", "cus_789"],
  "movedReservationCount": 3,
  "movedNoteCount": 4
}
```

### 개인정보 익명화/삭제

`POST /api/owner/customers/{customerId}/privacy/anonymize`

요청 요약:

```json
{
  "reason": "customer_delete_request",
  "deleteOptionalNotes": true
}
```

응답 요약:

```json
{
  "customerId": "cus_123",
  "status": "anonymized",
  "preservedReservationCount": 5
}
```

## 고객 병합/중복 처리 정책

- 중복 판단은 매장 단위로만 수행한다.
- 휴대폰 번호가 같은 고객은 강한 중복 후보로 표시한다.
- 이메일이 같고 이름이 유사한 고객은 중간 신뢰도 후보로 표시한다.
- 이름만 같은 고객은 목록 검색에서만 찾을 수 있고 중복 후보로 자동 추천하지 않는다.
- 자동 병합은 하지 않는다. 모든 병합은 오너 확인 후 수동 실행한다.
- 병합 기준 고객은 오너가 선택한다.
- 예약 이력, 방문 이력, 노쇼 이력, 메모는 기준 고객으로 모두 이동한다.
- VIP, 주의, 차단 플래그는 하나라도 `true`이면 기준 고객에 유지하는 것을 기본값으로 한다.
- 알레르기, 기념일, 요청사항 메모가 서로 다르면 덮어쓰지 않고 병합 화면에서 충돌 항목으로 표시한다.
- 병합된 고객 레코드는 즉시 삭제하지 않고 `merged_into_customer_id`를 설정해 추적 가능하게 둔다.
- 병합 취소는 MVP에서 제공하지 않는다. 잘못 병합한 경우 플랫폼 관리자 수동 복구 절차로 처리한다.

## 개인정보/보존/접근 로그 정책

- 고객 데이터는 매장 예약 운영 목적에 한해 사용한다.
- 고객 정보는 매장별로 분리 저장하고, 다른 매장 오너가 조회할 수 없다.
- 휴대폰 번호는 목록 화면에서 마스킹한다.
- 알레르기와 기념일은 예약 응대 목적의 선택 정보이며, 불필요한 장기 보관을 피한다.
- 예약, 결제, 환불, 분쟁 대응에 필요한 기록은 관련 법령과 운영 정책에 따라 보존할 수 있다.
- 선택 정보와 내부 메모는 고객 삭제 요청 또는 운영 필요 종료 시 삭제/익명화한다.
- 고객 상세 조회, 수정, 삭제, 병합, 개인정보 내보내기, VIP/주의/차단 변경은 `audit_logs`에 남긴다.
- 감사 로그에는 실행자, 역할, IP, 사용자 에이전트, 대상 고객, 액션, 주요 변경 정보를 저장한다.
- 플랫폼 관리자의 고객 정보 조회는 분쟁, 개인정보 요청, 장애 대응 등 명확한 운영 사유가 있을 때만 허용한다.
- MVP에서는 직원별 권한 분리가 없지만, 후속 Phase에서 고객 정보 조회 권한과 알레르기 같은 민감 정보 접근 권한을 분리해야 한다.

## 유효성 검증과 예외 케이스

### 입력 검증

- 고객명은 필수이며 앞뒤 공백 제거 후 1자 이상이어야 한다.
- 휴대폰 번호는 필수이며 국가번호, 하이픈, 공백을 정규화해 저장한다.
- 이메일은 선택이지만 입력 시 이메일 형식을 검증한다.
- 요청사항, 알레르기, 기념일 메모, 내부 메모는 최대 길이를 제한한다.
- 알레르기와 메모에는 스크립트, HTML, 제어 문자를 허용하지 않는다.
- 기념일 날짜는 `MM-DD` 또는 `YYYY-MM-DD` 형식만 허용한다.
- 예약 인원, 예약 상태, 방문 완료/노쇼 상태는 예약 관리 Phase의 검증 규칙을 따른다.

### 예외 케이스

- 휴대폰 번호가 변경된 재방문 고객은 자동 매칭되지 않을 수 있으므로 수동 병합 후보로 처리한다.
- 같은 휴대폰 번호를 가족 또는 단체 대표가 공유하는 경우 자동 병합으로 인한 오탐 가능성이 있다. 이 경우 오너가 고객을 분리 관리할 수 있어야 한다.
- 예약 생성 중 고객 자동 생성은 성공했지만 예약 생성이 실패하면 고객 프로필 생성을 롤백한다.
- 예약 생성은 성공했지만 고객 통계 갱신이 실패하면 비동기 재계산 작업으로 복구한다.
- 병합 대상 고객에 진행 중 예약이 있으면 예약 상태와 일정 충돌을 병합 화면에서 경고한다.
- 삭제 또는 익명화된 고객의 과거 예약은 운영/정산 목적상 남을 수 있으나, 고객 식별 정보는 마스킹한다.
- 차단 고객이 예약해도 MVP에서는 자동 거절하지 않는다. 예약 리스트와 상세 화면에서 경고하고 오너가 수동 처리한다.
- 노쇼 처리 취소가 발생하면 고객의 노쇼 집계와 주의 후보 표시를 재계산한다.

## 완료 기준

- 예약 확정, 수동 예약, 전화 예약 등록 시 고객 프로필이 자동 생성 또는 매칭된다.
- 고객 목록에서 검색, 기본 필터, VIP/주의/차단 배지, 최근 방문/노쇼 요약을 확인할 수 있다.
- 고객 상세에서 프로필, 예약 이력, 방문 이력, 노쇼 이력, 요청사항, 알레르기, 기념일, 메모를 확인할 수 있다.
- 고객 프로필과 매장 메모를 생성, 수정, 삭제할 수 있다.
- VIP, 주의 고객, 차단 고객 표시를 변경할 수 있고 예약 상세에 반영된다.
- 중복 고객 후보를 조회하고 수동 병합할 수 있다.
- 고객 병합 시 예약, 방문, 노쇼, 메모 이력이 기준 고객으로 이동한다.
- 고객 상세 조회, 수정, 삭제/익명화, 병합, 표시 변경이 감사 로그에 기록된다.
- 개인정보 삭제/익명화 요청을 처리할 수 있는 API와 운영 흐름이 마련된다.
- 마케팅 자동화와 쿠폰 기능이 CRM MVP에 포함되지 않는다.

## 후속 Phase 연계

- Phase 3 예약 관리와 연결해 예약 상세, 일별 리스트, 방문 완료/노쇼 처리에서 고객 표시를 노출한다.
- Phase 4 결제/환불과 연결해 예약금 환불 여부와 노쇼 리스크 판단 정보를 고객 이력에 표시한다.
- Phase 5 좌석/재고 관리와 연결해 특정 고객 요청사항을 좌석 배정 참고 정보로 활용할 수 있다.
- Phase 7 운영 통계와 연결해 재방문율, VIP 방문 수, 노쇼 고객 비율 같은 집계 지표로 확장할 수 있다.
- MVP 이후 마케팅 자동화, 쿠폰, 캠페인 발송, 고객 세그먼트는 별도 확장 Phase로 설계한다.
- 매장 직원 계정이 도입되면 고객 정보 조회, 메모 작성, 알레르기 접근, 병합/삭제 권한을 분리해야 한다.
- 멀티지점 관리가 도입되면 지점 간 고객 공유 여부, 본사 접근 권한, 통합 고객 ID 정책을 별도 검토해야 한다.
