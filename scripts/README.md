# 실행 스크립트

모듈별 개발 서버 실행 스크립트입니다. 루트에서 실행합니다.

```bash
./scripts/run-api.sh
./scripts/run-business-web.sh
./scripts/run-customer-web.sh
```

전체를 한 번에 실행하려면 `tmux` 기반 스크립트를 사용합니다.

```bash
./scripts/run-all.sh
./scripts/stop-dev.sh
```

기본 포트와 주요 환경 변수는 다음과 같습니다.

| 모듈 | URL | 주요 환경 변수 |
| --- | --- | --- |
| BE API | `http://localhost:8080` | `API_START_DB=0`이면 MySQL compose 기동 생략 |
| 사업자 FE | `http://localhost:5173` | `BUSINESS_WEB_PORT`, `VITE_BUSINESS_API_MODE`, `VITE_BUSINESS_API_BASE_URL=auto`이면 접속 host의 `:8080` API 사용 |
| 사용자 FE | `http://localhost:3000` | `CUSTOMER_WEB_PORT`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_BASE_URL` |

루트 `package.json`에서도 동일하게 실행할 수 있습니다.

```bash
npm run dev:api
npm run dev:business
npm run dev:customer
npm run dev:all
npm run dev:stop
```
