# Prisma 7 Driver Adapter

## 한 줄 정의

Prisma 7부터 PostgreSQL 연결을 **`@prisma/adapter-pg` + `pg` 드라이버를 통해** 하도록 바뀐 런타임 구조. `datasource { url = env(...) }` 문법은 폐기.

## 왜 이렇게 바뀌었나

### Prisma 6까지

Prisma가 자체 개발한 Rust 기반 **Query Engine**을 별도 바이너리로 포함 → Node가 이 바이너리와 IPC로 통신 → 바이너리가 PostgreSQL과 말한다.

문제점:
- **배포 복잡도** — 플랫폼별 바이너리 필요 (linux-x64, darwin-arm64, alpine, ...). Docker 이미지 사이즈 큼.
- **Edge Runtime 불가** — Vercel Edge, Cloudflare Workers에서 Rust 바이너리 못 올림.
- **bundler 충돌** — Next.js, webpack 등 번들러가 바이너리를 어떻게 포함할지 모름.

### Prisma 7

Rust 쿼리 엔진을 **완전 제거**. 대신 각 DB용 JS 드라이버(`pg`, `mysql2`, `better-sqlite3` 등)를 "어댑터"로 꽂는 방식.

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

이점:
- 바이너리 0. 순수 JS.
- Edge Runtime 가능.
- DB 드라이버를 원하는 것으로 교체 가능 (`node-postgres` vs `postgres.js` 등).
- 번들러와 호환.

### Breaking changes 요약

| 항목 | Prisma 6 이하 | Prisma 7 |
|---|---|---|
| schema의 datasource URL | `url = env("DATABASE_URL")` | **금지**. `prisma.config.ts`로 이관. |
| PrismaClient 생성 | `new PrismaClient()` (URL 자동) | `new PrismaClient({ adapter })` 필수 |
| 런타임 URL 옵션 | `datasources: { db: { url } }` | **폐기**. `adapter: new PrismaPg({ connectionString })` |
| Query Engine | Rust 바이너리 포함 | 제거 |
| preview feature | `previewFeatures = ["driverAdapters"]` optional | **필수** |

## 우리 구조에서 어디에

| 파일 | 역할 |
|---|---|
| `apps/api/prisma/schema.prisma` | 모델 정의. `provider = "postgresql"`만 있고 `url`은 없음. `previewFeatures = ["driverAdapters"]`. |
| `apps/api/prisma.config.ts` | Prisma CLI(`migrate`, `generate`, `studio`)용 설정. 여기서 `datasource.url = process.env.DATABASE_URL`. |
| `apps/api/src/prisma/prisma.service.ts` | 런타임. `new PrismaPg({ connectionString })` → `super({ adapter })`. |
| `.env` (루트) | `DATABASE_URL=postgresql://admin_console:admin_console@localhost:5432/admin_console?schema=public` |
| `apps/api/src/main.ts` | `loadRootEnv()` 헬퍼로 .env를 NestFactory 생성 전에 로드 |

## 왜 이렇게 나눠져 있나

### CLI는 `prisma.config.ts`, 런타임은 `PrismaService`

두 곳이 각자 URL을 로드해야 한다:

- **CLI 시점** (`pnpm prisma migrate dev`): `prisma.config.ts`가 `dotenv`로 `.env` 로드해서 `datasource.url`로 넘김. 마이그레이션 생성·적용용.
- **런타임 시점** (`pnpm start:dev`): NestJS 프로세스가 기동. `main.ts`의 `loadRootEnv()`가 `.env` 로드 → `PrismaService` 생성자에서 `process.env.DATABASE_URL`을 읽어 `PrismaPg`에 전달.

같은 DATABASE_URL을 보지만 **로딩 경로가 분리**돼 있어야 각 시점에 안정적.

### Singleton

```ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  // ...
}
```

NestJS `@Global()` 모듈로 등록되어 전 앱에서 **하나의 인스턴스만** 공유.

CLAUDE.md 금지 패턴 중 "Prisma client를 매 요청마다 new" — 이걸 막는 이유는 **connection pool 고갈**. PrismaClient는 내부에 pool을 들고 있는데, 요청마다 new하면 pool 수십 개가 중첩돼 DB가 `too many connections`로 거절.

## 마이그레이션 명령

| 명령 | 언제 |
|---|---|
| `pnpm --filter @admin-console/api db:migrate` | 개발 중 스키마 변경 → migration 파일 생성 + 즉시 적용 |
| `pnpm --filter @admin-console/api db:migrate:deploy` | 프로덕션 배포 — 이미 생성된 migration만 적용, 생성 안 함 |
| `pnpm --filter @admin-console/api db:generate` | schema.prisma 바꾼 뒤 PrismaClient 타입 재생성 |
| `pnpm --filter @admin-console/api db:studio` | Prisma Studio GUI — 데이터 즉석 편집 |

## 흔한 함정

### 1. pnpm 모노레포 + Prisma Client 경로
pnpm은 `.pnpm/` 해시 폴더에 패키지를 둔다. `prisma generate`가 client를 그 안에 생성하니 `@prisma/client`를 import할 때 "타입을 못 찾는다"고 뜨면 **`pnpm install`**과 **`db:generate`**를 다시 돌려라.

### 2. schema.prisma에 `url`을 다시 적는 실수
Prisma 7 에러 메시지가 명확히 표시된다:
```
Error: The datasource property `url` is no longer supported in schema files.
```
`prisma.config.ts`로 옮기고 schema에선 `provider`만 유지.

### 3. `previewFeatures = ["driverAdapters"]` 누락
런타임은 동작하나 CLI가 "not enabled"로 거절. schema에 반드시 명시.

### 4. 로컬 .env 누락 → 런타임 에러
```
PrismaClientInitializationError: PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions
```
`loadRootEnv()`가 호출되기 전에 PrismaService 생성자가 돌면 발생. `main.ts`의 import 순서 중요 — `dotenv` → `AppModule` → `NestFactory`.

### 5. Edge Runtime에서는 `pg` 대신 `neon` / `@prisma/adapter-neon`
`pg`는 Node-only. Vercel Edge에 올리려면 neon-http 어댑터로 바꿔야 함. 우리 API는 지금 Node 서버라 `pg` OK.

## 대안과 trade-off

| DB / 어댑터 | 언제 |
|---|---|
| **`@prisma/adapter-pg` + `pg`** (우리) | 표준 PostgreSQL + Node 서버 |
| `@prisma/adapter-neon` | Neon PostgreSQL, Edge Runtime |
| `@prisma/adapter-libsql` | Turso / libSQL, Edge |
| `@prisma/adapter-d1` | Cloudflare D1 |
| Prisma 6 (구버전 유지) | 마이그레이션 부담이 크고 Edge 필요 없을 때 — 단기 임시방편 |

## 참고 자료

- [Prisma 7 Release Notes](https://github.com/prisma/prisma/releases)
- [Prisma — Driver Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [`@prisma/adapter-pg` README](https://www.npmjs.com/package/@prisma/adapter-pg)
- [Prisma — `prisma.config.ts` guide](https://pris.ly/d/prisma-config)
- [node-postgres (pg) docs](https://node-postgres.com/)
