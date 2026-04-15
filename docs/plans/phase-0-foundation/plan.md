# 기획서: Admin Console Phase 0 — 모노레포 골격 및 공용 레일

> 비평 2회 PASS. 2회차 🟡 개선 5건은 본문에 흡수 반영됨.

## 1. 배경 및 목적

### 1.1 배경
Admin Console은 "실무 프로덕션 기준을 단순화 없이 유지하는 풀스택 템플릿"을 지향한다. Phase 1(Web/Next.js)·Phase 2(API/NestJS) 이전에, 두 Phase가 공유할 **모노레포 골격**과 **공용 레일**(타입·린트·포맷·환경변수·테스트 러너·CI·하네스·거버넌스)을 먼저 고정해야 한다. 레일이 흔들리면 이후 모든 Phase가 흔들린다.

### 1.2 해결하려는 문제
- 각 Phase가 제각기 설정을 만들어 **일관성 붕괴** 위험
- Claude Code 하네스(훅 기반)가 **자기차단**(ESLint 미설치 상태에서 훅이 eslint 호출)으로 Phase 0 진행을 막는 사고
- "훅에 규칙을 인라인" vs "규칙은 config 패키지, 훅은 실행기" 경계 모호
- 교육용 템플릿으로 **복제 즉시 동작**해야 하는데 이를 자동 검증할 수단 부재
- Windows·Docker 부재 환경에서의 진입장벽

### 1.3 목적
Phase 1/2가 `pnpm install` 한 번으로 공용 레일을 상속받고, Claude Code 하네스가 처음부터 끝까지 자기차단 없이 동작하며, PR마다 "템플릿성"이 자동 검증되는 상태를 확보한다.

### 1.4 성공 지표 (측정 가능)

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| 신규 개발자 초기 셋업 시간 | 15분 이내 | README 따라 clone→`pnpm install`→`pnpm lint`까지 |
| `pnpm install` 종료 코드 | exit 0 | CI `install` 잡 |
| `pnpm lint` 종료 코드 | exit 0 (빈 상태에서도) | CI `lint` 잡 |
| `pnpm typecheck` 종료 코드 | exit 0 | CI `typecheck` 잡 |
| Docker compose 인프라 기동 | 60초 이내 healthy (이미지 pull 완료 상태 기준, healthcheck 폴링 2초 간격, 잡 timeout 5분). CI는 GHA cache 적중 시에만 강제 측정, miss 시 참고치. | CI `infra` 잡 헬스체크 |
| 하네스 훅 자기차단 사고 | 0건 | 전체 Slice 진행 중 |
| `template-smoke` 잡 | 매 PR 초록 | CI 필수 체크 |

---

## 2. 사용자

### 2.1 주요 사용자
- **Admin Console 본 레포 컨트리뷰터**: Phase 1/2를 이어서 구축할 개발자
- **템플릿 복제 사용자**: `degit`으로 Admin Console을 복제해 자사 프로젝트를 시작하는 팀
- **Claude Code 에이전트**: 하네스(pre_edit / post_edit / pre_commit 훅) 위에서 편집·커밋을 수행하는 자동화 주체

### 2.2 사용 맥락
- Phase 0 자체는 **러닝 가능한 앱 없음**. `packages/*` 골격과 루트 설정만 존재
- 모든 결정은 Phase 1/2에서 **상속**되므로 변경 비용이 누적됨
- Claude Code가 Slice 단위로 PR을 만들며 훅이 매 편집·커밋에서 실행됨

### 2.3 사용자 목표
- `pnpm install && pnpm lint && pnpm typecheck` 초록 상태에서 Phase 1 킥오프
- Phase 1/2 구현 시 "어디에 설정을 둘지"를 고민하지 않음
- 템플릿 복제 후 즉시 동작

---

## 3. 핵심 기능

Phase 0은 **9가지 공용 레일**을 고정한다.

1. **모노레포 골격** — pnpm workspaces + Turborepo 기반 패키지/앱 디렉토리 규약
2. **타입 프리셋** — `packages/config-ts` (base·node·nextjs 세 변주)
3. **린트 프리셋** — `packages/config-eslint` (flat config, typescript-eslint, import, unused-imports)
4. **포맷 레일** — 루트 `.prettierrc` + `.editorconfig`
5. **환경변수 레일** — `packages/config-env` (zod 스키마는 Phase 1/2에서 소비처와 함께)
6. **테스트 러너 레일** — Vitest(단위/통합) + Playwright(e2e) placeholder
7. **CI 레일** — GitHub Actions (install / lint / typecheck / test / infra / template-smoke)
8. **Claude Code 하네스 레일** — `.claude/hooks/{pre_edit,post_edit,pre_commit}.sh` + 훅은 실행기, 규칙은 config 패키지
9. **거버넌스 레일** — LICENSE / CODEOWNERS / ISSUE·PR 템플릿 / SECURITY.md / dependabot

---

## 4. 사용자 흐름

### 4.1 정상 흐름 (신규 컨트리뷰터)
1. 레포 clone
2. `corepack enable` (README 선행 명령)
3. `pnpm install`
4. `pnpm lint && pnpm typecheck` → exit 0 확인
5. (선택) `docker compose up -d` → 60초 내 healthy
6. Phase 1/2 Slice 작업 시작

### 4.2 정상 흐름 (템플릿 복제 사용자)
1. `pnpm dlx degit owner/admin-console my-project`
2. `cd my-project && corepack enable && pnpm install`
3. `pnpm lint && pnpm typecheck` → exit 0
4. `LICENSE`·`CODEOWNERS` 본인 조직으로 교체

### 4.3 정상 흐름 (Claude Code 에이전트)
1. Slice N 브랜치에서 편집 시도
2. `pre_edit.sh` 실행 → ESLint bootstrap 덕분에 빈 flat config에서도 exit 0
3. 파일 편집
4. `post_edit.sh` → `eslint --fix` / `prettier --write` 실행 (규칙은 config 패키지에서)
5. `pre_commit.sh` + Husky + lint-staged → `eslint --fix`, `prettier --write` 재실행
6. 커밋 → CI → `template-smoke` 포함 전 체크 통과 → 머지

### 4.4 예외 흐름
- **Docker 미설치** → `.env`에 `SKIP_INFRA=1` 설정 시 `docker compose` 관련 로컬 스크립트·CI matrix 스킵 (`.env.example`에 문서화)
- **Windows 네이티브** → README에서 WSL2 사용 안내, 네이티브는 비공식
- **`pnpm` 미설치** → `corepack enable` 선행 명령 README 1행 안내
- **Slice 02/03 시점 린트 실행** → 각 패키지 `eslint.config.js`가 `export default []` placeholder라 exit 0
- **Phase 1 시점 Next.js 16 미-stable** → `packages/config-ts/nextjs.json`의 `moduleResolution`만 조정 후 Next.js 15 고정
- **`template-smoke` 실패** → PR 머지 차단 (필수 체크)
- **`template-smoke` degit 네트워크 실패 / fork PR 토큰 부재** → fallback으로 `actions/checkout`이 만든 워킹트리를 `tar`로 묶어 `/tmp/admin-console-smoke`에 풀어 동일 검증 수행 (구체 구현은 미결사항 #10)

---

## 5. 아키텍처 결정 (왜 한 줄)

### 5.1 pnpm + Turborepo
**왜**: pnpm은 디스크 효율·엄격한 호이스팅으로 phantom dependency 방지, Turborepo는 원격 캐시·affected 그래프로 CI 시간 상수화.

### 5.2 Workspace 구조
```
apps/          # Phase 1: apps/web, Phase 2: apps/api (Phase 0엔 없음)
packages/      # 공용 레일
  config-ts
  config-eslint
  config-env
  testing       # Vitest/Playwright 공용 설정 export
```
**왜**: `apps/*`는 실행 단위, `packages/*`는 재사용 단위. 경계가 명확해야 Phase 1/2가 상속 지점을 오해하지 않음.

> **NOTE**: CLAUDE.md / NEW-PROJECT-SPEC.md에는 추가로 `packages/{ui, types, api-client, config-tailwind}`가 명시되어 있다. 이들은 Phase 1(디자인 시스템)과 Phase 2/4(API 클라이언트·공유 타입) 진입 시 동일 규약(Slice 03 placeholder 패턴)으로 추가한다. Phase 0에서는 **추가하지 않는다**(YAGNI).

### 5.3 turbo.json 파이프라인 선반영
`lint`·`typecheck`·`test`·`test:e2e`·`build`·`dev`를 모두 placeholder로 Slice 02에 등록(`dependsOn: []`, 빈 태스크는 `cache: false`).
**왜**: turbo.json 변경은 전 슬라이스 캐시 무효화를 유발 → 알려진 미래 태스크는 처음부터 선반영해 캐시 안정성 확보.

### 5.4 TypeScript 프리셋 3종
`base.json` / `node.json` / `nextjs.json`.
**왜**: Node 런타임과 Next.js는 `moduleResolution`·`lib`·`jsx`가 다름. Phase별로 다르게 extends하면 끝.

### 5.5 ESLint flat config + typescript-eslint
**왜**: ESLint v9+ flat config가 공식 표준이며 .eslintrc 레거시는 유지비용만 발생.

### 5.6 Prettier + EditorConfig 분리
**왜**: Prettier는 코드 포맷, EditorConfig는 에디터 기본(개행·들여쓰기 탭 정책). 역할 분리.

### 5.7 Vitest + Playwright
**왜**: Vitest는 Jest 호환 API + ESM 네이티브, Playwright는 e2e 사실상 표준. Phase 0엔 설정만, 실제 테스트는 Phase 1/2.
**Vitest 빈 상태 운영**: `passWithNoTests: true`를 루트 vitest 설정에 명시. placeholder smoke 테스트는 Slice 06에 1개만 둠(`packages/testing/__tests__/smoke.test.ts` — `expect(true).toBe(true)`).

### 5.8 Next.js 16 / NestJS 11 stable 판정
**stable 판정 기준** = npm `latest` dist-tag + 최소 1 패치 릴리스 경과.
**판정 시점** = Phase 1 킥오프 PR.
**fallback** = Next.js 15 / NestJS 10 고정, `packages/config-ts/nextjs.json`의 `moduleResolution`만 조정.
**왜**: 메이저 첫 패치 전 stable 단정은 리스크가 큼. 객관 기준으로 판정해야 흔들리지 않음.

### 5.9 CI matrix
`ubuntu-latest` 단일, Node 22 LTS 단일. Windows 매트릭스는 Phase 3 이후 검토.
**왜**: Phase 0의 목적은 레일 안정화. 매트릭스 확장은 흔들린 후에.

### 5.10 훅/실행기 vs 규칙 경계 (신설)
- `.claude/hooks/{pre_edit,post_edit,pre_commit}.sh`, Husky pre-commit, lint-staged는 **모두 실행기**.
- 이들은 `eslint --fix`, `prettier --write`를 **호출만** 한다.
- 린트 규칙은 전부 `packages/config-eslint`에, 포맷 규칙은 루트 `.prettierrc`에.
- 훅 스크립트 내부에 **인라인 규칙·정규식 검사·파일별 분기 로직 금지**.
- **왜**: 규칙을 훅에 섞으면 (a) Phase 1/2에서 규칙 추적 불가 (b) 복제 사용자가 규칙을 갈아끼울 지점을 찾지 못함 (c) 훅 수정과 규칙 수정이 엉켜 커밋 단위가 오염됨.

### 5.11 `packages/config-eslint` export 형태
**확정**: `export default []` (flat config 배열) — Slice 03·04 모두 동일 형태.
factory 함수(`defineConfig({...})`) 변환은 Phase 1에서 옵션 필요성이 발생할 때 검토.
**왜**: flat config 표준은 배열이며 factory는 추가 추상화. Phase 0은 추상화 0순위.

---

## 6. 슬라이스 구성 (총 8개)

### Slice 01 — bootstrap-and-harness
- `package.json` (루트, `"private": true`, `packageManager` 필드)
- `pnpm-workspace.yaml`
- `.nvmrc` (Node 22 LTS)
- `.gitignore` — 루트 `node_modules/` + 워크스페이스별 `*/node_modules/` + `.turbo/`, `dist/`, `.next/`, `coverage/`, `.env`, `.env.*` (단 `.env.example` 제외), `playwright-report/`, `test-results/`, `*.log`, `.DS_Store`
- `.editorconfig`
- `.claude/hooks/{pre_edit,post_edit,pre_commit}.sh` (실행기 셸. 인라인 규칙 금지)
- **ESLint 부트스트랩**: `eslint`, `@eslint/js` devDependency 설치 + 루트 `eslint.config.js`에 **빈 flat config** (`export default []`) 커밋. Slice 04에서 실제 규칙으로 교체.
- README v0 (corepack enable, pnpm install, 지원 OS 표)

**DoD**: `pnpm install` exit 0. `.claude/hooks/pre_edit.sh` 빈 파일 대상 exit 0 (ESLint 호출이 빈 config로 통과).

### Slice 02 — turborepo-and-scripts
- `turbo.json` — `lint`, `typecheck`, `test`, `test:e2e`, `build`, `dev` placeholder 태스크 (빈 태스크는 `cache: false`)
- 루트 `package.json` scripts: `lint`, `typecheck`, `test`, `test:e2e`, `build`, `dev` → turbo 위임
- Husky 설치, `.husky/pre-commit` → lint-staged 호출 (lint-staged config는 루트 `package.json`에)

**DoD**: `pnpm lint` exit 0 (빈 그래프). `pnpm typecheck` exit 0. 커밋 시 Husky 훅 동작 확인.

### Slice 03 — config-packages-skeleton
- `packages/config-ts/` — `package.json` + `base.json`·`node.json`·`nextjs.json` (빈 `{}` 또는 최소 `compilerOptions`)
- `packages/config-eslint/` — `package.json` + `index.js` placeholder (`export default []`) — **5.11에 따라 최종 형태도 동일**
- `packages/config-env/` — `package.json`만 (zod 스키마는 Phase 1/2에서 소비처와 함께)
- `packages/testing/` — `package.json` placeholder
- 각 빈 패키지에 **`tsconfig.json` extends 1줄** (`{ "extends": "@admin-console/config-ts/base.json" }`) + **`eslint.config.js`에 `export default []` placeholder**

**DoD**: `pnpm install` workspace 링크 정상. `pnpm lint` / `pnpm typecheck` 여전히 exit 0.

### Slice 04 — lint-and-format-rules
- `packages/config-eslint/index.js` 실제 규칙: `@eslint/js` recommended + `typescript-eslint` strict + `eslint-plugin-import` + `eslint-plugin-unused-imports` (export 형태는 `export default [...]` 유지 — 5.11)
- 루트 `eslint.config.js`가 `packages/config-eslint`를 import하도록 교체 (Slice 01의 빈 flat config 대체)
- 루트 `.prettierrc`, `.prettierignore`
- lint-staged 매핑 완성 (`*.{ts,tsx,js,jsx}` → `eslint --fix` + `prettier --write`, `*.{json,md,yml,yaml}` → `prettier --write`)
- **훅 내부는 변경하지 않음** (5.10 원칙 재확인)

**DoD**: `pnpm lint` exit 0. 고의로 `any`·unused import 삽입 → 규칙 위반으로 실패하는지 역테스트.

### Slice 05 — harness-integration
- `.claude/hooks/pre_edit.sh` / `post_edit.sh` / `pre_commit.sh`가 Slice 04 규칙을 **호출만** 하도록 최종화
- 훅 실패 시 Claude가 받을 메시지 포맷 표준화 (stderr로 파일·라인·rule id만)
- **훅 내부 인라인 규칙 금지 원칙(5.10) 재언급** 및 코드 리뷰 체크리스트에 추가

**DoD**: Claude Code로 더미 편집 수행 시 훅 체인 exit 0. 고의 위반 편집 시 exit 1 + 메시지 포맷 규격 통과.

### Slice 06 — testing-rails
- `packages/testing/` — Vitest 공용 config export (`createVitestConfig()`, 내부 default `passWithNoTests: true`) + Playwright 공용 config export
- 루트 `vitest.config.ts` (워크스페이스 글롭, `passWithNoTests: true` 명시), `playwright.config.ts` placeholder
- **placeholder smoke 테스트**: `packages/testing/__tests__/smoke.test.ts` (`expect(true).toBe(true)` 1줄) — 5.7
- **검증용 더미 소비처**: `packages/testing/src/__smoke__/preset.css` (빈 파일) + `preset.ts`에서 preset import → `tsc --noEmit` 통과

**DoD**: `pnpm test` exit 0 (smoke 1개 통과 또는 0개 + `passWithNoTests` 동작). 더미 소비처 `tsc --noEmit` exit 0.

### Slice 07 — ci-and-infra
- `.github/workflows/ci.yml` — jobs: `install`, `lint`, `typecheck`, `test`, `infra`, `template-smoke` (Slice 08에서 활성화). `infra` 잡 timeout 5분, healthcheck 폴링 2초.
- actions/setup-node + pnpm cache, turbo remote cache (토큰은 Phase 1에서)
- `docker-compose.yml` — Postgres, Redis 등 Phase 2에서 쓸 인프라 정의, healthcheck 포함
- **`.env.example` 수동 작성 — 최소 키 세트 고정**:
  ```
  # Infra toggles
  SKIP_INFRA=0                # 1로 설정 시 docker compose·CI infra 잡 스킵
  # Postgres
  POSTGRES_HOST=localhost
  POSTGRES_PORT=5432
  POSTGRES_USER=admin_console
  POSTGRES_PASSWORD=admin_console
  POSTGRES_DB=admin_console
  # Redis
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```
  Phase 1/2의 zod 스키마는 이 키들의 superset이며, Phase 0에서는 검증 없이 docker-compose가 직접 참조.
- `infra` 잡은 GHA cache 적중 시에만 "60초 healthy" 측정 (cache miss 시 참고치)

**DoD**: CI 잡 `install/lint/typecheck/test` 초록. `docker compose up -d` 로컬·CI에서 60초 내 healthy (이미지 pull 완료 상태 기준, timeout 5분).

### Slice 08 — governance-and-template
- `LICENSE` — **Apache-2.0** (교육용 템플릿 친화적, 특허 조항 포함)
- `CODEOWNERS`
- `.github/ISSUE_TEMPLATE/{bug_report,feature_request}.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `SECURITY.md`
- `.github/dependabot.yml` — **3 ecosystem**: pnpm(`npm` package-ecosystem), `docker`, `github-actions`
- **`template-smoke` 잡 활성화**:
  - 1차 경로: `pnpm dlx degit owner/admin-console#<sha> /tmp/admin-console-smoke`
  - **fallback** (네트워크 실패·fork PR 토큰 부재 시): `actions/checkout` 워킹트리를 `tar`로 묶어 `/tmp/admin-console-smoke`에 풀어 동일 검증 수행
  - 검증: `cd /tmp/admin-console-smoke && corepack enable && pnpm install && pnpm lint && pnpm typecheck` 전부 exit 0이면 통과. **필수 체크**.
- README v1 완성 (배지, 지원 OS, corepack, SKIP_INFRA, degit 사용법)

**DoD**: `template-smoke` 잡 초록 (1차 경로 또는 fallback 어느 쪽이든). 필수 체크로 브랜치 보호 규칙 등록.

---

## 7. 지원 OS

| OS | 등급 | 조건 |
|---|---|---|
| macOS 14+ (Apple Silicon / Intel) | 1급 | `corepack enable` 선행 |
| Ubuntu 22.04+ / 동급 Linux | 1급 | `corepack enable` 선행 |
| Windows 11 + WSL2 (Ubuntu 22.04) | 1급 | WSL 내부에서 실행 |
| Windows 11 네이티브 | 비공식 | 미지원, 이슈 접수하되 수정 보장 없음 |
| Docker 미설치 환경 | 부분 지원 | `.env`에 `SKIP_INFRA=1`, Slice 07 로컬 검증·CI matrix 일부 스킵 |

---

## 8. 제약 조건

1. **실무 프로덕션 기준 유지** — "일단 단순하게"로 퇴화 금지. 레일이 Phase 1/2 규모를 감당해야 함.
2. **슬라이스 단위 PR** — Slice 하나 = PR 하나. 슬라이스 간섭 금지.
3. **`.claude/hooks/pre_edit.sh`는 Slice 01 확정 후 수정하지 않음** — 단, Slice 01에서 훅이 no-op이라도 exit 0이 되도록 **ESLint bootstrap** 수행. Slice 05에서 최종 메시지 포맷만 조정하며, 규칙 인라인화는 금지.
4. **훅은 실행기**, 규칙은 `packages/config-eslint` + `.prettierrc` (5.10 원칙).
5. Node는 **22 LTS 고정**.
6. pnpm은 **Corepack 경유** (`packageManager` 필드로 버전 고정).
7. Phase 0 기간엔 **`apps/*` 생성 금지** — 레일이 흔들림.
8. 인라인 규칙·정규식 검사·파일별 분기 로직을 훅 스크립트에 추가하지 않음.

---

## 9. UI/UX 원칙

해당 없음 (Phase 0은 화면 없음).

---

## 10. 완료 기준

- [ ] `pnpm install` exit 0 (루트에서)
- [ ] `pnpm lint` exit 0 (Slice 01~03 빈 상태 포함)
- [ ] `pnpm typecheck` exit 0 (Slice 01~03 빈 상태 포함)
- [ ] `pnpm test` exit 0 (smoke 테스트 1개 통과 + `passWithNoTests` 동작)
- [ ] Slice 04 완료 후 고의 `any` 삽입 시 `pnpm lint` exit 1 (규칙 동작 역검증)
- [ ] Claude Code 훅 체인 exit 0 (더미 편집)
- [ ] Claude Code 훅 체인 exit 1 + 규격 메시지 (고의 위반)
- [ ] `docker compose up -d` 이미지 pull 완료 상태에서 60초 내 healthy (timeout 5분, 폴링 2초)
- [ ] CI `install/lint/typecheck/test/infra/template-smoke` 잡 전부 초록
- [ ] `template-smoke` 잡이 브랜치 보호 필수 체크로 등록 (1차 degit 또는 fallback tar 경로 어느 쪽이든)
- [ ] LICENSE(Apache-2.0) / CODEOWNERS / ISSUE·PR 템플릿 / SECURITY.md / dependabot.yml 존재
- [ ] README v1: 지원 OS 표, `corepack enable`, `SKIP_INFRA=1`, degit 사용법 포함
- [ ] 훅 스크립트 전체 grep 결과 `eslint --rule`·인라인 정규식 검사 **0건**
- [ ] `.env.example` 존재 및 최소 키 세트(SKIP_INFRA, POSTGRES_*, REDIS_*) + `SKIP_INFRA` 문서화

---

## 11. 미결 사항

| # | 항목 | 태그 |
|---|---|---|
| 1 | `pnpm patch` 운영 정책 (패치 커밋 위치·리뷰 절차) | **[Phase 0 종료 전 필수]** |
| 2 | Turborepo 원격 캐시 제공자 (Vercel Remote Cache vs 자체 호스팅) | [Phase 1 이월 가능] |
| 3 | Vitest 커버리지 리포터 포맷 (lcov·cobertura·둘 다) | [Phase 1 이월 가능] |
| 4 | Playwright 브라우저 매트릭스 (chromium only vs 전체) | [Phase 1 이월 가능] |
| 5 | ~~`packages/config-eslint` 최종 export 형태~~ | **삭제 (5.11에서 `export default []`로 확정)** |
| 6 | dependabot grouping 전략 (minor·patch 묶음 vs 개별 PR) | [Phase 1 이월 가능] |
| 7 | CI turbo remote cache 토큰 주입 방식 (GH secrets vs OIDC) | [Phase 1 이월 가능] |
| 8 | `apps/api`의 Nest 버전 최종 확정 (11 stable 판정 5.8에 따름) | [Phase 1 이월 가능] |
| 9 | CODEOWNERS 초기 주체 (본 레포 소유 조직/개인) | **[Phase 0 종료 전 필수]** |
| 10 | `template-smoke` fallback 구체 구현 (tar 경로 스크립트, fork PR 토큰 처리) | **[Slice 08 진입 전 필수]** |

---

## 참고 파일

- `/Users/parkhansol/work/devel/workspace/admin-console/CLAUDE.md` — 스택·원칙·폴더 규칙
- `/Users/parkhansol/work/devel/workspace/admin-console/docs/legacy/NEW-PROJECT-SPEC.md` — 2/3/5.6/7절
- `/Users/parkhansol/work/devel/workspace/admin-console/docs/harness.md` — 훅 설계
- `/Users/parkhansol/work/devel/workspace/admin-console/docs/DESIGN.md` — Tailwind preset 이식 대상 (Phase 1)
- `/Users/parkhansol/work/devel/workspace/admin-console/.claude/hooks/pre_edit.sh` — Slice 01 ESLint bootstrap 후 정상 동작 대상
