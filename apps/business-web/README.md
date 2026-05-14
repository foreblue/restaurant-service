# 사업자 FE 앱

`apps/business-web`은 매장 오너가 예약 운영과 매장 설정을 수행하는 Vite React 기반 SPA다.

## 실행 스크립트

- `pnpm dev`: Vite 개발 서버 실행
- `pnpm build`: TypeScript strict mode 검사 후 production build
- `pnpm test`: Vitest 단위 테스트 실행
- `pnpm lint`: ESLint 검사
- `pnpm format`: Prettier 포맷 검사

루트에서도 같은 이름의 스크립트를 실행하면 이 앱으로 위임된다.

## UI 기준

- Tailwind CSS v4와 shadcn/ui 설정(`components.json`, CSS variable token, `@/lib/utils`)을 기본값으로 사용한다.
- 아이콘은 `lucide-react`에서 가져오며, 아이콘 단독 버튼에는 접근 가능한 `aria-label`을 둔다.
- 운영 도구 화면은 정보 밀도와 반복 사용성을 우선한다. 큰 마케팅 섹션 대신 탐색, 상태, 작업 진입점을 첫 화면에 둔다.

## API 모드

- 기본값은 `VITE_BUSINESS_API_MODE=mock`이며 브라우저 `localStorage`로 세션을 흉내 낸다.
- 실제 BE 연동은 `VITE_BUSINESS_API_MODE=http`와 `VITE_BUSINESS_API_BASE_URL`을 설정해 `/api/business` API를 호출한다.
- OpenAPI 생성 client가 추가되면 `src/shared/api/businessApiClient.ts`의 HTTP adapter 뒤에 연결한다.

## 공통 UI와 상태 기준

- 기본 입력 컴포넌트는 `src/components/ui`에서 가져온다.
- 표는 `src/components/table/DataTable.tsx`와 TanStack Table column 정의를 조합한다.
- 확인 다이얼로그와 toast는 `src/components/feedback` 패턴을 사용한다.
- 서버 상태는 TanStack Query, 일시적인 UI 상태는 Zustand store로 분리한다.
- 폼은 React Hook Form과 Zod schema를 함께 두고, 검증 메시지는 필드 아래에 표시한다.

## 이슈 경계

현재 기반 작업은 인증 라우팅, Shell layout, business API wrapper, 공통 UI/폼/상태 패턴까지 포함한다. 상세 로그인/비밀번호 재설정 UX와 도메인별 운영 화면은 후속 이슈에서 다룬다.
