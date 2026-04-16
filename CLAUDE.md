# CLAUDE.md — Admin Console (루트)

> Claude가 이 레포에서 코드 짤 때 지켜야 할 규약의 **목차**.
> 상세는 반드시 `docs/rules/`의 개별 문서를 **Read로 열어** 확인한다.
> 진행 상황은 `docs/setup.md`, 설계 명세는 `docs/legacy/NEW-PROJECT-SPEC.md`.

## 기본

- **프로젝트 타입**: monorepo (Turborepo + pnpm workspace)
- **런타임**: Node 22 LTS (`.nvmrc=22`), pnpm 10.33.0 (Corepack, `packageManager: "pnpm@10.33.0"`)
- **npm 스코프**: `@admin-console/*` · 라이선스 Apache-2.0

## 워크스페이스

```
apps/admin   Next.js 16 App Router (:3000)
apps/api     NestJS 11 + Prisma 7 (:3001)
packages/ui, types, api-client, config-eslint|tailwind|ts
```

디자인 시스템(shadcn/ui + Radix + Tailwind 4 + CVA) = `apps/admin/src/components/ui/`. 공용 승격 시점에만 `packages/ui`로 이동.

## 스택

- **언어**: TypeScript strict (+ `noUncheckedIndexedAccess`)
- **Frontend**: Next 16 + React 19 + shadcn/ui + Tailwind 4 + CVA + TanStack Query v5 + Zustand v5 + react-hook-form + zod + Recharts + SSE
- **Backend**: NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis
- **인증/인가**: Auth.js v5 + Google OIDC (BFF, httpOnly 쿠키) · RBAC(Role/Permission/Menu, Permission 정규화)
- **테스트**: Vitest + RTL + MSW (단위) · Playwright (E2E) · Jest (api 기본)
- **품질/관측**: ESLint 9 + Prettier + Husky + lint-staged · Pino · Lighthouse CI · `@next/bundle-analyzer`

## 아키텍처 원칙 (5개)

1. **실무 프로덕션 기준**으로 설계. "일단 단순하게" 금지.
2. **도메인 중립성** — 비즈니스 특화 코드는 admin-console 본체 금지. 파생 프로젝트에서만.
3. **확장 지점 명확** — 메뉴/라우팅/권한/DB가 구조적으로 열림.
4. **BFF 패턴** — 브라우저는 항상 same-origin `/api/*`. 프록시에서 세션 → Bearer 변환.
5. **라우트 그룹 2종 고정** — `(app)` = Shell+auth, `(public)` = 로그인·공개. 다른 그룹명 금지.

## 금지 패턴 (요약 · 상세는 [forbidden-patterns.md](docs/rules/forbidden-patterns.md))

**상세 설명·이유·대체안·예시는 반드시 위 문서를 Read로 열어 확인.** 서브에이전트(developer·reviewer·critic)는 작업 착수 전 프리로드 필수.

**보안 (violation = 즉시 reject)**
- 토큰/세션을 `localStorage`·`sessionStorage`에 저장 금지 → httpOnly 쿠키만
- `NEXT_PUBLIC_API_URL` 같은 백엔드 URL 브라우저 노출 금지 → `API_URL`은 서버 전용
- RBAC 체크를 프론트만 금지 → 반드시 백엔드 Guard + 프론트 UI 양쪽
- 비즈니스 로직(MES/VDI 등) 본체 커밋 금지 → 도메인 중립성
- `docs/legacy/**` 수정 금지

**상태 관리**
- 문자열 리터럴 Query Key 금지 → Query Key Factory
- `setState`+`await` 낙관적 업데이트 금지 → `queryClient.setQueryData`
- fetch-on-render(useEffect fetch) 금지 → Server prefetch + HydrationBoundary
- Server Component에서 브라우저 fetcher(`lib/api.ts`) 호출 금지 → `lib/api-server.ts`

**라우팅/파일 배치**
- `app/` 하위에 라우팅 파일 외 코드 금지 → `components/` 또는 `features/<domain>/`
- Next 16에서 `middleware.ts` 금지 → `proxy.ts` 컨벤션
- `app/**/page.tsx`·`layout.tsx` 테스트 누락 금지 → RTL 또는 Playwright 필수

**타입/품질**
- `any` 남발, `@ts-ignore`/`@ts-expect-error` without reason 금지
- 파일명 casing 위반 금지 → 컴포넌트 PascalCase, 유틸·서버 kebab-case
- `default export` 남용 금지 → `page.tsx`/`layout.tsx`만 default, 나머지 named
- Prisma client 매 요청 `new` 금지 → 싱글톤

**UI/UX**
- 로딩/에러/빈 상태 미처리 금지 → 3상태 모두 UI

**프로세스**
- Conventional Commits 어기기 / `--no-verify` 우회 금지
- E2E `CI=1`·`--headless` 우회 실행 금지 → 로컬 `--headed` 기본
- Reviewer 런타임 기동 없이 PASS 금지
- TDD 증거 없이 tasks 체크 금지

## 참조 문서 (필요 시 Read)

| 주제 | 문서 |
| --- | --- |
| 금지 패턴 상세 | [docs/rules/forbidden-patterns.md](docs/rules/forbidden-patterns.md) |
| 폴더 배치 규약 | [docs/rules/folder-conventions.md](docs/rules/folder-conventions.md) |
| `/dev` 스킬 Developer/Reviewer/Tester 규율 | [docs/rules/dev-workflow.md](docs/rules/dev-workflow.md) |
| pnpm·인프라 명령 | [docs/rules/commands.md](docs/rules/commands.md) |
| 인프라 vs SDD 트랙, SDD 산출물 위치 | [docs/rules/dev-flow.md](docs/rules/dev-flow.md) |
| 설계 개념 (BFF, httpOnly, Query Key 등) | [docs/concepts/](docs/concepts/) |
| 진행 상황 | [docs/setup.md](docs/setup.md) |
| 전체 설계 명세 (원본) | [docs/legacy/NEW-PROJECT-SPEC.md](docs/legacy/NEW-PROJECT-SPEC.md) |

## 코드 컨벤션 (1줄 요약, 상세는 [folder-conventions.md](docs/rules/folder-conventions.md))

- **파일명**: 컴포넌트 `.tsx` = PascalCase · 유틸 `.ts` = kebab-case · shadcn `components/ui/*` 예외(kebab) · Next 라우팅 파일은 Next 규약
- **테스트 위치**: `src/` 밖 `tests/unit/`에 `src/` 트리 미러링. E2E는 루트 `e2e/`. `app/` 하위엔 라우팅 파일만.
- **Export**: `page.tsx`·`layout.tsx`만 default, 그 외 전부 named
- **주석**: "왜"만. 한 줄이면 한 줄.
- **커밋**: Conventional Commits (`type(scope): subject`). type = feat/fix/chore/docs/refactor/test/build/perf/style/revert/ci
