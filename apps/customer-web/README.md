# 사용자 FE

고객이 매장 공유 링크로 진입해 예약을 진행하는 공개 웹 앱이다. Next.js App Router, TypeScript strict mode, Tailwind CSS, Vitest를 기준으로 구성한다.

## 실행

```bash
pnpm --filter @restaurant/customer-web dev
pnpm --filter @restaurant/customer-web build
pnpm --filter @restaurant/customer-web test
pnpm --filter @restaurant/customer-web lint
```

루트에서는 다음 스크립트를 사용할 수 있다.

```bash
pnpm dev:customer
pnpm build:customer
pnpm test:customer
pnpm lint:customer
```

## 환경 변수

`.env.example`을 기준으로 로컬 환경 파일을 만든다.

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
```

API client와 서버 상태 관리는 후속 사용자 FE Step 0 이슈에서 확장한다.
