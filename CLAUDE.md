# CLAUDE.md — Admin Console (루트)

> 이 파일은 **Claude가 이 레포에서 코드를 짤 때 지켜야 할 규약의 단일 진실원**이다.
> 핵심만 여기에, 상세는 `docs/rules/`로 참조.
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
- **인증**: Auth.js v5 + Google OIDC (core 기본) — BFF 패턴, httpOnly 쿠키. Keycloak은 on-prem 배포 시 대체 가능(docker-compose 주석으로 보존).
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
- ❌ **E2E를 `CI=1` / `--headless`로 우회 실행**. `pnpm e2e` 기본은 `--headed`(시각 확인). headless는 진짜 CI 환경에서만 자동 전환.
- ❌ **Next.js 16에서 `middleware.ts` 사용**. `proxy.ts` 컨벤션으로. 다른 프레임워크 공식 예제(Auth.js 등)를 그대로 복사하지 말 것 — 프로젝트 Next 버전의 deprecation을 먼저 확인.
- ❌ **리뷰어가 런타임 기동 없이 PASS 판정**. 상세 규율은 [docs/rules/dev-workflow.md](docs/rules/dev-workflow.md).
- ❌ **`app/**/page.tsx` / `app/**/layout.tsx` 테스트 누락**. 라우트 컴포넌트는 RTL 또는 Playwright 중 한 곳에서 반드시 커버.
- ❌ **TDD 태스크를 "실패 테스트 → 구현 → 그린" 증거 없이 체크 완료**. 증거는 리포트에 포함.
- ❌ **`app/` 하위에 라우팅 파일 외 코드 배치** (`login-form.tsx` 같은 컴포넌트). Next.js 라우팅 파일(`page.tsx`/`layout.tsx`/`route.ts`/`proxy.ts`)만 `app/`에. 나머지는 `components/`(도메인 비종속) 또는 `features/<domain>/`(도메인 종속)으로. 상세: [docs/rules/folder-conventions.md](docs/rules/folder-conventions.md).
- ❌ **파일명 casing 위반**. 컴포넌트 `.tsx`는 PascalCase, 유틸·서버 `.ts`는 kebab-case, shadcn `components/ui/*`만 kebab-case 예외. 상세는 §코드 컨벤션 표.
- ❌ **default export 남용**. `page.tsx`·`layout.tsx`만 default, 나머지는 named export 강제.

## 참조 문서

필요할 때만 펼쳐보기 — CLAUDE.md는 매 요청 로드되므로 상세는 링크로.

| 주제 | 문서 |
| --- | --- |
| apps/admin, apps/api 폴더 배치 | [docs/rules/folder-conventions.md](docs/rules/folder-conventions.md) |
| /dev 스킬의 Developer / Reviewer / Tester 규율 | [docs/rules/dev-workflow.md](docs/rules/dev-workflow.md) |
| 전체 pnpm 명령 + 인프라 명령 | [docs/rules/commands.md](docs/rules/commands.md) |
| 인프라 vs SDD 트랙 분기, SDD 산출물 위치 | [docs/rules/dev-flow.md](docs/rules/dev-flow.md) |
| 설계 개념 (BFF, httpOnly, Query Key, Prisma 등) | [docs/concepts/](docs/concepts/) |
| 진행 상황 (인프라 Step 1~N 누적) | [docs/setup.md](docs/setup.md) |
| 전체 설계 명세 (원본) | [docs/legacy/NEW-PROJECT-SPEC.md](docs/legacy/NEW-PROJECT-SPEC.md) |

## 코드 컨벤션

### 파일명

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| React 컴포넌트 `.tsx` | **PascalCase** (파일명 = 컴포넌트명) | `LoginForm.tsx`, `Header.tsx`, `UserMenu.tsx` |
| 테스트 | 대상 이름 그대로 + `.test.tsx`/`.test.ts` | `LoginForm.test.tsx`, `callback-url.test.ts` |
| 유틸·서버 코드·타입 `.ts` | **kebab-case** | `api-server.ts`, `callback-url.ts`, `auth-error-messages.ts` |
| shadcn `components/ui/*` | **kebab-case** (shadcn CLI 기본값, 예외) | `dropdown-menu.tsx`, `alert-dialog.tsx` |
| Next.js 라우팅 파일 | Next.js 규약 (`page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts` 등) 소문자 고정 | `page.tsx`, `proxy.ts` |

### Export 방식

| 파일 유형 | export |
| --- | --- |
| `app/**/page.tsx`, `app/**/layout.tsx` | **default** (Next.js 강제) |
| `app/**/route.ts`, `proxy.ts` | **named** (`GET`, `POST`, `middleware` 등, Next.js 규약) |
| 일반 컴포넌트 | **named** (`export function UserMenu() {...}`) |
| shadcn `components/ui/*` | **named** (shadcn 기본) |
| 유틸 (`lib/*`) | **named** |

default export는 위 2개 예외(page/layout)만. 그 외는 named export 강제 — rename safety + grep·refactor 안정성.

### 기타

- ESLint/Prettier가 자동 적용. 예외 규칙은 각 패키지 `CLAUDE.md`(있는 경우)에 명시.
- 주석은 "왜"만 (무엇/어떻게는 코드가 설명). 한 줄이면 충분할 때 여러 줄 쓰지 않는다.
- 커밋 메시지: Conventional Commits (`type(scope): subject`). type = feat/fix/chore/docs/refactor/test/build/perf/style/revert/ci.
