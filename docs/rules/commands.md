# 전체 명령

## 개발·품질

| 명령             | 의미                                                         |
| ---------------- | ------------------------------------------------------------ |
| `pnpm install`   | 의존 설치                                                    |
| `pnpm dev`       | 모든 앱 개발 서버 (turbo)                                    |
| `pnpm build`     | 모든 앱 빌드                                                 |
| `pnpm lint`      | 각 앱 ESLint (turbo run lint)                                |
| `pnpm typecheck` | 각 앱 tsc --noEmit (turbo run check-types)                   |
| `pnpm test`      | 단위 테스트 (Vitest 등, 각 앱 test 스크립트)                 |
| `pnpm e2e`       | E2E 테스트 (Playwright, 기본 `--headed` / CI는 `--headless`) |
| `pnpm format`    | prettier --write                                             |
| `pnpm audit`     | 의존 보안 스캔                                               |

## 인프라

| 명령                                                  | 의미                                    |
| ----------------------------------------------------- | --------------------------------------- |
| `docker compose -f docker/docker-compose.yml up -d`   | postgres + keycloak 기동                |
| `docker compose -f docker/docker-compose.yml down`    | 컨테이너 중지·제거 (볼륨 유지)          |
| `docker compose -f docker/docker-compose.yml down -v` | + 볼륨 초기화 (init SQL 재실행 필요 시) |
| `pnpm --filter @admin-console/api db:migrate`         | Prisma migration dev 적용               |
| `pnpm --filter @admin-console/api db:generate`        | Prisma client 재생성                    |
| `pnpm --filter @admin-console/api db:studio`          | Prisma Studio GUI                       |

- Postgres: `localhost:5432` (user/pw: `admin_console`/`admin_console`, DBs: `admin_console`, `keycloak`)
- Keycloak: `http://localhost:8080` (admin/admin)
- Redis는 SSE 슬라이스 전까지 미포함 (`docker/docker-compose.yml`에 주석으로 남음)
