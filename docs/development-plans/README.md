# 모듈별 개발 계획 목차

이 디렉터리는 식당 예약 플랫폼을 사용자 FE, 사업자 FE, BE 모듈로 나누어 구현하기 위한 단계별 개발 계획을 정리한다.

기준 문서:

- [식당 예약 플랫폼 기획 정리](../restaurant-reservation-platform-plan.md)
- [식당 예약 플랫폼 기술 스펙](../technical-spec.md)
- [Phase 상세 스펙](../phases/README.md)

## 문서 목록

| 모듈 | 문서 | 구현 기준 |
| --- | --- | --- |
| 사용자 FE | [사용자 FE 개발 계획](./customer-fe-development-plan.md) | `apps/customer-web`, Next.js App Router |
| 사업자 FE | [사업자 FE 개발 계획](./business-fe-development-plan.md) | `apps/business-web`, Vite React SPA |
| BE | [BE 개발 계획](./backend-development-plan.md) | `apps/api`, Kotlin + Spring Boot + MySQL |

## 공통 개발 원칙

- MVP는 Phase 1-4까지를 최소 완성 범위로 본다.
- Phase 5-7은 운영 품질을 높이는 확장 단계로 구현한다.
- 웨이팅, 지도, 통합 검색은 제품 범위에서 제외한다.
- 직원 권한, 단체 예약, POS 연동, 멀티지점 관리, 정산 자동화는 MVP 범위에서 제외한다.
- API 계약은 백엔드 OpenAPI 3.1 문서를 기준으로 생성하고, FE는 생성된 TypeScript 클라이언트를 사용한다.
- 각 모듈은 독립 배포 가능하게 구성하되, 초기 저장소는 모노레포 구조를 따른다.
