# Phase 4. 예약금/환불 상세 스펙

## 개요

Phase 4는 예약 생성 이후의 결제, 취소, 환불 흐름을 완성해 노쇼 리스크를 줄이는 단계다. Phase 1-3에서 준비된 매장, 예약 상품, 고객 예약, 오너 예약 관리 기능 위에 예약금 결제, 전액 선결제, 카드 보증, 취소 정책, 환불 처리, 결제/환불 알림을 연결한다.

플랫폼은 맛집 탐색 서비스가 아니라 식당이 자체 예약 링크로 예약을 받는 예약 관리 SaaS이므로, 결제 기능도 예약 상품과 예약 운영에 필요한 범위로 제한한다. 실제 PG사는 특정하지 않고, PG 추상 인터페이스를 통해 승인, 취소, 환불, 웹훅 수신을 처리한다.

MVP에서는 정산 자동화를 제공하지 않는다. 플랫폼 관리자는 결제/환불 내역을 조회하고 외부 PG 관리자 화면 또는 별도 운영 절차로 수동 정산한다.

## 목표와 비목표

### 목표

- 고객이 예약 상품 정책에 따라 예약금 또는 전액을 결제하고 예약을 확정할 수 있다.
- 예약 상품이 카드 보증, 현장 결제, 무료 예약을 선택할 수 있다.
- 매장이 상품별 취소 정책을 설정하고 예약 취소 시 환불 가능 금액을 계산할 수 있다.
- 고객 취소, 매장 취소, 노쇼 처리에 따라 결제 상태와 환불 상태가 일관되게 변경된다.
- 결제 완료, 결제 실패, 환불 완료, 환불 실패, 노쇼 수수료 처리 알림을 발송한다.
- 플랫폼 관리자가 결제/환불 내역을 조회해 분쟁 대응과 수동 정산에 활용할 수 있다.

### 비목표

- 정산 자동화, 정산 대금 지급, 세금계산서 자동 발행은 MVP에서 제외한다.
- 특정 PG사 전용 기능, 포인트, 쿠폰, 간편결제사별 프로모션은 제외한다.
- 부분 방문, 인원별 부분 결제, 복수 카드 분할 결제는 제외한다.
- 고객 지갑, 예치금, 플랫폼 자체 머니 기능은 제외한다.
- POS 연동 기반 자동 방문 완료, 자동 노쇼 판정, 현장 매출 연동은 제외한다.
- 분쟁 자동 판정과 법무 판단 자동화는 제외한다.

정책 결정 필요:

- 예약금의 법적 성격, 환불 불가 조건, 노쇼 수수료 부과 가능 범위
- 고객에게 고지해야 하는 약관, 개인정보 처리, 결제 대행 동의 문구
- 카드 보증 후 노쇼 수수료를 사후 청구할 수 있는 조건과 증빙
- 매장 귀책 취소 시 플랫폼/매장 부담 수수료 처리 기준

## 사용자 역할

| 역할 | Phase 4 권한과 책임 |
| --- | --- |
| 고객 | 예약 상품 선택, 결제 방식 확인, 예약금/전액 결제, 카드 보증 등록, 예약 취소, 환불 내역 확인 |
| 매장 오너 | 상품별 결제 방식 설정, 취소 정책 설정, 예약 취소, 노쇼 처리, 결제/환불 상태 확인, 수동 정산 자료 확인 |
| 플랫폼 관리자 | 결제/환불 모니터링, 웹훅 오류 확인, 수동 환불 보정, 분쟁 대응, 수동 정산 자료 검토 |

MVP에서는 매장 직원 권한 분리를 제공하지 않으며, 오너/관리자 계정 1개 기준으로 운영한다.

## 결제/환불 시나리오

### 예약금 결제 후 정상 방문

1. 고객이 예약 상품, 날짜, 시간, 인원을 선택한다.
2. 상품의 예약금 정책에 따라 결제 금액을 확인한다.
3. 고객이 예약금을 결제한다.
4. PG 승인 성공 웹훅 또는 API 응답을 기준으로 결제 상태를 `paid`로 기록한다.
5. 예약 상태를 `confirmed`로 변경하고 예약 확정/결제 완료 알림을 발송한다.
6. 방문 후 매장 오너가 예약을 `completed`로 처리한다.
7. 예약금은 매장 정산 대상 결제 내역에 남기되, 정산 자동화는 수행하지 않는다.

### 전액 선결제 후 정상 방문

1. 고객이 전액 선결제 상품을 선택한다.
2. 상품 가격, 인원, 옵션 기준으로 선결제 금액을 계산한다.
3. 고객이 전액을 결제한다.
4. 결제 완료 시 예약을 확정한다.
5. 방문 완료 처리 후 결제 내역은 수동 정산 대상에 포함한다.

### 카드 보증 예약 후 정상 방문

1. 고객이 카드 보증 상품을 선택한다.
2. 고객은 실제 결제 없이 카드 보증 수단을 등록하거나 PG 보증 토큰을 발급받는다.
3. 보증 등록 완료 시 예약을 확정한다.
4. 정상 방문 시 사후 청구 없이 예약을 완료한다.
5. 보증 토큰 보관 기간이 끝나면 만료 또는 폐기 처리한다.

정책 결정 필요: 카드 보증 토큰의 보관 기간, 고객 고지 문구, 사후 청구 동의 범위.

### 현장 결제 예약

1. 고객이 현장 결제 상품을 선택한다.
2. 온라인 결제 없이 예약 정보를 입력한다.
3. 예약 상태를 `confirmed`로 확정한다.
4. 결제 상태는 `pay_on_site`로 기록한다.
5. 현장 결제 여부는 플랫폼에서 자동 확인하지 않는다.

### 무료 예약

1. 고객이 무료 예약 상품을 선택한다.
2. 결제 단계 없이 예약을 확정한다.
3. 결제 상태는 `not_required`로 기록한다.
4. 취소 시 환불 계산과 환불 실행은 발생하지 않는다.

### 고객 취소와 자동 환불

1. 고객이 예약 상세에서 취소를 요청한다.
2. 시스템이 방문 예정 시각과 취소 정책을 기준으로 환불 가능 금액을 계산한다.
3. 고객에게 환불 예정 금액, 환불 불가 금액, 취소 후 상태를 표시한다.
4. 고객이 취소를 확정하면 예약 상태를 `cancelled_by_customer`로 변경한다.
5. 환불 가능 금액이 있으면 PG 환불 요청을 생성한다.
6. 환불 성공 시 환불 상태를 `succeeded`로 기록하고 알림을 발송한다.

### 매장 취소와 전액 환불

1. 매장 오너가 예약 상세에서 매장 취소 사유를 입력한다.
2. 시스템은 매장 귀책 취소로 처리하고 전액 환불을 기본값으로 계산한다.
3. 예약 상태를 `cancelled_by_restaurant`로 변경한다.
4. 결제 금액이 있으면 전액 환불 요청을 생성한다.
5. 고객에게 예약 취소와 환불 안내 알림을 발송한다.

정책 결정 필요: 매장 귀책 취소의 수수료 부담 주체와 고객 보상 정책.

### 노쇼 처리와 수수료

1. 예약 방문 시간이 지난 뒤 매장 오너가 예약을 `no_show`로 처리한다.
2. 예약금/전액 선결제 상품은 취소 정책에 따라 환불 없음 또는 일부 환불 없음으로 처리한다.
3. 카드 보증 상품은 노쇼 수수료 청구 가능 조건을 확인한다.
4. 조건을 충족하면 보증 토큰으로 수수료 결제를 요청한다.
5. 청구 성공/실패 결과를 기록하고 고객에게 알림을 발송한다.

정책 결정 필요: 노쇼 판정 가능 시점, 고객 이의제기 기간, 카드 보증 청구 증빙.

## 기능 상세

### 예약금 결제

- 예약 상품은 고정 예약금 또는 인원당 예약금을 설정할 수 있다.
- 예약금 금액은 예약 확정 전 결제 요약에 표시한다.
- 결제 완료 전 예약은 `pending` 상태로 유지한다.
- 결제 성공 시 예약은 `confirmed`, 결제는 `paid`가 된다.
- 결제 실패 또는 만료 시 예약은 `payment_failed` 또는 `payment_expired`에 준하는 내부 사유를 기록하고 고객에게 재시도 경로를 제공한다.
- 기준 예약 상태 표에는 `payment_failed`, `payment_expired`가 없으므로, MVP에서는 예약 상태를 `pending`으로 유지하되 `payment_status`와 만료 사유로 구분한다.

### 전액 선결제

- 상품 가격 전체를 예약 시점에 결제한다.
- 금액 계산은 `상품 기본 가격 x 인원`을 기본으로 한다.
- 옵션, 서비스 요금, 세금 표시 방식은 MVP 범위 밖이며 필요 시 별도 정책으로 확장한다.
- 고객 취소 시 취소 정책에 따라 전액, 일부, 환불 불가를 계산한다.

정책 결정 필요: 표시 가격에 세금/봉사료 포함 여부, 인원 변경 시 선결제 차액 처리.

### 카드 보증

- 결제 승인 대신 PG 보증 토큰 또는 빌링키에 준하는 추상 토큰을 저장한다.
- 플랫폼은 실제 카드 번호를 저장하지 않는다.
- 예약 확정 조건은 보증 등록 성공이다.
- 노쇼 수수료 청구는 별도 `payment` 레코드로 생성한다.
- 토큰 만료, 인증 실패, 사후 청구 실패를 고객/매장/관리자에게 추적 가능하게 기록한다.

정책 결정 필요: 카드 보증이 가능한 PG 계약 형태와 고객 동의 문구.

### 현장 결제

- 온라인 결제 없이 예약을 확정하는 방식이다.
- 결제 상태는 `pay_on_site`로 기록한다.
- 플랫폼은 현장 결제 성공 여부를 자동 추적하지 않는다.
- 매장 오너가 예약 상세에서 내부 메모로 현장 결제 확인 여부를 기록할 수 있다.

### 무료 예약

- 결제가 필요 없는 예약 상품이다.
- 결제 상태는 `not_required`로 기록한다.
- 환불 레코드는 생성하지 않는다.
- 취소 정책은 취소 가능 여부와 노쇼 통계에만 적용한다.

### 결제 상태

| 상태 | 설명 |
| --- | --- |
| `not_required` | 무료 예약으로 결제가 필요 없음 |
| `pay_on_site` | 현장 결제 예약 |
| `requires_payment` | 온라인 결제가 필요하지만 아직 시작 전 |
| `pending` | PG 결제 승인 대기 중 |
| `paid` | 결제 완료 |
| `failed` | 결제 실패 |
| `expired` | 결제 제한 시간 만료 |
| `partially_refunded` | 일부 환불 완료 |
| `refunded` | 전액 환불 완료 |
| `refund_failed` | 환불 실패 또는 보정 필요 |
| `guarantee_registered` | 카드 보증 등록 완료 |
| `guarantee_charge_pending` | 카드 보증 노쇼 청구 진행 중 |
| `guarantee_charged` | 카드 보증 노쇼 청구 완료 |
| `guarantee_charge_failed` | 카드 보증 노쇼 청구 실패 |

### 취소 정책

- 취소 정책은 예약 상품 단위로 연결한다.
- 기본 정책 예시는 다음과 같다.
  - 방문 48시간 전까지 무료 취소
  - 방문 24시간 전까지 예약금 일부 환불
  - 방문 당일 취소 환불 불가
  - 노쇼 시 예약금 미환불
  - 매장 취소 시 전액 환불
- 정책은 시간 기준과 환불률을 조합해 계산한다.
- 정책 변경은 신규 예약부터 적용한다.
- 기존 예약에는 예약 생성 시점의 정책 스냅샷을 저장한다.

정책 결정 필요: 환불률 반올림, 원 단위 절사, 취소 기준 시각의 타임존, 고객 약관 고지 방식.

### 환불 계산

- 입력값은 예약 방문 예정 시각, 취소 요청 시각, 결제 금액, 취소 주체, 정책 스냅샷이다.
- 매장 취소는 기본적으로 전액 환불한다.
- 고객 취소는 정책 구간의 환불률을 적용한다.
- 이미 부분 환불된 금액이 있으면 추가 환불 가능 금액에서 차감한다.
- 환불 가능 금액이 0원이면 환불 레코드를 만들지 않거나 `not_applicable` 상태로 감사 로그만 남긴다.
- 계산 결과에는 `refundable_amount`, `non_refundable_amount`, `policy_rule_id`, `reason`을 포함한다.

### 환불 실행

- 환불은 PG 추상 인터페이스의 `refundPayment` 호출로 실행한다.
- 환불 요청 전 중복 환불 방지를 위해 예약/결제 단위 멱등성 키를 생성한다.
- 환불 요청 생성 시 상태는 `requested` 또는 `pending`이다.
- PG 응답 또는 웹훅으로 성공 확인 시 `succeeded`로 변경한다.
- 실패 시 `failed`로 기록하고 플랫폼 관리자 보정 대상에 노출한다.
- 환불 완료 후 고객과 매장 오너에게 알림을 발송한다.

### 결제 실패/만료

- 결제 실패 시 고객에게 실패 사유의 일반화된 메시지와 재시도 버튼을 제공한다.
- 상세 실패 코드는 관리자 로그에서만 확인한다.
- 예약 생성 후 결제 제한 시간이 지나면 결제 상태를 `expired`로 변경한다.
- `expired` 예약은 예약 가능 재고를 반환한다.
- PG에서 늦은 성공 웹훅이 들어오면 예약 만료 여부를 확인하고 자동 확정하지 않는다. 관리자 확인 대상으로 기록한다.

### 노쇼 수수료 처리

- 예약금/전액 선결제는 노쇼 처리 시 취소 정책에 따라 환불하지 않는 방식으로 수수료를 반영한다.
- 카드 보증은 노쇼 처리 후 별도 수수료 결제를 시도한다.
- 노쇼 수수료 금액은 상품 정책의 고정 금액 또는 인원당 금액으로 설정한다.
- 청구 성공 시 결제 상태를 `guarantee_charged`로 기록한다.
- 청구 실패 시 `guarantee_charge_failed`로 기록하고 관리자 확인 대상으로 남긴다.
- 고객에게 노쇼 처리와 수수료 청구 결과를 알림으로 전달한다.

정책 결정 필요: 노쇼 수수료 상한, 청구 전 고객 사전 통지 필요 여부, 이의제기 처리 방식.

## 화면/페이지 목록

### 고객 화면

- 예약 결제 요약 화면
- 결제 진행 화면
- 결제 성공 화면
- 결제 실패/재시도 화면
- 예약 상세의 취소/환불 안내 영역
- 예약 취소 확인 화면
- 환불 완료/환불 실패 안내 화면
- 카드 보증 등록 화면

### 매장 오너 화면

- 예약 상품 결제 방식 설정 화면
- 취소 정책 설정 화면
- 예약 상세 결제/환불 상태 영역
- 예약 취소 처리 모달
- 노쇼 처리 모달
- 결제/환불 내역 목록
- 수동 정산용 결제/환불 다운로드 화면

### 플랫폼 관리자 화면

- 전체 결제 내역 목록
- 전체 환불 내역 목록
- 웹훅 수신 로그 목록
- 환불 실패/보정 필요 목록
- 카드 보증 청구 실패 목록
- 분쟁 대응용 예약/결제/환불 상세 화면
- 수동 정산 검토 화면

## 데이터 모델 초안

### `payments`

| 필드 | 설명 |
| --- | --- |
| `id` | 결제 ID |
| `restaurant_id` | 매장 ID |
| `reservation_id` | 예약 ID |
| `customer_id` | 고객 ID |
| `payment_type` | `deposit`, `prepaid`, `guarantee_charge`, `onsite`, `free` |
| `status` | 결제 상태 |
| `amount` | 결제 금액 |
| `currency` | 통화, MVP 기본 `KRW` |
| `pg_provider_key` | 추상 PG 어댑터 식별자 |
| `pg_payment_id` | PG 결제 식별자 |
| `pg_order_id` | PG 주문 식별자 |
| `idempotency_key` | 결제/환불 중복 방지 키 |
| `guarantee_token_id` | 카드 보증 토큰 식별자, 원본 카드 정보 저장 금지 |
| `failure_code` | 실패 코드 |
| `failure_message` | 운영자용 실패 메시지 |
| `paid_at` | 결제 완료 시각 |
| `expires_at` | 결제 만료 시각 |
| `created_at` | 생성 시각 |
| `updated_at` | 수정 시각 |

### `refunds`

| 필드 | 설명 |
| --- | --- |
| `id` | 환불 ID |
| `payment_id` | 결제 ID |
| `reservation_id` | 예약 ID |
| `restaurant_id` | 매장 ID |
| `status` | `requested`, `pending`, `succeeded`, `failed`, `cancelled` |
| `refund_amount` | 환불 금액 |
| `non_refundable_amount` | 환불 불가 금액 |
| `reason` | `customer_cancel`, `restaurant_cancel`, `no_show_adjustment`, `admin_adjustment` |
| `policy_snapshot` | 예약 생성 시점 취소 정책 스냅샷 |
| `policy_rule_id` | 적용된 정책 규칙 ID |
| `pg_refund_id` | PG 환불 식별자 |
| `idempotency_key` | 중복 환불 방지 키 |
| `failure_code` | 실패 코드 |
| `failure_message` | 운영자용 실패 메시지 |
| `requested_by_role` | 요청자 역할 |
| `requested_at` | 요청 시각 |
| `succeeded_at` | 성공 시각 |
| `created_at` | 생성 시각 |
| `updated_at` | 수정 시각 |

### `cancellation_policies`

| 필드 | 설명 |
| --- | --- |
| `id` | 취소 정책 ID |
| `restaurant_id` | 매장 ID |
| `reservation_product_id` | 예약 상품 ID |
| `name` | 정책명 |
| `rules` | 시간 구간과 환불률 규칙 JSON |
| `no_show_rule` | 노쇼 환불/수수료 규칙 JSON |
| `restaurant_cancel_refund_rate` | 매장 취소 시 환불률, 기본 100 |
| `is_active` | 활성 여부 |
| `effective_from` | 적용 시작 시각 |
| `created_at` | 생성 시각 |
| `updated_at` | 수정 시각 |

`rules` 예시:

```json
[
  {
    "before_visit_hours": 48,
    "refund_rate": 100
  },
  {
    "before_visit_hours": 24,
    "refund_rate": 50
  },
  {
    "before_visit_hours": 0,
    "refund_rate": 0
  }
]
```

### `reservations`

Phase 2-3의 예약 모델에 다음 필드를 추가하거나 연결한다.

| 필드 | 설명 |
| --- | --- |
| `payment_required` | 결제 필요 여부 |
| `payment_mode` | `deposit`, `prepaid`, `card_guarantee`, `pay_on_site`, `free` |
| `payment_status` | 결제 상태 요약 |
| `payment_due_at` | 결제 완료 제한 시각 |
| `cancellation_policy_snapshot` | 예약 생성 시점 취소 정책 스냅샷 |
| `cancelled_at` | 취소 시각 |
| `cancelled_by_role` | 취소 주체 |
| `cancel_reason` | 취소 사유 |
| `no_show_fee_amount` | 노쇼 수수료 금액 |
| `no_show_processed_at` | 노쇼 처리 시각 |

예약 상태는 기준 문서의 `pending`, `confirmed`, `modified`, `cancelled_by_customer`, `cancelled_by_restaurant`, `completed`, `no_show`를 유지한다. 결제 실패/만료는 예약 상태를 과도하게 늘리지 않고 `payment_status`와 감사 로그로 관리한다.

### `notifications`

| 필드 | 설명 |
| --- | --- |
| `id` | 알림 ID |
| `restaurant_id` | 매장 ID |
| `reservation_id` | 예약 ID |
| `payment_id` | 결제 ID, 선택 |
| `refund_id` | 환불 ID, 선택 |
| `recipient_type` | `customer`, `owner`, `admin` |
| `channel` | `sms`, `kakao_alimtalk`, `email` |
| `template_key` | 알림 템플릿 키 |
| `status` | `queued`, `sent`, `failed`, `skipped` |
| `payload` | 발송 데이터 |
| `sent_at` | 발송 시각 |
| `created_at` | 생성 시각 |

필수 템플릿:

- 결제 완료
- 결제 실패
- 결제 만료
- 예약 취소 및 환불 예정
- 환불 완료
- 환불 실패 안내
- 카드 보증 등록 완료
- 노쇼 처리 및 수수료 청구 결과

## API 초안

### 고객 API

#### `POST /api/reservations/{reservationId}/payments`

예약 결제를 시작한다.

요청:

```json
{
  "paymentMode": "deposit",
  "returnUrl": "https://service.example.com/reservations/123/payment-return"
}
```

응답:

```json
{
  "paymentId": "pay_123",
  "status": "pending",
  "amount": 30000,
  "currency": "KRW",
  "paymentAction": {
    "type": "redirect",
    "url": "https://pg.example.test/checkout/token"
  },
  "expiresAt": "2026-05-14T10:15:00+09:00"
}
```

#### `GET /api/reservations/{reservationId}/payment-summary`

예약 결제 요약과 취소 정책 스냅샷을 조회한다.

응답:

```json
{
  "reservationId": "res_123",
  "paymentMode": "deposit",
  "amount": 30000,
  "currency": "KRW",
  "cancellationPolicySummary": "방문 48시간 전 무료 취소, 24시간 전 50% 환불, 당일 환불 불가"
}
```

#### `POST /api/reservations/{reservationId}/guarantee`

카드 보증 등록을 시작한다.

요청:

```json
{
  "returnUrl": "https://service.example.com/reservations/123/guarantee-return"
}
```

응답:

```json
{
  "paymentId": "pay_456",
  "status": "pending",
  "guaranteeAction": {
    "type": "redirect",
    "url": "https://pg.example.test/guarantee/token"
  }
}
```

#### `POST /api/reservations/{reservationId}/cancel`

고객이 예약을 취소한다.

요청:

```json
{
  "reason": "일정 변경",
  "confirmRefundAmount": 15000
}
```

응답:

```json
{
  "reservationId": "res_123",
  "reservationStatus": "cancelled_by_customer",
  "refund": {
    "refundId": "ref_123",
    "status": "pending",
    "refundAmount": 15000,
    "nonRefundableAmount": 15000
  }
}
```

#### `GET /api/reservations/{reservationId}/refund-preview`

취소 전 환불 예상 금액을 조회한다.

응답:

```json
{
  "refundableAmount": 15000,
  "nonRefundableAmount": 15000,
  "policyRuleId": "rule_24h_50",
  "message": "방문 24시간 전 취소로 예약금의 50%가 환불됩니다."
}
```

### 매장 오너 API

#### `PUT /api/owner/reservation-products/{productId}/payment-policy`

예약 상품의 결제 방식을 설정한다.

요청:

```json
{
  "paymentMode": "deposit",
  "depositType": "per_person",
  "depositAmount": 10000,
  "noShowFeeAmount": 30000
}
```

응답:

```json
{
  "productId": "prod_123",
  "paymentMode": "deposit",
  "depositAmount": 10000,
  "updatedAt": "2026-05-14T09:00:00+09:00"
}
```

#### `POST /api/owner/reservation-products/{productId}/cancellation-policy`

취소 정책을 생성하거나 갱신한다.

요청:

```json
{
  "name": "기본 취소 정책",
  "rules": [
    { "beforeVisitHours": 48, "refundRate": 100 },
    { "beforeVisitHours": 24, "refundRate": 50 },
    { "beforeVisitHours": 0, "refundRate": 0 }
  ],
  "noShowRule": {
    "refundRate": 0,
    "feeAmount": 30000
  }
}
```

응답:

```json
{
  "policyId": "pol_123",
  "isActive": true
}
```

#### `POST /api/owner/reservations/{reservationId}/cancel`

매장 사유로 예약을 취소하고 환불을 실행한다.

요청:

```json
{
  "reason": "매장 사정으로 운영 불가",
  "notifyCustomer": true
}
```

응답:

```json
{
  "reservationStatus": "cancelled_by_restaurant",
  "refund": {
    "status": "pending",
    "refundAmount": 30000
  }
}
```

#### `POST /api/owner/reservations/{reservationId}/no-show`

노쇼 처리와 수수료 청구를 실행한다.

요청:

```json
{
  "reason": "방문 시간 30분 경과 후 미방문",
  "chargeGuarantee": true
}
```

응답:

```json
{
  "reservationStatus": "no_show",
  "paymentStatus": "guarantee_charge_pending"
}
```

#### `GET /api/owner/payments`

매장 결제 내역을 조회한다.

응답:

```json
{
  "items": [
    {
      "paymentId": "pay_123",
      "reservationId": "res_123",
      "status": "paid",
      "amount": 30000,
      "paidAt": "2026-05-14T09:10:00+09:00"
    }
  ]
}
```

#### `GET /api/owner/refunds`

매장 환불 내역을 조회한다.

### 플랫폼 관리자 API

#### `GET /api/admin/payments`

전체 결제 내역을 상태, 매장, 기간, PG 식별자로 조회한다.

#### `GET /api/admin/refunds`

전체 환불 내역과 실패/보정 필요 건을 조회한다.

#### `POST /api/admin/refunds/{refundId}/retry`

실패한 환불을 재시도한다.

#### `POST /api/admin/refunds/{refundId}/mark-manual-resolved`

PG 관리자 화면 등에서 수동 처리한 환불을 보정 완료로 표시한다.

요청:

```json
{
  "memo": "PG 관리자 화면에서 2026-05-14 15:20 수동 환불 확인"
}
```

#### `POST /api/pg/webhooks`

PG 웹훅을 수신한다. PG사별 어댑터가 공통 이벤트로 변환한다.

공통 이벤트 예시:

```json
{
  "eventId": "evt_123",
  "eventType": "payment.succeeded",
  "pgPaymentId": "pg_pay_123",
  "amount": 30000,
  "occurredAt": "2026-05-14T09:10:05+09:00",
  "signature": "signature-value"
}
```

## 결제/환불 상태 전이

### 예약금/전액 선결제

```text
requires_payment
  -> pending
  -> paid
  -> partially_refunded
  -> refunded
```

예외 전이:

```text
pending -> failed -> pending
pending -> expired
paid -> refund_failed
refund_failed -> partially_refunded
refund_failed -> refunded
```

### 카드 보증

```text
requires_payment
  -> pending
  -> guarantee_registered
  -> guarantee_charge_pending
  -> guarantee_charged
```

예외 전이:

```text
pending -> failed
pending -> expired
guarantee_charge_pending -> guarantee_charge_failed
guarantee_charge_failed -> guarantee_charge_pending
```

### 현장 결제/무료 예약

```text
pay_on_site
not_required
```

두 상태는 온라인 환불 흐름을 타지 않는다.

### 환불

```text
requested -> pending -> succeeded
requested -> failed
pending -> failed
failed -> pending
```

환불 상태가 `succeeded`가 되면 결제의 누적 환불 금액을 재계산해 결제 상태를 `partially_refunded` 또는 `refunded`로 갱신한다.

## PG 연동 경계와 웹훅 처리

### PG 추상 인터페이스

실제 PG사를 특정하지 않고 다음 인터페이스로 분리한다.

```text
createPayment(request) -> PaymentAction
confirmPayment(request) -> PaymentResult
registerGuarantee(request) -> GuaranteeAction
chargeGuarantee(request) -> PaymentResult
refundPayment(request) -> RefundResult
parseWebhook(request) -> PgWebhookEvent
verifyWebhookSignature(request) -> boolean
```

### 플랫폼 책임

- 예약, 결제, 환불 상태의 원장 역할을 한다.
- PG 요청 전 금액, 예약 소유권, 정책 스냅샷을 검증한다.
- 결제/환불 멱등성 키를 생성하고 중복 요청을 차단한다.
- 웹훅 이벤트를 검증, 저장, 처리한다.
- 고객/오너/관리자 알림을 발송한다.

### PG 어댑터 책임

- PG별 요청/응답 포맷 변환
- 서명 검증
- PG 오류 코드를 플랫폼 공통 오류 코드로 매핑
- PG 웹훅 이벤트를 공통 이벤트로 변환

### 웹훅 처리 원칙

- 모든 웹훅은 원본 페이로드와 검증 결과를 저장한다.
- `eventId`와 PG 결제/환불 식별자로 멱등 처리한다.
- 서명 검증 실패 웹훅은 상태 변경 없이 관리자 로그에 남긴다.
- 결제 금액이 플랫폼 주문 금액과 다르면 상태 변경 없이 관리자 확인 대상으로 둔다.
- 이미 취소/만료된 예약에 결제 성공 웹훅이 도착하면 자동 확정하지 않는다.
- 웹훅 처리 실패는 재처리 큐 또는 관리자 재처리 버튼으로 복구한다.
- API 응답과 웹훅이 모두 도착할 수 있으므로 먼저 도착한 유효 이벤트만 상태 전이에 반영한다.

## 정산 자동화 제외 및 수동 정산 운영 방식

MVP에서는 정산 자동화를 제외한다. `settlements` 테이블, 자동 지급 스케줄러, 매장별 정산 계좌 송금, 세금계산서 자동 발행, 수수료 자동 차감은 구현하지 않는다.

수동 정산 운영 방식:

1. 플랫폼 관리자가 기간별 결제/환불 내역을 조회한다.
2. 매장별 총 결제 금액, 총 환불 금액, 노쇼 수수료, 보정 건을 확인한다.
3. PG 관리자 화면 또는 외부 정산 자료와 대조한다.
4. 운영 정책에 따라 매장별 지급 금액을 수동 계산한다.
5. 외부 금융 시스템에서 수동 이체 또는 별도 정산 절차를 수행한다.
6. 정산 완료 여부는 MVP에서는 메모 또는 운영 로그로만 관리한다.

수동 정산 화면 최소 정보:

- 기간
- 매장명
- 결제 총액
- 환불 총액
- 순 결제액
- 노쇼 수수료 결제액
- 환불 실패/수동 보정 건수
- CSV 다운로드

정책 결정 필요: 플랫폼 수수료율, PG 수수료 부담 주체, 정산 주기, 세무 증빙 방식.

## 유효성 검증과 예외 케이스

### 유효성 검증

- 예약이 고객 또는 매장 오너의 접근 권한 범위에 속해야 한다.
- 예약 상태가 결제 가능한 상태여야 한다.
- 결제 금액은 서버에서 계산하며 클라이언트 입력 금액을 신뢰하지 않는다.
- 결제 통화는 MVP에서 `KRW`만 허용한다.
- 결제 만료 시간이 지나면 새 결제 시도를 생성해야 한다.
- 취소 정책은 환불률 0-100 범위와 중복되지 않는 시간 구간을 가져야 한다.
- 환불 금액은 결제 금액에서 기존 환불 성공 금액을 뺀 값보다 클 수 없다.
- 매장 취소 환불은 기본 100%이며, 예외 정책은 관리자 권한과 감사 로그가 필요하다.
- 카드 보증 수수료는 상품 정책에 설정된 한도를 초과할 수 없다.
- 웹훅 금액, 통화, PG 결제 ID가 내부 결제 정보와 일치해야 한다.

### 예외 케이스

| 케이스 | 처리 |
| --- | --- |
| 결제 승인 후 예약 확정 처리 실패 | 결제는 `paid`, 예약은 관리자 확인 대상으로 표시하고 재처리 |
| 예약 만료 후 결제 성공 웹훅 수신 | 자동 확정 금지, 관리자 보정 대상으로 표시 |
| 중복 웹훅 수신 | `eventId` 기준으로 무시하고 처리 이력만 남김 |
| 고객 취소와 매장 취소 동시 요청 | 먼저 커밋된 상태 전이만 인정하고 이후 요청은 충돌 응답 |
| 환불 요청 후 PG 타임아웃 | `pending`으로 유지하고 웹훅 또는 조회 재시도로 확정 |
| 부분 환불 후 추가 취소/보정 | 누적 환불 금액 기준으로 재계산 |
| 카드 보증 토큰 만료 | 예약 상세에 보증 만료 표시, 관리자 확인 또는 고객 재등록 요청 |
| 노쇼 수수료 청구 실패 | 고객/관리자 알림, 수동 대응 상태로 기록 |
| 알림 발송 실패 | 결제/환불 상태는 유지하고 알림 재시도 대상으로 기록 |
| PG 장애 | 결제 시작 차단 또는 대기 안내, 관리자 장애 로그 기록 |
| 무료 예약 취소 | 환불 없이 예약 상태만 취소로 변경 |
| 현장 결제 예약 취소 | 온라인 환불 없이 예약 상태만 취소로 변경 |

## 완료 기준

- 예약 상품별로 예약금 결제, 전액 선결제, 카드 보증, 현장 결제, 무료 예약을 설정할 수 있다.
- 고객 예약 플로우에서 결제 필요 여부에 따라 결제/보증/무결제 예약 확정이 정상 동작한다.
- 결제 성공, 실패, 만료 상태가 예약 상세와 오너 화면에 일관되게 표시된다.
- 고객 취소 시 취소 정책 스냅샷 기준으로 환불 예상 금액을 보여주고 환불을 실행한다.
- 매장 취소 시 전액 환불을 기본값으로 실행한다.
- 환불 성공/실패 상태가 결제 상태와 누적 환불 금액에 반영된다.
- 노쇼 처리 시 예약금 미환불 또는 카드 보증 수수료 청구 흐름이 동작한다.
- 결제/환불/노쇼 관련 필수 알림이 발송 또는 재시도 대상으로 기록된다.
- PG 웹훅은 서명 검증, 멱등 처리, 금액 검증, 재처리 로그를 갖춘다.
- 플랫폼 관리자는 결제/환불 내역과 실패 건을 조회할 수 있다.
- 수동 정산에 필요한 기간별 매장 결제/환불 자료를 조회하거나 CSV로 받을 수 있다.
- 정산 자동화가 MVP 제외임이 화면과 운영 문서에서 명확히 구분된다.
- 법무/약관 확정이 필요한 정책은 `정책 결정 필요` 항목으로 추적된다.

## 후속 Phase 연계

- Phase 5. 좌석/재고 관리: 결제 만료, 예약 취소, 환불 완료 시 타임슬롯 재고 반환과 중복 예약 방지 정책을 정교화한다.
- Phase 6. 고객 관리/CRM: 결제 실패, 환불 이력, 노쇼 이력, 카드 보증 청구 실패를 고객 프로필과 주의 고객 표시 기준에 연결한다.
- Phase 7. 운영 통계: 예약금 매출, 환불 금액, 노쇼 수수료, 결제 실패율, 취소 정책별 환불 비율을 통계 지표로 확장한다.
- 정산 고도화 후속 작업: MVP 이후 `settlements` 모델, 매장별 정산 주기, 플랫폼 수수료, 자동 지급, 세무 증빙 연계를 별도 Phase 또는 운영 과제로 정의한다.
