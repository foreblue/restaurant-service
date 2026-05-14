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

## 이슈 경계

이번 기반 작업은 앱 scaffold와 실행/검증 스크립트까지만 포함한다. 인증 라우팅과 API client 연결은 후속 Step 0 이슈에서 다룬다.
