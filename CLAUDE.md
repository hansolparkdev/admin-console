# CLAUDE.md — Admin Console (루트)

> 범용 운영 플랫폼 기반 (core + 비즈니스 모듈 확장형).
> 상세 설계는 `docs/legacy/NEW-PROJECT-SPEC.md` 참조 (단일 진실원).

## 프로젝트 타입

monorepo

## 모노레포 툴

Turborepo + pnpm workspace

## 런타임

Node 22 LTS + pnpm

## 워크스페이스 구조 (목표)

```
apps/
├── admin/          Next.js 16 App Router (어드민 콘솔)
└── api/            NestJS 11 (REST + Prisma 7 + PostgreSQL 16)
packages/
├── ui/             (현재 placeholder — 디자인 시스템은 apps/admin 내부에서 성장 중. 공유 승격 대상만 이후 이동)
├── types/          공유 타입 (현재 placeholder)
├── api-client/     OpenAPI 자동 생성 클라이언트 (후속)
├── config-eslint/  공유 ESLint preset (후속)
├── config-tailwind/공유 Tailwind preset (후속)
└── config-ts/      공유 tsconfig (후속)
```

> 실제 디자인 시스템(shadcn/ui + Radix + Tailwind 4 + CVA)은 `apps/admin/src/components/ui/` 및 `apps/admin/components.json`. 파생 프로젝트 분기 시점에 공용 컴포넌트를 `packages/ui`로 승격.

## 기술 스택 (확정)

- **언어**: TypeScript (strict)
- **Frontend**: Next.js 16 App Router + React 19 + shadcn/ui + Radix + Tailwind 4
- **Backend**: NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis
- **인증**: Auth.js v5 + Keycloak (OIDC) — BFF 패턴, httpOnly 쿠키
- **인가**: RBAC (Role/Permission/Menu) — 패턴 B (Permission 엔티티 정규화)
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand v5
- **폼**: react-hook-form + zod v3
- **차트**: Recharts
- **실시간**: SSE
- **테스트**: Playwright (E2E) + Vitest + Testing Library + MSW
- **품질**: ESLint 9 + Prettier + Husky + lint-staged + commitlint + Changesets
- **관측성**: Pino + @next/bundle-analyzer + Lighthouse CI
- **인프라**: Docker Compose + 앱별 Dockerfile

## 아키텍처 원칙

1. **실무 프로덕션 기준**으로 처음부터 설계. "일단 단순하게" 금지.
2. **도메인 중립성** — 비즈니스 특화 코드는 admin-console 본체에 넣지 않음.
3. **확장 지점 명확** — 메뉴/라우팅/권한/DB가 구조적으로 열려있음.
4. **BFF 패턴** — `apps/admin/src/app/api/[...proxy]/route.ts`가 세션 → Bearer 전환.
   `API_URL`은 서버 전용 env (`NEXT_PUBLIC_` 금지).
5. **Query Key Factory** 강제 — 문자열 리터럴 키 금지.
6. **httpOnly 쿠키 세션** — localStorage/sessionStorage에 토큰 저장 금지.

## 핵심 폴더 규칙 (apps/admin)

- `src/app/(auth)/*` — 인증 필요 라우트 (RBAC 적용)
- `src/app/(public)/*` — 공개 라우트
- `src/app/api/*` — BFF Route Handler
- `src/features/<domain>/` — 도메인별 (api/components/queries/store/types)
- `src/lib/api.ts` — 클라이언트 fetcher (`credentials: include`, baseURL `/api`)
- `src/lib/api-server.ts` — 서버 fetcher (`server-only` + `auth()`)
- `src/lib/get-query-client.ts` — QueryClient 팩토리 (서버 요청마다 새로 / 브라우저 싱글톤)

## 도메인

IAM / 공통 코드 / 프로필 / 공지 / 일정 / 대시보드 (상세는 spec 4절)

## 전체 명령 (스캐폴딩 완료 후)

- 설치: `pnpm install`
- 개발: `pnpm dev` (turbo)
- 빌드: `pnpm build`
- 단위 테스트: `pnpm test`
- E2E: `pnpm e2e` (Playwright, 기본 헤드리스)
- 린트: `pnpm lint`
- 타입체크: `pnpm typecheck`
- 보안 스캔: `pnpm audit`
- DB: `docker compose up -d postgres keycloak redis`

## 개발 흐름

1. `/planning <기능>` — 기획서 작성
2. `/spec <기능>` — 아키텍트가 SDD 산출물 생성
3. `/dev <slice>` — TDD 개발 → 리뷰 → 테스트 → 커밋

## 현재 상태

- **셋업 트랙 진행 중** (`docs/setup.md`):
  - Step 1~4 ✅ 부트스트랩: Turborepo + pnpm, admin(Next 16 + Tailwind 4 + Turbopack, :3000), api(NestJS 11, :3001), packages/ui+types placeholder
  - Step 5 ✅ 디자인 시스템: shadcn v4.2 Nova preset. Radix + Lucide + Geist. admin 내부에 Button/Card/Input. CSS-only Tailwind 4 config
  - Step 6 ✅ Husky + lint-staged (pre-commit에 prettier). commitlint는 B로 보류
- **우선순위 A (SDD 진입 전)** — 남은 것:
  - Step 7 DB 인프라 (docker-compose + Prisma)
  - Step 8 BFF route handler 골격
  - Step 9 인증 (Keycloak + Auth.js)
  - Step 10 RBAC 베이스
- **우선순위 B (필요해질 때)**: Storybook, packages/config-\* 통합, commitlint, GitHub Actions CI, dependabot, 거버넌스, packages/api-client
- **이후**: IAM 관리자 CRUD부터 SDD 풀 루프(`/planning iam-admin`)
- **참고 문서**:
  - `docs/setup.md` — 초기 세팅 작업 일지 (Step 1~4 완료 기록)
  - `docs/legacy/NEW-PROJECT-SPEC.md` — 전체 설계 명세 (원본)
  - `docs/legacy/01~09.md` — 레거시 프로젝트 학습 자료 (참고용)
  - `docs/harness.md` — 훅 설계
  - `docs/workflow.md` — 개발 워크플로우
  - `apps/admin/AGENTS.md` — Next.js 16 deprecation 가이드 (next 코드 짤 때 참조)

## 이전 실무 레퍼런스

`/Users/parkhansol/work/devel/uplex-dev/vdi-dev/usp-core-service/frontrend/usp-core-web-admin-module`
— Keycloak OIDC 자체 구현 (Vite + React SPA). 패턴 참고용.

## 코드 컨벤션

린트가 자동 적용. 별도 예외 사례는 각 패키지 CLAUDE.md에.

## 패키지별 CLAUDE.md

스캐폴딩 이후 각 `apps/*`, `packages/*`에 생성 예정.
