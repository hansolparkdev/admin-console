# 개발 워크플로우

## 전체 흐름

```
[최초 1회]
/init                       프로젝트 타입·스택 수집 → 스캐폴딩 → 훅 설치 → CLAUDE.md + docs/DESIGN.md + .claudeignore + 초기 git commit

[기능 개발 사이클]
/planning {기능명}           planner + critic → docs/plans/{feature}/plan.md
      ↓
/spec {feature}              architect → docs/specs/changes/{feature}-{slice}/ 슬라이스 N개 (4파일씩)
      ↓
/dev {slice}                 개발 → 리뷰(≤3회) → 테스트 → sync → archive → git commit
                             중단 시 tasks.md + .status 파일로 재개 가능
```

모노레포일 때는 `/spec login`이 자동으로 `login-web`, `login-api`처럼 **패키지별로 슬라이스 분리**.

---

## 지원 프로젝트 타입

| 타입 | 예시 | 슬라이싱 |
|------|------|----------|
| `frontend` | React / Vue / Next.js SPA | 사용자 흐름 단위 |
| `backend` | FastAPI / Express / NestJS | 기능 단위 |
| `fullstack` | Next.js App Router 등 | UI+API 묶음 단위 |
| `monorepo` | Turborepo / Nx | **반드시 패키지별 분리** |

---

## 디렉토리 구조

```
프로젝트 루트/
├── .claude/
│   ├── agents/                 # 6개 에이전트
│   ├── skills/                 # 4개 스킬 (init, planning, spec, dev)
│   ├── hooks/pre_edit.sh       # Claude Edit/Write 시 즉시 린트
│   └── settings.json           # PreToolUse 훅 등록
├── .claudeignore               # Claude가 읽지 않을 경로 (node_modules, .env 등)
├── .husky/pre-commit           # 커밋 시점 린트·포맷 최종 게이트
├── CLAUDE.md                   # 프로젝트 타입·스택·명령·컨벤션 (단일) 또는 모노레포면 루트 + 패키지별
└── docs/
    ├── DESIGN.md               # 디자인 토큰 (색상·타이포·간격) — frontend 계열만
    ├── harness.md              # 훅 설계 참조 (init이 읽어 스택별 훅 설치)
    ├── workflow.md             # (이 문서)
    ├── plans/
    │   └── {feature}/plan.md
    └── specs/
        ├── main/               # source of truth
        │   └── {domain}/spec.md
        ├── changes/            # 진행 중
        │   └── {feature}-{slice}/
        │       ├── proposal.md (feature·type·패키지·변경유형·영향도메인)
        │       ├── design.md   (사용 스택·데이터 모델·컴포넌트·API 명세)
        │       ├── tasks.md    (태스크 체크리스트 + 선행 슬라이스)
        │       ├── .status     (개발 단계 기록 — 재개용)
        │       └── specs/{domain}/spec.md (delta)
        └── archive/
            └── YYYY-MM-DD-{feature}-{slice}/
```

---

## CLAUDE.md (init이 생성)

프로젝트 루트에 **한 번만** 작성. 모노레포면 루트 + 패키지별.

```markdown
# CLAUDE.md

## 프로젝트 타입
frontend | backend | fullstack | monorepo

## 기술 스택
- 언어·프레임워크
- 패키지 매니저
- 단위 테스트 / E2E (프론트만)
- UI 라이브러리 (프론트만) / DB (백엔드만)

## 아키텍처
- 패턴 / 폴더 구조

## 테스트 폴더 / 설치 명령 / 단위 테스트 명령 / E2E 명령 / 개발 서버 / 보안 스캔

## 코드 컨벤션
(린트가 자동 적용. 예외 사례만)
```

---

## 1. 기획 단계 (/planning)

**에이전트:** planner + critic

```
루트 CLAUDE.md 읽기 → STRUCTURE·PACKAGES 추출
      ↓
planner (STRUCTURE 받아 FE/BE/패키지별 섹션 포함한 plan.md 초안)
      ↓
critic (최대 3회 — 치명적 문제 없으면 즉시 PASS)
      ↓
docs/plans/{feature}/plan.md 저장
```

디자인 (선택, 사람이 직접): plan.md → Google Stitch → `docs/design/{feature}/` 저장.

---

## 2. 스펙 단계 (/spec)

**에이전트:** architect

```
루트 CLAUDE.md + docs/specs/main/ 도메인 확인
      ↓
architect (plan.md 1회 읽기)
  - 도메인 미존재 → ADDED only
  - 도메인 존재 → ADDED / MODIFIED / REMOVED 혼합
  - STRUCTURE=monorepo → 패키지별로 슬라이스 분리 (login-web, login-api)
      ↓
각 슬라이스에 4개 파일 생성
      ↓
유저에게 슬라이스 목록·의존관계·실행 순서 안내
```

### proposal.md 필수 필드
- `feature`
- `type`: frontend | backend | fullstack
- `패키지`: `.` 또는 `apps/web` 등
- `변경 유형`: ADDED | MODIFIED
- `영향 도메인`: `{domain}: ADDED|MODIFIED`

### design.md 필수 섹션
- `## 사용 스택` (CLAUDE.md에서 상속한 언어·UI 라이브러리·테스트 프레임워크 등)
- 데이터 모델 / 컴포넌트 구조 / API 명세 (타입 따라)

---

## 3. 개발 단계 (/dev)

**에이전트:** developer + reviewer + tester

```
Step 0: 재개 지점 판별
  tasks.md 체크박스 + .status 파일 확인
  - 전부 [x] + reviewed → 테스터부터
  - 전부 [x] + tested   → sync부터
  - 일부 [x]            → 미완료 task부터 개발
  - 전부 [ ]            → 처음부터

Step 1: 컨텍스트 로드 (스킬에서만 읽음)
  proposal.md·tasks.md → SLICE·TYPE·PACKAGE·DOMAIN·DEPENDS
  CLAUDE.md (루트 + 모노레포면 패키지별) → STACK
  plan.md (프론트만) → UX_POINTS (hover·cursor·색상 등)
  spec.md delta → SCENARIOS (Given/When/Then + API 명세)

Step 2: 개발자 호출 (변수만 받음, 파일 재읽기 금지)
  작업 디렉토리 = PACKAGE
  TDD 사이클: 단위 테스트 → FAIL → 구현 → PASS
  UX_POINTS·UI 라이브러리 사전 반영 (리뷰 FAIL 감소)
  tasks.md 체크박스 배치 업데이트
  CHANGED_FILES 출력

Step 3: 리뷰 루프 (최대 3회)
  reviewer (CHANGED_FILES + UX_POINTS 변수만)
  코드 품질·UX·엣지케이스만 검토 (요구사항 구현 여부는 tester 담당)
  FAIL → 피드백을 유저에게 출력 후 개발자 재호출
  PASS → .status=reviewed

Step 4: 테스터 호출
  tester (SCENARIOS 변수만)
  frontend: Playwright E2E (headless 기본) + 단위 테스트 회귀 확인
  backend: API 통합 테스트 + 커버리지
  보안 스캔 (npm audit / pip-audit 등)
  PASS → .status=tested

Step 5: Sync
  docs/specs/changes/{slice}/specs/{domain}/spec.md → docs/specs/main/{domain}/spec.md
  순서: REMOVED → MODIFIED → ADDED
  동일 Requirement 이름은 delta가 main 덮어씀

Step 6: Archive
  docs/specs/changes/{slice}/ → docs/specs/archive/YYYY-MM-DD-{slice}/
  원본 폴더 삭제

Step 7: Git 커밋
  git commit -m "feat({slice}): {proposal.md Intent 한 줄 요약}"
```

---

## 에이전트 역할 경계 (중복 금지)

| 에이전트 | 책임 | 읽는 것 |
|----------|------|---------|
| planner | plan.md 작성 (STRUCTURE 반영) | CLAUDE.md (스킬이 변수화) |
| critic | plan.md 비평 (회차 수신, 즉시 PASS 가능) | planner 출력물 |
| architect | plan → 4개 파일 · 슬라이싱 · 스택 주입 | plan.md |
| developer | TDD 구현 · UX_POINTS 반영 · tasks 업데이트 | tasks.md만 (나머지는 변수) |
| reviewer | 코드 품질·UX·엣지케이스 | CHANGED_FILES만 |
| tester | SCENARIOS → E2E/통합 테스트 작성·실행 · 보안 스캔 | 파일 읽기 금지 (변수만) |

---

## 훅 (로컬 게이트)

`/init`이 docs/harness.md 참조해서 스택별로 자동 설치:

### Claude Code 훅 (파일 수정 시점)
`.claude/hooks/pre_edit.sh` — Edit/Write 호출 시 ESLint/Ruff 즉시 검사.

### Pre-commit 훅 (커밋 시점)
- Node/TS: husky + lint-staged → ESLint·Prettier
- Python: pre-commit + Ruff

### 역할 분담
- **코드 규칙** (`no-console`, `no-explicit-any` 등) → **린트**가 강제
- **워크플로우 순서** → **스킬**이 강제
- **출력 형식·품질 판단** → **에이전트**가 강제

---

## Sync 상세

```
ADDED only    → main/{domain}/spec.md 에 추가 (파일 없으면 생성)
MODIFIED 혼합 → REMOVED → MODIFIED → ADDED 순
  - REMOVED : 해당 Requirement 블록 삭제
  - MODIFIED: 동일 이름 Requirement 블록 전체 교체
  - ADDED   : 새 Requirement 추가
```

Sync 실패 시 **archive 금지** (데이터 무결성).

---

## Archive 상세

```
docs/specs/changes/{slice}/  →(이동)→  docs/specs/archive/YYYY-MM-DD-{slice}/

같은 슬라이스 재작업 시:
  archive/2026-04-15-login-web/    ← 1차
  archive/2026-05-02-login-web/    ← 2차 (날짜 다름 충돌 없음)
```

---

## 재진입 방법

| 상황 | 명령 |
|------|------|
| `/dev` 중단 (개발 중) | `/dev {slice}` — tasks.md·.status 확인 후 이어감 |
| sync만 재실행 | "sync만 실행해줘" |
| 테스트만 재실행 | "테스트만 재실행해줘" |
| 리뷰 3회 FAIL 이후 | 피드백 반영 후 `/dev {slice}` (라운드 리셋) |

---

## 속도·컨텍스트 주의사항

### 병목 구간과 완화책

| 병목 | 완화 |
|------|------|
| 리뷰 FAIL 재작업 | developer가 UX_POINTS 변수로 사전 반영 → 1회차 PASS 유도 |
| 에이전트별 파일 재읽기 | 스킬이 중앙에서 1회 읽고 변수로 주입 |
| `.claudeignore` 부재 | init 단계에서 자동 생성 (node_modules, coverage 등 차단) |
| Playwright 미설치 | init이 자동 설치. tester 단계에서도 체크 |
| 슬라이스 과대 | 1~3일 작업량 기준 분리. 크면 리뷰 비용 기하급수 |

### 토큰 절약 규칙
- 에이전트 파일은 변수 기반으로 작성 → 프롬프트 짧음
- 리뷰어 출력은 FAIL 항목만 상세
- tester는 SCENARIOS 변수만 사용 (spec.md 재읽기 금지)

---

## 주의사항

- `/spec`·`/dev` 경로 규약: `changes/{feature}-{slice}/` flat 구조
- 슬라이스 의존관계: `tasks.md`의 `선행 슬라이스:` 기준, archive 존재 확인 후 실행
- 테스트 환경: backend는 로컬 서버·DB·env 준비 필요. frontend는 개발 서버 자동 띄움
- Sync 실패 시 archive 금지 (데이터 무결성)
- 모노레포는 반드시 패키지별 슬라이스 (architect 강제)
