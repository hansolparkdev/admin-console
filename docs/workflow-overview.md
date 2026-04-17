# Claude Code 기반 AI 개발 워크플로우

> 에이전트·스킬·훅으로 구성한 풀스택 개발 하네스 소개

---

## 왜 이렇게 만들었나

- 반복되는 기획→설계→구현→리뷰 사이클을 자동화
- 사람이 "무엇을" 결정하고, AI가 "어떻게"를 실행
- 품질 게이트(린트·테스트·리뷰)를 사람이 아닌 훅과 에이전트가 강제

---

## 하네스 구성

```
.claude/
├── agents/        ← 역할별 서브에이전트
│   ├── planner    기획서 작성
│   ├── critic     기획 비평
│   ├── architect  스펙·태스크 설계
│   ├── developer  TDD 구현
│   ├── reviewer   런타임 포함 코드 리뷰
│   └── tester     E2E + 보안 검증
├── skills/        ← 슬래시 커맨드
│   ├── /planning  기획
│   ├── /spec      스펙 설계
│   └── /dev       구현~아카이브
├── hooks/         ← 자동 실행 (서브에이전트 포함 전체 적용)
│   ├── pre_edit.sh          Edit/Write 시 ESLint 자동 실행
│   └── pre_bash_server.sh   포트 점유 시 서버 재기동 차단
└── settings.json
```

---

## 전체 개발 흐름

```
/planning  →  (Stitch)  →  /spec  →  /dev  →  커밋/푸시
```

---

## 1단계: `/planning` — 기획

1. planner 에이전트가 기획 초안 작성
2. **디자인 참조 확인** — Stitch / Figma / 스크린샷 / none 선택
   - 충실도: `strict` / `guide` / `loose`
   - 디자인 참조가 있으면 plan.md에 반영
3. critic 에이전트 비평 (최대 3회 루프)
4. 산출물: `docs/plans/{feature}/plan.md`

> Stitch 결과물(ui.png 등)은 사용자가 직접 `docs/design/{feature}/`에 저장.
> `/spec` 실행 시 해당 경로를 언급하면 architect가 디자인을 참고해 스펙 작성 가능

---

## 2단계: `/spec` — 스펙 설계

architect 에이전트가 plan.md를 읽고 산출물 생성:

```
docs/specs/changes/{feature}/
├── proposal.md              — Why / What Changes (무엇을)
├── design.md                — DB 스키마, API 설계, 폴더 구조, 기술 결정 (어떻게)
├── tasks.md                 — 구현 체크리스트 (순서·단위)
└── specs/{capability}/
    └── spec.md              — 시나리오 명세 (Given / When / Then)
```

capability = 사용자가 인식하는 독립적인 기능 단위 (예: menu-management, role-management)

---

## 3단계: `/dev` — 구현부터 아카이브까지

| Step | 담당 | 내용 |
|------|------|------|
| 2. developer | developer | tasks.md 순서대로 TDD. task 완료마다 해당 파일만 테스트 실행 |
| 3. reviewer | reviewer | 런타임 기동 포함 리뷰 (정적 분석만으론 PASS 불가, 최대 3회) |
| 4. tester | tester | E2E 시나리오 선별 실행(headed 기본) + 보안 검증 |
| 5. Sync | — | `changes/` → `main/` 스펙 머지 |
| 6. Archive | — | `changes/` → `archive/YYYY-MM-DD-{feature}/` |

재진입 지원: `.status` 파일로 단계 기록 → 중단 후 재호출 시 이어서 진행

---

## 테스트 전략

| 레벨 | 도구 | 실행 시점 |
|------|------|-----------|
| 단위 / RTL | Vitest + RTL | task 완료 시 해당 파일만 지정 실행 |
| API 통합 | Jest | task 완료 시 해당 파일만 지정 실행 |
| 전체 | Vitest + Jest | 개발 완료 후 1회 |
| E2E | Playwright (headed) | /dev Step 4, 시나리오 선별 후 실행 |
| 보안 | pnpm audit | /dev Step 4 |

> CI=1 / --headless 우회 금지

---

## 스펙 관리

```
docs/specs/
├── changes/    진행 중 feature 스펙
├── main/       Sync 완료된 최신 스펙
└── archive/    Archive 완료된 스펙 (YYYY-MM-DD-{feature})
```

---

## 커밋 / 푸시

- `/dev` 완료 후 커밋은 **사용자 명시 승인 후 별도 실행**
- Conventional Commits (`feat / fix / chore / refactor / test / docs`)
- Husky pre-commit → lint-staged 자동 실행
