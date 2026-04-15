---
name: dev
description: 단일 슬라이스를 개발·리뷰·테스트·아카이브·커밋까지 처리. tasks.md 상태를 보고 중단 지점부터 재개. 사용법 /dev {slice}
---

단일 슬라이스의 개발부터 커밋까지 처리합니다. 이미 일부 완료된 경우 **중단 지점부터 이어서** 진행합니다.

## 사전 조건
- `docs/specs/changes/$ARGUMENTS/` 존재 (없으면 `/spec` 먼저)
- 루트 `CLAUDE.md` 존재

## Step 0: 재개 지점 판별

```
tasks.md 읽고 체크박스 상태 확인:
- 전부 [x]      → 개발 건너뛰고 Step 3 (리뷰)로
- 일부 [x]      → 개발 이어서 진행 (미완료 task부터)
- 전부 [ ]      → 처음부터 개발
```

**추가 판별 (이미 리뷰·테스트 통과한 경우 재진입):**
- `docs/specs/changes/$ARGUMENTS/.status` 파일 존재 시 단계 정보 확인
  - `reviewed` → 테스터부터
  - `tested` → sync부터
- 없으면 Step 1부터

---

## Step 1: 컨텍스트 로드 (1회)

### proposal.md + tasks.md 읽기
- `SLICE` = `$ARGUMENTS`
- `TYPE` = proposal.md `type:`
- `PACKAGE` = proposal.md `패키지:` (없거나 `.` → 루트)
- `DOMAIN` = proposal.md `영향 도메인:` 주 도메인
- `DEPENDS` = tasks.md `선행 슬라이스:`

### 의존 확인
`DEPENDS ≠ 없음` → `docs/specs/archive/*-{DEPENDS}/` 존재 확인. 없으면 유저 보고 후 중단.

### CLAUDE.md 읽기
- 모노레포면 `{PACKAGE}/CLAUDE.md` + 루트 CLAUDE.md
- 단일이면 루트 CLAUDE.md
- `STACK` 추출: 언어·프레임워크·UI 라이브러리·테스트 폴더·설치 명령·테스트 명령·E2E 명령·개발 서버·보안 스캔

### plan.md UX 포인트 추출 (frontend 계열만)
- `docs/plans/{FEATURE}/plan.md` 읽기 (FEATURE = SLICE에서 `-{suffix}` 제거)
- `UX_POINTS` = 화면 구성 + UI/UX 원칙 섹션에서 hover·cursor·색상 토큰 등 핵심 포인트 리스트업

### SCENARIOS 추출
- `docs/specs/changes/{SLICE}/specs/{DOMAIN}/spec.md` 읽기
- 각 Requirement → { id, name, given, when, then, api_spec? }

---

## Step 2: 개발 (미완료 task가 있을 때만)

개발 에이전트 호출:
```
SLICE, PACKAGE, TYPE, DOMAIN, STACK, UX_POINTS (frontend만), SCENARIOS, TASKS_PATH
```

추가 지시: `tasks.md에서 아직 [ ]인 task부터 이어서 수행`.

결과에서 `CHANGED_FILES` 파싱.
`.status` 파일에 `developed` 기록.

---

## Step 3: 리뷰 루프 (최대 3회)

리뷰어 호출:
```
ROUND, SLICE, TYPE, STACK, UX_POINTS, CHANGED_FILES
```

- PASS → `.status`에 `reviewed` 기록 → Step 4
- FAIL → **피드백을 유저에게 그대로 출력**한 뒤 개발 에이전트 재호출 (피드백 반영 모드)
- 3회 FAIL → changes/ 보존, 유저 개입 대기 (재개 시 `/dev {slice}`로 이어짐)

---

## Step 4: 테스터 호출

```
SLICE, PACKAGE, TYPE, STACK, SCENARIOS
```

- PASS → `.status`에 `tested` 기록 → Step 5
- FAIL → 유저 보고 후 중단 (changes/ 보존)

---

## Step 5: Sync

```
docs/specs/changes/{SLICE}/specs/{DOMAIN}/spec.md → docs/specs/main/{DOMAIN}/spec.md

ADDED     → 추가 (파일 없으면 생성)
MODIFIED  → ### Requirement: {name} 블록 단위 덮어쓰기
REMOVED   → 블록 삭제
순서: REMOVED → MODIFIED → ADDED
```

실패 시 유저 보고 후 중단 (아카이브 금지).

---

## Step 6: Archive

```
docs/specs/changes/{SLICE}/  →  docs/specs/archive/YYYY-MM-DD-{SLICE}/
```
원본 폴더 삭제. `.status` 파일도 함께 이동.

---

## Step 7: Git 커밋

```
git add -A
git commit -m "feat({SLICE}): {proposal.md Intent 한 줄 요약}"
```

---

## Step 8: 완료 리포트

```
✓ {SLICE} 완료

- 개발: 태스크 {N}/{N}
- 리뷰: {R}회차 PASS
- 테스트: 시나리오 {P}/{T} PASS, 보안 critical 0
- 커밋: {해시}

다음 슬라이스가 있으면: /dev {next-slice}
```

---

## 재진입 특수 모드

- `sync만 실행해줘` → Step 5만
- `테스트만 재실행해줘` → Step 4부터
- `리뷰만 재실행해줘` → Step 3부터

---

## 규칙
- 파일(CLAUDE.md, plan.md, proposal.md, tasks.md, spec.md)은 이 스킬에서만 읽음. 에이전트는 변수로만 접근.
- 리뷰 FAIL 피드백은 **반드시 유저에게 그대로 출력**
- Sync까지 모두 PASS해야 archive + commit
- 실패 지점에서 `.status` 파일로 단계 기록 → 재호출 시 이어서 진행
- 슬라이스마다 git commit (롤백 지점)
