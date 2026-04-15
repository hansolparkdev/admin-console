# 셋업 트랙

> SDD 풀 루프(`/planning → /spec → /dev`) 진입 전, **도메인 기능 이전의 모든 인프라/스캐폴딩 작업**을 이 단일 문서에 Step으로 누적한다.
>
> - **부트스트랩 (Step 1~4)** ✅: 모노레포(Turborepo+pnpm) + Next.js(admin) + NestJS(api) + packages/ui+types
> - **셋업 (Step 5~14)**: 디자인 시스템 → Storybook → config 통합 → 품질 도구 → CI → 거버넌스 → DB 인프라 → BFF 골격 → 인증 → RBAC 인프라
> - **이후**: 도메인 기능(IAM CRUD 등)은 SDD 풀 루프로 전환
>
> 사용자와 에이전트가 분담해 한 단계씩 체크하며 진행한다.

작성 시작: 2026-04-15

---

## 분담 원칙

- **사용자**: 대화형 CLI 실행 (`pnpm dlx create-turbo@latest`, `create-next-app`, `@nestjs/cli new` 등). CLI가 묻는 프롬프트에 답하는 역할.
- **에이전트**: 루트 설정 파일 작성·정리, `package.json` name/포트 정정, 검증 명령 실행, 커밋.
- **합의**: 결정이 필요한 지점에선 잠깐 멈추고 같이 정한다. 결정은 본 문서 "결정 기록"란에 즉시 남긴다.

## 비목표 (이번 세팅에 안 넣음 — 가드레일)

직전 Phase 0이 비대해진 원인을 재발하지 않기 위해 다음은 **이번 작업에 절대 포함하지 않는다**. 후속 슬라이스에서 별도로 도입.

- CI / GitHub Actions workflow
- dependabot / Renovate
- `docker-compose.yml` / Postgres / Redis / Keycloak 컨테이너
- `SECURITY.md` / `CODEOWNERS` / ISSUE·PR 템플릿
- Husky / lint-staged / commitlint
- shadcn 컴포넌트 (ui 패키지는 빈 껍데기로 시작)
- Prisma / Auth.js / TanStack Query / Zustand / Recharts / SSE
- Vitest / Playwright / Testing Library / MSW
- `packages/api-client` / `packages/config-*` (eslint/tailwind/ts)

> 위 항목 중 하나라도 "지금 같이 넣으면 편한데?"라는 유혹이 생기면 **거부하고 후속 슬라이스로 미룬다.**

---

## Step 1 — Turborepo 모노레포 골격

- [x] (사용자) `pnpm dlx create-turbo@latest .` 실행 (admin-console에 충돌 — 임시로 하네스 6개를 백업 디렉토리로 빼고 빈 admin-console에 설치, 그 후 백업 합침. .git은 백업 것 채택해 history 연속성 유지)
- [x] (에이전트) 루트 `package.json` 정렬:
  - `license`: `Apache-2.0` 추가
  - `packageManager`: `pnpm@9.0.0` → `pnpm@10.33.0`
  - `engines.node`: `">=18"` → `">=22 <23"`
  - `typecheck` 스크립트 추가 (`turbo run check-types`의 alias — demo apps가 `check-types` 명을 써서 점진 전환)
- [x] (에이전트) `pnpm-workspace.yaml`: starter 기본값 OK (`apps/*`, `packages/*`)
- [x] (에이전트) `turbo.json`: starter 기본값 유지 (`ui: tui`, tasks: build/dev/lint/check-types)
- [x] (에이전트) `.gitignore`: starter 기본형으로 보강 (.next/, dist/, .turbo/, .DS_Store, .env*, !.env.example 등)
- [x] (에이전트) 검증: `corepack prepare pnpm@10.33.0 --activate` → `pnpm install` 성공 (Node 24지만 engines WARN만 뜨고 진행). `pnpm exec turbo run lint` 3 tasks 성공.
- **결정 기록 (2026-04-15)**:
  - starter가 만든 demo apps(`apps/web`, `apps/docs`)와 demo packages(`packages/ui`, `packages/eslint-config`, `packages/typescript-config`)는 **이번 Step 1엔 그대로 둠**. Step 2(admin)/Step 3(api)에서 web/docs를 정리하고, Step 4에서 packages를 우리 ui+types로 정리.
  - `check-types` vs `typecheck`: 점진 전환. 지금은 root에 alias로 양립.
  - `turbo.json` `ui: tui`: starter 기본값 유지 (최신 default).
  - turborepo의 starter `.git` 폐기 → 백업 `.git` 채택 (e1f9fca + 793df53 history 보존, GitHub remote와 연속).

## Step 2 — apps/admin (Next.js 16)

- [x] (에이전트) starter demo apps 정리: `apps/web`, `apps/docs` 삭제
- [x] (사용자) `pnpm dlx create-next-app@latest apps/admin` (루트에서 실행, 대화형)
  - 답: TypeScript Yes / ESLint Yes / Tailwind Yes / src/ Yes / App Router Yes / Turbopack Yes / alias `@/*` Yes
  - 결과: Next.js 16.2.3 + React 19.2.4 + Tailwind 4 + Turbopack default
- [x] (에이전트) create-next-app이 만든 잡파일 정리:
  - `apps/admin/pnpm-workspace.yaml` 삭제 (`ignoredBuiltDependencies: [sharp, unrs-resolver]`는 루트 `pnpm-workspace.yaml`로 이전)
  - `apps/admin/pnpm-lock.yaml` 삭제 (루트 lockfile만 사용)
  - `apps/admin/CLAUDE.md` 삭제 (한 줄짜리 reference만 있음)
  - `apps/admin/AGENTS.md` 유지 (Next.js 16 deprecation 가이드 — 에이전트 참고용)
  - `apps/admin/node_modules` 삭제 (루트에서 hoist)
- [x] (에이전트) `apps/admin/package.json`:
  - `name` → `@admin-console/admin`
  - `version` → `0.1.0` → `0.0.0`
  - `check-types` 스크립트 추가 (`tsc --noEmit`)
- [x] (에이전트) 포트 확인 — admin은 :3000 (Next.js 기본 유지)
- [x] (에이전트) 검증:
  - `pnpm install` (루트) → 5 workspace projects, hoist 성공
  - `pnpm --filter @admin-console/admin build` → ✓ Compiled successfully
  - `pnpm --filter @admin-console/admin dev` → `curl http://localhost:3000/` HTTP 200
- **결정 기록 (2026-04-15)**:
  - `src/` 디렉토리 — 첫 시도에서 No로 답해서 다시 만들었음. CLAUDE.md "핵심 폴더 규칙"이 `src/app/...` 기반이라 src/ Yes 필수.
  - Tailwind: Yes (Step 4 packages/ui와 자연 짝)
  - Turbopack: Yes (Next 15+ stable, default)
  - `AGENTS.md` 보존 — Next.js 16 안내(에이전트가 next 코드 짤 때 docs 참조)
  - admin 자체 lockfile은 만들지 않음. 루트 `pnpm-lock.yaml` 단일.

## Step 3 — apps/api (NestJS 11)

- [x] (사용자) `pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --strict --skip-git --skip-install`
  - 결과: NestJS 11.0.1, src/{app.controller,app.module,app.service,main}.ts, test/, jest 기본 셋업
- [x] (에이전트) `apps/api/package.json`:
  - `name`: `api` → `@admin-console/api`
  - `version`: `0.0.1` → `0.0.0`
  - `license`: `UNLICENSED` → `Apache-2.0`
  - `description`/`author` 빈 필드 제거
  - `check-types` 스크립트 추가 (`tsc --noEmit -p tsconfig.json`)
  - `dev` 스크립트 추가 (`nest start --watch` alias for turbo)
- [x] (에이전트) `apps/api/src/main.ts` — `app.listen(process.env.PORT ?? 3000)` → `?? 3001`
- [x] (에이전트) 검증:
  - `pnpm install` 성공 (`@nestjs/core` postinstall script는 pnpm 10 default로 차단됨, 동작에 영향 없음)
  - `pnpm --filter @admin-console/api build` 성공 (`apps/api/dist/` 생성)
  - `pnpm --filter @admin-console/api start:dev` → `curl http://localhost:3001/` HTTP 200 "Hello World!"
- **결정 기록 (2026-04-15)**:
  - Jest 잔존 허용 — NestJS CLI 기본 산출물. Vitest 통일은 후속 슬라이스.
  - 포트 3001 확정 (admin과 충돌 회피). PORT env로 override 가능.
  - `@nestjs/core` build script 차단 — 현재 동작 정상이라 approve 안 함. 필요해지면 후속 슬라이스에서 `pnpm approve-builds`.

## Step 4 — packages/ui + packages/types

> 두 번째 패키지 = `packages/types` (admin↔api 공유 타입). 2026-04-15 확정.

- [x] (에이전트) starter packages 정리: `packages/{ui, eslint-config, typescript-config}` 모두 삭제 (비목표 §9 정렬)
- [x] (에이전트) `packages/ui/` 생성 (빈 껍데기):
  - `package.json` (name `@admin-console/ui`, version `0.0.0`, license `Apache-2.0`, type `module`, exports `./src/index.ts`, check-types script)
  - `tsconfig.json` (strict + noUncheckedIndexedAccess + Bundler resolution + jsx preserve)
  - `src/index.ts` placeholder (`export {};`)
- [x] (에이전트) `packages/types/` 생성 (빈 껍데기, ui와 동일 패턴 — jsx 옵션 제외)
- [x] (에이전트) `pnpm-workspace.yaml` 확인 (`packages/*` 이미 포함)
- [x] (에이전트) admin/api에 workspace 의존 등록:
  - `apps/admin/package.json` dependencies: `@admin-console/ui`, `@admin-console/types` (`workspace:*`)
  - `apps/api/package.json` dependencies: `@admin-console/types` (`workspace:*`)
- [x] (에이전트) 통합 검증:
  - `pnpm install` 성공, `apps/admin/node_modules/@admin-console/{ui,types}` symlink 생성, `apps/api/node_modules/@admin-console/types` symlink 생성
  - admin: `import type {} from "@admin-console/types"` + `import {} from "@admin-console/ui"` 추가 → `pnpm build` 통과 → import 제거
  - api: `import type {} from "@admin-console/types"` 추가 → `pnpm build` 통과 → import 제거
- [x] (에이전트) `turbo.json` `build.outputs`에 `dist/**` 추가 (api dist 인식 안 되던 WARNING 해소)
- [x] (에이전트) 최종: `pnpm exec turbo run build` → 2 tasks successful
- **결정 기록 (2026-04-15)**:
  - 두 패키지 의존 등록 — `workspace:*`로 명시 등록 (둘 다)
  - shadcn/Tailwind/Storybook 후속 슬라이스. 현재 ui는 placeholder만.
  - starter `packages/{eslint-config, typescript-config}` 삭제 — admin/api 자체 설정으로 동작. config 통합은 후속 "config 슬라이스"에서.

---

## 부트스트랩(Step 1~4) 통합 검증

```bash
pnpm install
pnpm dev          # turbo가 admin(:3000) + api(:3001) 병렬 기동
# 다른 터미널
curl -sf -o /dev/null -w "admin=%{http_code}\n" http://localhost:3000/
curl -sf -o /dev/null -w "api=%{http_code}\n" http://localhost:3001/
# Ctrl+C
pnpm build
pnpm typecheck
pnpm lint
```

모두 성공 + 두 curl이 200이면 부트스트랩 완료. ✅ 2026-04-15 통과.

---

## 셋업 트랙 로드맵 (Step 5~)

> **원칙**: SDD 풀 루프(`/planning → /spec → /dev`)는 **도메인 기능부터** (IAM 관리자 CRUD 등). 그 전 인프라/스캐폴딩성 작업은 모두 이 setup.md에 Step으로 누적.

| Step | 주제 | 비고 |
|---|---|---|
| 5 | 디자인 시스템 (`packages/ui` 채우기) | shadcn/ui + Tailwind preset + 기본 컴포넌트 3~5개 |
| 6 | Storybook | 디자인 시스템 시각 검증 도구. 별도 Step (의존 그래프 분리) |
| 7 | config 통합 패키지 | `packages/config-{ts,eslint,tailwind}` — 현재 admin/api 자체 설정 통일 |
| 8 | 품질 도구 | Husky + lint-staged + commitlint |
| 9 | CI | GitHub Actions (lint/typecheck/build/test) |
| 10 | dependabot + 거버넌스 | dependabot.yml, SECURITY.md, CODEOWNERS, ISSUE/PR 템플릿 |
| 11 | DB 인프라 | docker-compose(postgres) + Prisma 셋업 + 빈 schema |
| 12 | BFF route handler 골격 | `apps/admin/src/app/api/[...proxy]/route.ts` + lib/api(.ts/-server.ts) + Query Client 팩토리 |
| 13 | 인증 인프라 | Keycloak 컨테이너 + realm.json + Auth.js v5 + middleware.ts |
| 14 | RBAC 인프라 | Prisma RBAC 스키마 + Guard/Decorator 베이스 + `<IfPermission>` 컴포넌트 |

> **SDD 진입 시점**: Step 14까지 완료 후 IAM 관리자 CRUD부터 `/planning iam-admin` 호출.

각 Step은 별도 섹션으로 아래 추가하며 진행. 분담 원칙(사용자 CLI / 에이전트 정리)은 동일.

---

## Step 5 — 디자인 시스템 (`packages/ui` 채우기)

### 목표
shadcn/ui + Tailwind 4 + CVA 기반 디자인 시스템 부트스트랩. 첫 컴포넌트로 admin/api 도메인 화면이 의존할 베이스 마련.

### 결정 필요 사항 (작업 시작 전)
- shadcn/ui CLI 도입 방식: 표준 `pnpm dlx shadcn@latest init` (apps/admin 기준) vs `packages/ui`에 직접 설치
- 첫 컴포넌트 범위: Button + Card + Input 3개 (최소) vs Button + Input + Label + Card + Dialog 5개 (다이얼로그까지)
- Tailwind preset 위치: `packages/ui/tailwind.preset.js`로 export vs Step 7에서 `packages/config-tailwind` 분리
- ui 패키지의 export 방식: barrel(`./src/index.ts`) vs 컴포넌트별 path(`@admin-console/ui/button`)
- 다크모드: 이번 Step에 포함 vs Storybook(Step 6)와 함께
- shadcn/ui가 의존하는 utils(`cn`, clsx, tailwind-merge): `packages/ui/src/lib/utils.ts`로

### 분담 (예정)
- 사용자: `pnpm dlx shadcn@latest init` 등 대화형 CLI
- 에이전트: 정리·정합성 맞추기·검증·커밋

### 체크리스트 (작성 예정)
- [ ] 결정 사항 확정
- [ ] (사용자/에이전트) shadcn 초기화
- [ ] (에이전트) Tailwind preset/CSS variables 셋업
- [ ] (에이전트) `cn` util + 첫 컴포넌트 N개 생성
- [ ] (에이전트) admin에서 import해서 build/lint/typecheck/dev :3000 통과
- [ ] (에이전트) 커밋

### 결정 기록
(작업 진행 중 갱신)

---

## 진행 로그

작업하면서 결정·이슈를 시간순으로 추가.

- `2026-04-15` — 문서 생성 (docs/setup.md). plan 승인됨.
- `2026-04-15` — Step 1 turborepo starter 설치. 충돌로 백업→설치→복원 우회. .git은 백업 것 채택. 루트 설정 정렬(packageManager 10.33.0, engines.node ">=22 <23", license Apache-2.0). demo apps/packages는 보존(Step 2~4에서 정리).
- `2026-04-15` — Step 2 apps/admin (Next.js 16.2.3 + Tailwind 4 + Turbopack). starter demo apps(web/docs) 삭제. create-next-app 16의 새 동작(중첩 워크스페이스 생성)을 정리(pnpm-workspace/lock/CLAUDE.md 제거, AGENTS.md 보존). package.json name → `@admin-console/admin`. dev :3000 200 검증.
- `2026-04-15` — Step 3 apps/api (NestJS 11.0.1, jest 기본). package.json name → `@admin-console/api`, license Apache-2.0, check-types/dev script 추가. main.ts 포트 3001. build + dev :3001 "Hello World!" 검증.
- `2026-04-15` — Step 4 packages/ui + packages/types 빈 껍데기 생성. starter packages 3개(ui/eslint-config/typescript-config) 삭제. admin/api에 workspace:* 의존 등록. import 검증 후 turbo build 2 tasks 성공.
- `2026-04-15` — 셋업 트랙 범위 재확정 합의. SDD 풀 루프는 도메인 기능부터(IAM CRUD 등). 그 전 디자인 시스템·Storybook·config·BFF·DB·인증 등 인프라성 작업은 모두 setup.md에 Step 5~14로 누적. 메모리(`feedback_sdd_vs_plan.md`) 갱신.
