# 전체 명령

## 개발·품질

| 명령 | 의미 |
|------|------|
| `pnpm install` | 의존 설치 |
| `pnpm dev` | 모든 앱 개발 서버 |
| `pnpm build` | 모든 앱 빌드 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm test` | 단위 테스트 |
| `pnpm e2e` | E2E (로컬 `--headed`) |
| `pnpm format` | prettier --write |
| `pnpm audit` | 보안 스캔 |

## 인프라

| 명령 | 의미 |
|------|------|
| `docker compose -f docker/docker-compose.yml up -d` | postgres 기동 |
| `docker compose -f docker/docker-compose.yml down` | 컨테이너 중지 |
| `docker compose -f docker/docker-compose.yml down -v` | 볼륨 초기화 |
| `pnpm --filter @admin-console/api db:migrate` | Prisma migration 적용 |
| `pnpm --filter @admin-console/api db:generate` | Prisma client 재생성 |
| `pnpm --filter @admin-console/api db:studio` | Prisma Studio |

- Postgres: `localhost:5432` (admin_console/admin_console)
- Redis: SSE 슬라이스 전까지 미포함
