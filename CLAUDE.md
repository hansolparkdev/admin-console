# CLAUDE.md — Admin Console (루트)

> 이 파일은 **Claude가 이 레포에서 코드를 짤 때 지켜야 할 규약의 단일 진실원**이다.
> 진행 상황은 `docs/setup.md`, 설계 명세는 `docs/legacy/NEW-PROJECT-SPEC.md`.

## 프로젝트 타입

monorepo

## 모노레포 툴

Turborepo + pnpm workspace

## 런타임

- Node 22 LTS 고정 (`.nvmrc`=22, `engines.node: ">=22 <23"`)
- pnpm 10.33.0 (Corepack, `packageManager: "pnpm@10.33.0"`)

## 워크스페이스 구조

```
apps/
├── admin/   Next.js 16 App Router (어드민 콘솔, :3000)
└── api/     NestJS 11 (REST + Prisma + PostgreSQL, :3001)
packages/
├── ui/      공유 UI — 현재 placeholder. 공유 승격 대상만 admin에서 이동
├── types/   공유 타입 — 현재 placeholder
├── api-client/      (후속) OpenAPI 자동 생성
├── config-eslint/   (후속)
├── config-tailwind/ (후속)
└── config-ts/       (후속)
```

디자인 시스템(shadcn/ui + Radix + Tailwind 4 + CVA)은 `apps/admin/src/components/ui/` + `apps/admin/components.json`에 있다. 파생 프로젝트(admin-mes 등) 분기 시점에 공용 컴포넌트만 `packages/ui`로 승격한다.

## 기술 스택

- **언어**: TypeScript strict (+ `noUncheckedIndexedAccess`)
- **Frontend (apps/admin)**: Next.js 16 App Router + React 19 + shadcn/ui + Radix + Tailwind 4 + CVA
- **Backend (apps/api)**: NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis
- **인증**: Auth.js v5 + Keycloak (OIDC) — BFF 패턴, httpOnly 쿠키
- **인가**: RBAC — Role / Permission / Menu (Permission 엔티티 정규화, 패턴 B)
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand v5
- **폼**: react-hook-form + zod
- **차트**: Recharts
- **실시간**: SSE
- **테스트**: Vitest + Testing Library + MSW (단위) / Playwright (E2E) / Jest (api 기본)
- **품질**: ESLint 9 + Prettier + Husky + lint-staged
- **관측성**: Pino + `@next/bundle-analyzer` + Lighthouse CI
- **인프라**: Docker Compose + 앱별 Dockerfile
- **라이선스**: Apache-2.0
- **npm 스코프**: `@admin-console/*`

## 아키텍처 원칙

1. **실무 프로덕션 기준**으로 처음부터 설계. "일단 단순하게" 금지.
2. **도메인 중립성** — 비즈니스 특화 코드는 admin-console 본체에 넣지 않음. 파생 프로젝트에서만.
3. **확장 지점 명확** — 메뉴/라우팅/권한/DB가 구조적으로 열려있음.
4. **BFF 패턴** — 브라우저는 항상 `/api/*` (same-origin). `apps/admin/src/app/api/[...proxy]/route.ts`가 세션 → Bearer로 변환.
5. **Query Key Factory** — 모든 TanStack Query 키는 팩토리로. 문자열 리터럴 키 금지.
6. **httpOnly 쿠키 세션** — 토큰은 쿠키로만. localStorage/sessionStorage 금지.

## 금지 패턴 (절대 쓰지 말 것)

- ❌ **`NEXT_PUBLIC_API_URL` 같이 백엔드 URL을 브라우저에 노출**. `API_URL`은 서버 전용 env.
- ❌ **`localStorage` / `sessionStorage`에 토큰/세션 저장**. XSS로 유출됨. 쿠키(`httpOnly`, `Secure`, `SameSite=Lax`)만.
- ❌ **문자열 리터럴 Query Key** (`useQuery({ queryKey: ['notices'] })`). Query Key Factory 강제.
- ❌ **Server Component에서 브라우저 fetcher 호출**. 서버는 `lib/api-server.ts` (server-only + auth()), 클라이언트는 `lib/api.ts` (credentials: include).
- ❌ **`any` 남발 / `@ts-ignore` / `@ts-expect-error` without reason**. 정 필요하면 한 줄 근거 주석.
- ❌ **Prisma client를 매 요청마다 new**. 싱글톤 패턴(`global.prisma` 트릭).
- ❌ **비즈니스 로직(MES, VDI 등)을 `admin-console` 본체에 커밋**. 도메인 중립성 위반.
- ❌ **RBAC 체크를 프론트만**. 반드시 백엔드 Guard + 프론트 UI 양쪽.
- ❌ **fetch-on-render 패턴** (useEffect에서 fetch). Server Component prefetch → HydrationBoundary.
- ❌ **setState 후 await로 낙관적 업데이트**. `queryClient.setQueryData`로.
- ❌ **로딩/에러/빈 상태 미처리**. 3상태 모두 UI 있어야 함.
- ❌ **`legacy/` 폴더 수정**. `docs/legacy/**`는 동결. 원본 그대로.
- ❌ **`commitlint` 없이도 Conventional Commits 어기기**. 메시지는 `type(scope): subject` 패턴 고정.

## 핵심 폴더 규칙 (apps/admin)

- `src/app/(auth)/*` — 인증 필요 라우트 (RBAC 적용)
- `src/app/(public)/*` — 공개 라우트
- `src/app/api/*` — BFF Route Handler
- `src/features/<domain>/` — 도메인별 (api/components/queries/store/types)
- `src/lib/api.ts` — 클라이언트 fetcher (`credentials: "include"`, baseURL `/api`)
- `src/lib/api-server.ts` — 서버 fetcher (`server-only` + `auth()`)
- `src/lib/get-query-client.ts` — QueryClient 팩토리 (서버 요청마다 새로 / 브라우저 싱글톤)
- `src/components/ui/*` — shadcn 컴포넌트
- `src/lib/utils.ts` — `cn` helper (clsx + tailwind-merge)

## 핵심 폴더 규칙 (apps/api)

- `src/<domain>/` — 도메인 모듈 (controller/service/dto)
- `src/auth/` — Keycloak Strategy, Guard
- `src/rbac/` — Role/Permission/Menu, `@RequirePermission` 데코레이터
- `src/prisma/` — Prisma module, client 싱글톤

## 전체 명령

| 명령             | 의미                                       |
| ---------------- | ------------------------------------------ |
| `pnpm install`   | 의존 설치                                  |
| `pnpm dev`       | 모든 앱 개발 서버 (turbo)                  |
| `pnpm build`     | 모든 앱 빌드                               |
| `pnpm lint`      | 각 앱 ESLint (turbo run lint)              |
| `pnpm typecheck` | 각 앱 tsc --noEmit (turbo run check-types) |
| `pnpm format`    | prettier --write                           |
| `pnpm audit`     | 의존 보안 스캔                             |

DB/인프라 명령(`docker compose up -d postgres ...` 등)은 DB 인프라 셋업 후 추가.

## 개발 흐름

1. **인프라/스캐폴딩** → `docs/setup.md`에 Step으로 누적 (plan 문서 없음).
2. **제품 기능 (테스트 가능한 사용자 시나리오 있음)** → `/planning <feature>` → `/spec` → `/dev`.
3. 판단 기준: "이 작업의 산출물에 E2E 시나리오가 있는가?" 있으면 SDD, 없으면 setup.md.

## 코드 컨벤션

- ESLint/Prettier가 자동 적용. 예외 규칙은 각 패키지 `CLAUDE.md`(있는 경우)에 명시.
- 주석은 "왜"만 (무엇/어떻게는 코드가 설명). 한 줄이면 충분할 때 여러 줄 쓰지 않는다.
- 커밋 메시지: Conventional Commits (`type(scope): subject`). type = feat/fix/chore/docs/refactor/test/build/perf/style/revert/ci.
