# 초기 세팅

> 모노레포(Turborepo + pnpm) + Next.js(admin) + NestJS(api) + packages/ui + packages/types까지의 최소 동작 상태를 만든다.
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

- [ ] (사용자) `cd apps && pnpm dlx create-next-app@latest admin` (대화형)
  - 답할 프롬프트:
    - TypeScript: ___
    - ESLint: ___
    - Tailwind CSS: ___
    - `src/` directory: ___
    - App Router: ___
    - Turbopack: ___
    - import alias: ___ (예: `@/*`)
- [ ] (에이전트) `apps/admin/package.json`:
  - `name` → `@admin-console/admin`
  - `version` → `0.0.0`
- [ ] (에이전트) 포트 확인 — admin은 :3000 (Next.js 기본 유지)
- [ ] (에이전트) 검증:
  - `pnpm install`
  - `pnpm --filter @admin-console/admin dev` → `curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3000/` 200
  - `pnpm --filter @admin-console/admin build` 성공
- **결정 기록**: ___

## Step 3 — apps/api (NestJS 11)

- [ ] (사용자) `cd apps && pnpm dlx @nestjs/cli@latest new api --package-manager pnpm --strict --skip-git`
- [ ] (에이전트) `apps/api/package.json`:
  - `name` → `@admin-console/api`
  - `version` → `0.0.0`
- [ ] (에이전트) `apps/api/src/main.ts` — `app.listen(...)`을 **3001**로 (admin과 포트 충돌 회피)
- [ ] (에이전트) 검증:
  - `pnpm install`
  - `pnpm --filter @admin-console/api start:dev` → `curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3001/` 200 ("Hello World!")
  - `pnpm --filter @admin-console/api build` 성공
- **결정 기록**:
  - Jest는 NestJS CLI 기본 산출물로 잔존 허용 (Vitest 통일은 후속 슬라이스). OK?: ___

## Step 4 — packages/ui + packages/types

> 두 번째 패키지 = `packages/types` (admin↔api 공유 타입). 2026-04-15 확정.

- [ ] (에이전트) `packages/ui/` 생성 (빈 껍데기):
  - `package.json` (name: `@admin-console/ui`, version: `0.0.0`, license: `Apache-2.0`, type: `module`, main: `./src/index.ts`)
  - `tsconfig.json` (strict 최소 — 후속 슬라이스에서 config-ts로 통일)
  - `src/index.ts` (placeholder, `export {};`)
- [ ] (에이전트) `packages/types/` 생성 (빈 껍데기):
  - `package.json` (name: `@admin-console/types`, 동일 패턴)
  - `tsconfig.json`
  - `src/index.ts` (placeholder)
- [ ] (에이전트) `pnpm-workspace.yaml`에 `packages/*` 포함 확인
- [ ] (에이전트) 통합 검증:
  - `pnpm install` (워크스페이스 링크 생성 확인)
  - `apps/admin`에서 `@admin-console/types` import 가능한지 1줄 테스트 (예: `app/page.tsx`에 `import type {} from "@admin-console/types"`) 후 `pnpm build` 통과
  - 검증 후 테스트 import 제거
- **결정 기록**:
  - 두 패키지의 의존 등록을 admin/api에 추가할지(`workspace:*`): ___
  - shadcn/Tailwind/Storybook은 모두 후속 슬라이스. 이번에 ui는 정말 빈 껍데기. OK?: ___

---

## 최종 검증 (Step 1~4 완료 후)

```bash
pnpm install
pnpm dev          # turbo가 admin(:3000) + api(:3001) 병렬 기동
# 다른 터미널
curl -sf -o /dev/null -w "admin=%{http_code}\n" http://localhost:3000/
curl -sf -o /dev/null -w "api=%{http_code}\n" http://localhost:3001/
# Ctrl+C
pnpm build
pnpm typecheck    # 각 앱이 typecheck 스크립트를 가져야 함 — 없으면 추가
pnpm lint
```

모두 성공 + 두 curl이 200이면 초기 세팅 완료.

---

## 진행 로그

작업하면서 결정·이슈를 시간순으로 추가.

- `2026-04-15` — 문서 생성 (docs/setup.md). plan 승인됨.
- `2026-04-15` — Step 1 turborepo starter 설치. 충돌로 백업→설치→복원 우회. .git은 백업 것 채택. 루트 설정 정렬(packageManager 10.33.0, engines.node ">=22 <23", license Apache-2.0). demo apps/packages는 보존(Step 2~4에서 정리).
