---
name: init
description: 프로젝트 초기화. 타입 선택 → 스캐폴딩 → 훅 자동 설치 → CLAUDE.md + docs/DESIGN.md. 사용법 /init
---

프로젝트를 처음부터 구성합니다. 스캐폴딩·훅·문서까지 한 번에.

## Step 1: 기존 상태 감지

- `package.json` / `pyproject.toml` / `go.mod` 존재?
- `turbo.json` / `nx.json` / `pnpm-workspace.yaml` 존재?
- `CLAUDE.md` 존재?

**기존 프로젝트면** → 유저에게 "CLAUDE.md·훅만 설치할까요?" 확인 후 Step 4로.
**신규면** → Step 2로.

## Step 2: 프로젝트 타입 + 스택 한 번에 수집

```
어떤 프로젝트입니까? (모르는 항목 엔터)

[타입]
1. 단일 프론트엔드
2. 단일 백엔드
3. 풀스택 단일 (Next.js App Router 등)
4. 모노레포 (Turborepo / Nx)

[스택]
- 언어·프레임워크 (예: TypeScript + React + Vite / Python + FastAPI)
- 패키지 매니저 (npm / pnpm / poetry / ...)
- 단위 테스트 (Vitest / Jest / pytest / ...)
- E2E (Playwright / 없음) ← 프론트 계열
- UI 라이브러리 (Tailwind / shadcn/ui / MUI / 없음) ← 프론트 계열
- DB (PostgreSQL / SQLite / ...) ← 백엔드 계열

[아키텍처]
- 패턴 (MVC / DDD / Layered / Clean / 없음)
- 폴더 구조 (feature-based / layer-based / domain-based)

[모노레포만]
- 툴 (Turborepo / Nx / pnpm workspace)
- apps/ 목록 (예: web, api)
- packages/ 목록 (예: ui, utils)

[기타]
- 테스트 폴더 위치 (src/__tests__ / 소스 옆 / tests/)
```

## Step 3: 스캐폴딩 실행

타입·스택에 맞는 명령 실행. 실행 전 명령을 유저에게 보여주고 확인.

| 시나리오       | 명령                                              |
| -------------- | ------------------------------------------------- |
| React + Vite   | `npm create vite@latest . -- --template react-ts` |
| Next.js        | `npx create-next-app@latest .`                    |
| Node + Express | `npm init -y` + Express 설치                      |
| FastAPI        | `pip install fastapi uvicorn pytest`              |
| NestJS         | `npx @nestjs/cli new .`                           |
| Turborepo      | `npx create-turbo@latest .`                       |
| Nx             | `npx create-nx-workspace@latest .`                |

**프론트 계열이면 Playwright 자동 설치**:

```
npm install -D @playwright/test
npx playwright install
```

**모노레포**: 스캐폴딩 후 실제 생성된 `apps/*`, `packages/*` 목록 감지 → Step 5에 전달.

## Step 4: 훅 자동 설치 (docs/harness.md 참조)

`docs/harness.md` 읽어 스택별 적절한 훅 구성:

### Node/TypeScript

```
npm install -D eslint prettier husky lint-staged
npx husky init
```

`.husky/pre-commit` 생성 (lint-staged 실행).
`package.json`에 lint-staged 설정 추가.
ESLint 기본 규칙 파일 생성 (`no-console`, `no-explicit-any` 등).

### Python

```
pip install ruff pre-commit
pre-commit install
```

`.pre-commit-config.yaml` 생성 (ruff + ruff-format 훅).

### Claude Code 훅 (공통)

`.claude/hooks/pre_edit.sh` 생성:

```bash
FILE=$(echo $TOOL_INPUT | jq -r '.file_path')
[[ "$FILE" == *.ts* ]] && npx eslint "$FILE"
[[ "$FILE" == *.py ]] && ruff check "$FILE"
exit $?
```

`.claude/settings.json`에 PreToolUse 훅 등록.

## Step 5: .claudeignore 생성

프로젝트 루트에:

```
node_modules/
.git/
dist/
build/
.next/
.turbo/
.nx/
coverage/
.venv/
__pycache__/
.env
.env.*
!.env.example
test-results/
playwright-report/
```

## Step 6: CLAUDE.md 생성

### 단일 프로젝트 (타입 1/2/3)

루트에 1개:

```markdown
# CLAUDE.md

## 프로젝트 타입

frontend | backend | fullstack

## 기술 스택

- 언어·프레임워크
- 패키지 매니저
- 단위 테스트
- E2E (프론트만)
- UI 라이브러리 (프론트만)
- DB (백엔드만)

## 아키텍처

- 패턴
- 폴더 구조

## 테스트 폴더

{위치}

## 설치 명령

{명령}

## 단위 테스트 명령

- 전체 / 단일 파일 / 커버리지

## E2E 명령 (프론트만)

- 헤디드 (기본): npx playwright test --headed # 브라우저 띄워 시각 확인
- 헤드리스 (CI 등): npx playwright test

## 개발 서버

{명령}

## 보안 스캔

{명령 (npm audit / pip-audit / ...)}

## 코드 컨벤션

(린트가 자동 적용. 예외 사례만 여기에.)
```

### 모노레포 (타입 4)

**루트 `CLAUDE.md`**:

```markdown
# CLAUDE.md (루트)

## 프로젝트 타입

monorepo

## 모노레포 툴

Turborepo | Nx | pnpm workspace

## 워크스페이스 구조

```
apps:
  - web: {스택}
  - api: {스택}
packages:
  - ui / utils / ...
```

## 전체 빌드 / 테스트

- turbo build / turbo test

## 패키지별 CLAUDE.md

각 `apps/*`, `packages/*`/CLAUDE.md 참조.
```

**각 `apps/*`, `packages/*` 루프**: package.json 읽어 스택 감지 → 각 디렉토리에 단일 프로젝트 형식 CLAUDE.md 생성. 감지 불명확한 항목만 유저에게 한 번에 확인:

```
감지 결과 확인해주세요:

apps/web:
- 단위 테스트: Vitest (맞나요?)
- UI 라이브러리: (없음 — 추가하시겠습니까?)

apps/api:
- 단위 테스트: Jest (맞나요?)
- DB: (없음)
```

## Step 7: docs/DESIGN.md 생성 (프론트 포함 타입만)

루트에 1개:

```markdown
# DESIGN.md

## 색상

| 역할        | 값      |
| ----------- | ------- |
| 프라이머리  | #2563EB |
| 위험        | #DC2626 |
| 성공        | #16A34A |
| 배경        | #FFFFFF |
| 표면        | #F9FAFB |
| 텍스트 기본 | #111827 |
| 텍스트 보조 | #6B7280 |
| 보더        | #E5E7EB |

## 타이포그래피

| 역할   | 크기     | 굵기 |
| ------ | -------- | ---- |
| 제목 1 | 2rem     | 700  |
| 제목 2 | 1.5rem   | 600  |
| 본문   | 1rem     | 400  |
| 보조   | 0.875rem | 400  |

## 간격 (4px 스케일)

4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

## 보더 반경

기본 8px / 버튼 6px / 카드 12px

## 반응형

모바일 ~767px / 태블릿 768~1023px / 데스크탑 1024px~

## 터치 타겟

최소 44×44px
```

## Step 8: 초기 Git 커밋

```
git init
git add .
git commit -m "chore: 프로젝트 초기화"
```

## Step 9: 완료 안내

```
✓ 스캐폴딩 ({타입}: {스택})
✓ 훅 설치 (ESLint/Ruff + husky/pre-commit + .claude/hooks)
✓ .claudeignore
✓ CLAUDE.md {모노레포면: 루트 + apps/*, packages/*}
{프론트면: ✓ docs/DESIGN.md}
✓ 초기 Git 커밋

다음 단계:
1. /planning {기능명}  — 기획서 작성
2. /dev {기능명}        — 스펙 생성 → 슬라이스별 개발·리뷰·테스트 자동 수행
```

## 규칙

- 스캐폴딩·훅 설치 전 명령 실행 예정을 유저에게 보여주고 확인
- 기존 프로젝트면 스캐폴딩 건너뛰기
- 모노레포는 반드시 패키지별 CLAUDE.md 생성
- 실패 시 즉시 유저 보고 후 중단
