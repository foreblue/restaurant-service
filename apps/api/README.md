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

로컬 기본 DB 접속 정보는 다음과 같습니다.

| 항목 | 값 |
| --- | --- |
| URL | `jdbc:mysql://localhost:3306/restaurant_service` |
| Username | `restaurant_app` |
| Password | `restaurant_app` |

운영/개발 환경에서는 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경 변수로 datasource를 주입합니다.
