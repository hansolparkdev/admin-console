# 개발 흐름

## 작업 종류별 트랙

| 종류 | 트랙 | 호출 |
|---|---|---|
| 인프라/스캐폴딩 | `docs/setup.md` Step 누적 | 직접 |
| 새 기능 (새 사용자 행위) | SDD 풀 루프 | `/planning` → `/spec` → `/dev` |
| 기존 스펙 변경 (기능 수정 요청) | 스펙 변경 | `/spec "요구사항"` → `/dev` |
| 기존 스펙 제거 | 스펙 제거 | `/spec --remove "대상"` → `/dev` |
| 버그 (스펙대로 안 됨) | 바로 수정 + 커밋 | `fix(scope):` |
| 리팩터 (동작 변경 없음) | 바로 수정 + 커밋 | `refactor(scope):` |
| 스타일/토큰 조정 | 바로 수정 + 커밋 | `style(scope):` |

판단 기준:
- "새 사용자 행위가 생기는가?" → SDD
- "기존 스펙이 변경?" → 스펙 변경
- "스펙대로 안 됨?" → 버그 수정
- "동작 안 바뀌고 코드만?" → 리팩터

## SDD 산출물 위치

```
docs/plans/<feature>/plan.md                        # /planning 산출물
docs/specs/changes/<feature>/                       # /spec 산출물 (개발 중)
  ├── proposal.md
  ├── design.md
  ├── tasks.md
  └── specs/<capability>/spec.md                    # capability별 분리
docs/specs/main/<capability>/spec.md                # /dev 완료 후 sync
docs/specs/archive/YYYY-MM-DD-<feature>/            # /dev 아카이브
```

## 역할 분리

| 역할 | 담당 | 산출물 |
|---|---|---|
| 개발자 | tasks.md 순서대로 TDD (단위/RTL) + 구현 | 코드 + 단위/RTL 테스트 + 커버리지 |
| 리뷰어 | 코드 품질 + CLAUDE.md 금지 패턴 + 런타임 기동 검증 | PASS/FAIL + 런타임 로그 |
| 테스터 | E2E 선별 + Playwright + 보안 검증 | E2E 테스트 + 보안 리포트 |

## 개념 문서 (`docs/concepts/`)

새 패턴/라이브러리/보안 결정이 생길 때마다 6섹션 포맷으로 작성:
한 줄 정의 / 왜 필요한가 / 표준 근거 / 우리 구조에서 어디에 / 대안과 trade-off / 참고 자료.
인덱스: `docs/concepts/README.md`.

## 공통 원칙: 실패 시 대안 시도

모든 에이전트(개발자/리뷰어/테스터) 공통:
- **실패 → 바로 중단 금지**
- 실패 → 대안 시도 → 전부 실패 시 보고
- 예: 보안 스캔 실패 → `--json` 시도 → `npm audit` 시도 → 전부 실패 시 보고

## 스킬 호출 순서

```
/planning <feature>   →  docs/plans/<feature>/plan.md
/spec <feature>       →  docs/specs/changes/<feature>/ (4파일 + specs/)
/spec "변경 텍스트"   →  docs/specs/changes/<change-name>/ (Mode 2)
/dev <feature>        →  개발 → 리뷰 → 테스트 → sync → archive
```

스킬 정의: `.claude/skills/{planning,spec,dev}/SKILL.md`
