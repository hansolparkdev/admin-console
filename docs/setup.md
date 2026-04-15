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
- [x] (에이전트) `.gitignore`: starter 기본형으로 보강 (.next/, dist/, .turbo/, .DS_Store, .env\*, !.env.example 등)
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

> **원칙**: SDD 풀 루프(`/planning → /spec → /dev`)는 **도메인 기능부터** (IAM 관리자 CRUD 등). 그 전 인프라/스캐폴딩성 작업은 setup.md에 Step으로 누적하되, **"지금 당장 다음 작업을 잠금해제하는가?"** 기준으로 우선순위 A/B 분리.
>
> 로드맵은 2026-04-15 재정렬됨 (Step 5 완료 후 실제 개발 가치 기준으로 재평가).

### 우선순위 A — SDD 진입 전 필수

| Step | 주제                    | 비고                                                                                                         |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| 5    | 디자인 시스템 ✅        | shadcn v4.2 Nova, admin 내부 (완료)                                                                          |
| 6    | **Husky + lint-staged** | 로컬 커밋 하네스. 다음 커밋부터 가치. **지금 진행**                                                          |
| 7    | DB 인프라               | docker-compose(postgres) + Prisma 셋업 + 빈 schema. 도메인 기능의 전제                                       |
| 8    | BFF route handler 골격  | `apps/admin/src/app/api/[...proxy]/route.ts` + lib/api(.ts/-server.ts) + Query Client 팩토리. admin↔api 연결 |
| 9    | 인증 인프라             | Keycloak 컨테이너 + realm + Auth.js v5 + middleware.ts                                                       |
| 10   | RBAC 베이스             | Prisma RBAC 스키마 + Guard/Decorator + `<IfPermission>`                                                      |

> **SDD 진입 시점**: Step 10 완료 후 IAM 관리자 CRUD부터 `/planning iam-admin` 호출.

### 우선순위 B — 필요해질 때 추가 ("지금 잠금해제 안 함")

| 항목                                                | 도입 시점                                            |
| --------------------------------------------------- | ---------------------------------------------------- |
| Storybook                                           | 컴포넌트 10개+ 쌓이거나 디자이너 피드백 필요할 때    |
| packages/config-\* 통합 (ts/eslint/tailwind)        | admin-mes 등 파생 앱 분기 시점                       |
| commitlint                                          | 팀 합류해 메시지 일관성 필요할 때                    |
| GitHub Actions CI                                   | "화면 나오면" 그 시점에 AI로 일괄 추가 (사용자 결정) |
| dependabot                                          | 공개 repo로 실제 사용 시작 시                        |
| 거버넌스 (SECURITY.md, CODEOWNERS, ISSUE/PR 템플릿) | PR 프로세스 시작 시                                  |
| packages/api-client (OpenAPI)                       | 타입 공유 부담 커질 때                               |

> 직전 실패의 교훈: 위 B 항목들을 "언젠가 필요하다"고 미리 깔면 "동작 안 하는 인프라 비대"가 된다. 아프기 시작할 때 추가가 원칙.

각 Step은 별도 섹션으로 아래 추가하며 진행. 분담 원칙(사용자 CLI / 에이전트 정리)은 동일.

---

## Step 5 — 디자인 시스템 (`apps/admin` 내부)

### 목표

shadcn/ui (Radix + Tailwind 4 + CVA) 기반 디자인 시스템 부트스트랩. admin 내부에서 먼저 성장시킴.

### 방향 전환 (2026-04-15)

최초 계획은 `packages/ui`에 직접 shadcn init이었으나, **shadcn 최신 CLI(v4.2)는 Next.js 앱 디렉토리 기준 동작이 기본**이며 Nova preset 선택 후 init + Button 설치까지 한 번에 완료해버린다. packages/ui로 억지로 이전하면:

- `components.json` aliases를 상대경로로 교정해야 함
- packages/ui의 tsconfig에 paths alias 설정 필요
- shadcn `add` 명령을 쓸 때마다 경로 문제 재발 가능

→ **admin 내부에 두는 방식(B)으로 전환**. `packages/ui`는 **"admin+api가 공유할 진짜 공용 UI만 나중에 승격"** 용으로 재정의(현재 비어있음). 파생 프로젝트(admin-mes 등) 분기 시점에 자연스럽게 packages/ui로 승격 결정.

### 결정 사항 (확정 — 2026-04-15)

1. **shadcn 도입 위치**: `apps/admin/` 내부 — `components.json`/`src/components/ui/`/`src/lib/utils.ts`가 admin에 속함
2. **Style preset**: Nova (Lucide icons + Geist font, Radix 기반) — shadcn CLI v4.2 선택
3. **첫 컴포넌트**: Button + Card + Input (3개 확정)
4. **Tailwind 4 방식**: CSS-only config — `src/app/globals.css` 안에 `@import "tailwindcss"` + `@import "shadcn/tailwind.css"` + `@custom-variant dark` + `@theme inline` 블록 + CSS variables. **tailwind.config.ts 없음** (Tailwind 4 default)
5. **다크모드**: `.dark` class 기반 (CSS variables로 자동). 토글 UI는 후속 슬라이스
6. **`cn` util**: `apps/admin/src/lib/utils.ts` (clsx + tailwind-merge, shadcn 생성)
7. **의존성**: `radix-ui`(통합 패키지), `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `shadcn` (admin의 dependencies로)
8. **`packages/ui` 현 상태**: placeholder 유지(workspace:\* 등록은 그대로). 진짜 공용 승격은 후속
9. **`CLAUDE.md` 갱신**: 워크스페이스 구조(목표)의 `packages/ui` 설명에 "현재는 admin 내부, 공유 대상만 승격" 주석 추가

### 체크리스트

- [x] (사용자) `cd apps/admin && pnpm dlx shadcn@latest init` 실행
  - 답: component library = Radix / preset = Nova. 이후 자동 완료(Button + utils + globals.css + deps까지 설치됨)
- [x] (사용자) `pnpm dlx shadcn@latest add card input` (Card, Input 추가)
- [x] (에이전트) 생성물 검토: `components.json`, `src/lib/utils.ts`, `src/components/ui/{button,card,input}.tsx`, `src/app/globals.css` CSS variables + dark mode
- [x] (에이전트) 검증:
  - `pnpm install` 성공
  - `apps/admin/src/app/page.tsx`에 Button/Card/Input 임포트 → `pnpm --filter @admin-console/admin build` 통과 → import 제거
- [x] (에이전트) setup.md + CLAUDE.md 갱신
- [ ] (에이전트) 커밋

### 결정 기록

- 2026-04-15: 방향 B 전환. packages/ui는 placeholder 유지, shadcn은 admin에. 이유는 §방향 전환 참조.
- 2026-04-15: Tailwind 4 CSS-only config — `tailwind.config.ts` 파일 만들지 않음. Nova preset이 globals.css에 모든 theme/variants 삽입.
- 2026-04-15: `radix-ui` 통합 패키지(^1.4.3)로 설치됨 — 개별 `@radix-ui/react-*` 대신. shadcn v4.2 convention.

---

## Step 6 — Husky + lint-staged (커밋 하네스)

### 목표

매 커밋 전 staged 파일의 포맷을 자동 정리. 오염된 커밋 방지. 로컬 하네스 역할.

### 결정 사항 (확정 — 2026-04-15)

1. **범위**: Husky + lint-staged 두 개. commitlint는 우선순위 B로 보류 (필요 시 별도 Step).
2. **lint-staged 대상**: prettier만. ESLint는 admin/api/ui/types 각자 config가 달라 루트 일관 처리 어려움. 후속 config 통합 슬라이스에서 재검토.
3. **ESLint 누락의 리스크 수용**: 커밋 시 린트 체크는 안 되지만, `pnpm lint`가 turbo로 CI/로컬에서 돌 수 있음. 필요하면 각 앱이 자체 pre-commit 추가 가능.
4. **파일 경로**: `.husky/pre-commit`만 (commit-msg는 없음).

### 체크리스트

- [x] (에이전트) `pnpm add -wD husky lint-staged`
- [x] (에이전트) `package.json`에 `prepare: husky` + `lint-staged` 설정 추가
- [x] (에이전트) `pnpm exec husky init` → `.husky/pre-commit` 생성
- [x] (에이전트) `.husky/pre-commit` 내용을 `pnpm exec lint-staged`로 교체 (기본값 `pnpm test` 제거)
- [x] (에이전트) 검증: 포맷 깨진 .ts 파일 stage → 커밋 시 prettier가 자동 수정 확인 → 테스트 파일/커밋 되돌림
- [ ] (에이전트) 커밋

### 결정 기록

- 2026-04-15: ESLint를 lint-staged에서 제외. admin은 `eslint-config-next`, api는 `typescript-eslint+prettier`, ui/types는 ESLint 없음 — 루트에서 파일 하나를 어떤 config로 돌릴지 결정 비용이 가치보다 큼.
- 2026-04-15: lint-staged 대상 확장자: `js/jsx/mjs/cjs/ts/tsx/json/md/yml/yaml/css`. prettier가 모두 처리.

---

## Step 7 — DB 인프라 (PostgreSQL + Keycloak + Prisma)

### 목표
도메인 기능 개발 시작 전 데이터 저장소를 준비. admin-console과 Keycloak이 같은 PostgreSQL 인스턴스를 쓰되 논리적으로는 분리된 DB 2개(`admin_console`, `keycloak`)로 동작.

### 결정 사항 (확정 — 2026-04-15)
1. **PostgreSQL 16-alpine** — admin-console 스펙 확정
2. **Keycloak 26.0** (공식 이미지, `start-dev` 모드 — 개발 편의)
3. **Redis 제외** — 후속 SSE 슬라이스에서 재도입 (docker-compose.yml에 주석으로 남겨둠)
4. **DB 분리**: 같은 Postgres 인스턴스, `admin_console` + `keycloak` DB 두 개. init SQL로 keycloak DB 자동 생성
5. **Prisma 7** — driver adapter 패턴 (`@prisma/adapter-pg` + `pg`). Prisma 7은 schema.prisma의 `datasource.url = env(...)` 폐기 → `prisma.config.ts`로 이관
6. **env 로딩**: 루트 `.env` 단일. api는 cwd 위로 walking해서 .env 찾는 헬퍼로 로드 (`loadRootEnv` in `apps/api/src/main.ts`)
7. **첫 모델**: `HealthCheck`(placeholder) — 실제 RBAC/IAM은 후속 슬라이스
8. **헬스 엔드포인트**: `GET /health` → `{status:"ok", db:"up"|"down"}` (Prisma `$queryRaw SELECT 1`)
9. **PrismaService 싱글톤**: Nest `@Global()` module. CLAUDE.md 금지 패턴(매 요청 new) 준수

### 체크리스트
- [x] (에이전트) `docker/docker-compose.yml` 작성 (postgres + keycloak, redis는 주석)
- [x] (에이전트) `docker/postgres-init/01-create-keycloak-db.sql` (keycloak DB 자동 생성)
- [x] (에이전트) 루트 `.env.example` 작성 (POSTGRES_*, DATABASE_URL, KEYCLOAK_*, API_PORT, API_URL)
- [x] (에이전트) `.env` 생성 (`.env.example` 복사)
- [x] (에이전트) 이전 `axis-*` 컨테이너 3개(postgres/keycloak/redis) 삭제 (5432 포트 점유 해소)
- [x] (에이전트) `pnpm add --filter @admin-console/api prisma @prisma/client @prisma/adapter-pg pg dotenv`
- [x] (에이전트) `apps/api/prisma/schema.prisma` 작성 (driverAdapters preview + HealthCheck 모델)
- [x] (에이전트) `apps/api/prisma.config.ts` (Prisma 7 config — migrations 경로 + datasource.url)
- [x] (에이전트) `prisma migrate dev --name init` → `20260415071717_init` 생성
- [x] (에이전트) `PrismaService`(NestJS `OnModuleInit/Destroy` + adapter-pg) + `PrismaModule` (`@Global()`)
- [x] (에이전트) `HealthController` (`/health` 엔드포인트 + $queryRaw 체크)
- [x] (에이전트) `apps/api/src/main.ts` `loadRootEnv` 헬퍼 (cwd upward walking으로 .env 위치)
- [x] (에이전트) api `package.json` 스크립트: `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:studio`
- [x] (에이전트) 검증:
  - `docker compose up -d postgres` → healthy
  - `prisma migrate dev` → 마이그레이션 적용
  - `pnpm --filter @admin-console/api build` 성공
  - `start:dev` → `Prisma connected` 로그 + `/health` HTTP 200 `{"status":"ok","db":"up"}`
  - `docker compose up -d keycloak` → 30초 내 `http://localhost:8080/realms/master` HTTP 200

### 결정 기록
- 2026-04-15: Redis 제외. NEW-PROJECT-SPEC에 스택 명시돼있지만 현재 유스케이스(단일 인스턴스)에서 불필요. SSE 슬라이스(Phase 8 대응)에서 재도입.
- 2026-04-15: Prisma 7 driver adapter 사용 (`adapter: new PrismaPg({ connectionString })`). Prisma 6 이하의 `datasources: { db: { url } }` 방식은 지원 종료.
- 2026-04-15: Keycloak DB를 같은 postgres 인스턴스에 `keycloak` DB로 분리. `docker/postgres-init/*.sql`로 첫 부트 시 자동 생성. 변경 시 `docker compose down -v`로 볼륨 초기화 필요.
- 2026-04-15: `.env` 루트 단일. api가 실행 위치와 상관 없이 `loadRootEnv`로 찾음. Prisma CLI(`prisma.config.ts`)는 별도 `dotenv/config` 로드.
- 2026-04-15: 이전 `axis-*` 컨테이너가 5432 점유 상태였음 → 제거. 이전 Phase 0 잔재.

---

## 진행 로그

작업하면서 결정·이슈를 시간순으로 추가.

- `2026-04-15` — 문서 생성 (docs/setup.md). plan 승인됨.
- `2026-04-15` — Step 1 turborepo starter 설치. 충돌로 백업→설치→복원 우회. .git은 백업 것 채택. 루트 설정 정렬(packageManager 10.33.0, engines.node ">=22 <23", license Apache-2.0). demo apps/packages는 보존(Step 2~4에서 정리).
- `2026-04-15` — Step 2 apps/admin (Next.js 16.2.3 + Tailwind 4 + Turbopack). starter demo apps(web/docs) 삭제. create-next-app 16의 새 동작(중첩 워크스페이스 생성)을 정리(pnpm-workspace/lock/CLAUDE.md 제거, AGENTS.md 보존). package.json name → `@admin-console/admin`. dev :3000 200 검증.
- `2026-04-15` — Step 3 apps/api (NestJS 11.0.1, jest 기본). package.json name → `@admin-console/api`, license Apache-2.0, check-types/dev script 추가. main.ts 포트 3001. build + dev :3001 "Hello World!" 검증.
- `2026-04-15` — Step 4 packages/ui + packages/types 빈 껍데기 생성. starter packages 3개(ui/eslint-config/typescript-config) 삭제. admin/api에 workspace:\* 의존 등록. import 검증 후 turbo build 2 tasks 성공.
- `2026-04-15` — 셋업 트랙 범위 재확정 합의. SDD 풀 루프는 도메인 기능부터(IAM CRUD 등). 그 전 디자인 시스템·Storybook·config·BFF·DB·인증 등 인프라성 작업은 모두 setup.md에 Step 5~14로 누적. 메모리(`feedback_sdd_vs_plan.md`) 갱신.
- `2026-04-15` — Step 5 디자인 시스템. shadcn v4.2 + Nova preset + Radix 통합 패키지. admin 내부에 Button/Card/Input 설치. Tailwind 4 CSS-only config. packages/ui는 placeholder 유지(방향 B 전환, 이유는 Step 5 §방향 전환 참조). build 통과 검증.
- `2026-04-15` — 로드맵 재정렬. "지금 당장 다음 작업을 잠금해제하는가?" 기준. Storybook/config 통합/CI/dependabot/거버넌스/commitlint 모두 우선순위 B로 이동. 우선순위 A: Husky → DB → BFF → 인증 → RBAC → (SDD 진입).
- `2026-04-15` — Step 6 Husky + lint-staged. 커밋 하네스. `prepare: husky`, `.husky/pre-commit: pnpm exec lint-staged`, `package.json lint-staged: prettier --write`. ESLint는 각 앱 config 차이로 lint-staged에서 제외 (후속 config 통합 슬라이스에서 재검토). hook 동작 검증 완료.
- `2026-04-15` — Prettier markdown 제외. `*glob*` 같은 내용을 italic으로 재작성해 의미 변형 문제 3회 발생 → `.prettierignore`에 `*.md` 추가. 코드 파일은 prettier 유지.
- `2026-04-15` — CLAUDE.md 축소. 규약만 담기로 합의 (진행 상황·참고 문서·이전 레퍼런스 제거). 금지 패턴 12개 섹션 신설. `/dev` 스킬에서 자동 커밋 Step 제거(아카이브까지만).
- `2026-04-15` — E2E 명령 기본 `--headed`로 전환 (시각 확인 우선, headless는 CI). api/main.ts `bootstrap()` floating promise 수정.
- `2026-04-15` — Step 7 DB 인프라. PostgreSQL 16 + Keycloak 26 컨테이너, Prisma 7 driver adapter(adapter-pg), 첫 migration(HealthCheck), `/health` 엔드포인트(DB ping) 검증 완료. Redis는 SSE 슬라이스까지 보류.
