# 식당 예약 서비스 API

Kotlin, Spring Boot, Spring MVC, Spring Security, Spring Data JPA 기반 API 모듈입니다.

로컬 개발 DB는 `apps/api/compose.yaml`의 MySQL 8.4 컨테이너를 사용하고, schema 변경은 Flyway migration으로 관리합니다.

## 명령어

```bash
cd apps/api
docker compose up -d mysql
./gradlew build
./gradlew bootRun
```

## 테스트와 QA 회귀

API 회귀 테스트는 Spring context, MockMvc, Flyway, JPA repository, Testcontainers MySQL을 함께 사용한다.

```bash
cd apps/api
./gradlew test
```

qa-flow regression gate에서는 저장소 루트의 `./qa-regression.sh` 또는 `pnpm qa:regression`을 실행한다. 이 명령은 API 테스트를 먼저 실행한 뒤 사업자 FE lint/test/build/E2E를 실행한다. 실패 시 `apps/api/build/test-results/test/`와 `apps/api/build/reports/tests/test/index.html`을 우선 확인한다.

로컬 기본 DB 접속 정보는 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| URL | `jdbc:mysql://localhost:3306/restaurant_service` |
| Username | `restaurant_app` |
| Password | `restaurant_app` |

운영/개발 환경에서는 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경 변수로 datasource를 주입합니다.

## 로컬 초기 사업자 계정

`local` profile은 API 기동 시 초기 사업자 계정을 자동 생성합니다. 이미 같은 이메일 계정이 있으면 다시 생성하지 않습니다.

| 항목 | 기본값 |
| --- | --- |
| Email | `owner@example.com` |
| Password | `ChangeMe123!` |

환경 변수 `INITIAL_OWNER_EMAIL`, `INITIAL_OWNER_PASSWORD`, `INITIAL_OWNER_DISPLAY_NAME`으로 기본값을 바꿀 수 있습니다.
