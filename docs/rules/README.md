# Rules

CLAUDE.md의 "규약 본체"에서 분할한 세부 규칙들. CLAUDE.md는 매 요청마다 읽히므로 가볍게 유지하고, 상세 내용은 여기에 둔다.

## 목록

| 문서 | 내용 |
| --- | --- |
| [forbidden-patterns.md](forbidden-patterns.md) | **금지 패턴 상세**. CLAUDE.md 요약의 단일 진실원. 서브에이전트(developer·reviewer·critic) 프리로드 필수 |
| [folder-conventions.md](folder-conventions.md) | apps/admin, apps/api 폴더 배치 규칙. 새 파일 위치 결정 시 참조 |
| [dev-workflow.md](dev-workflow.md) | `/dev` 스킬의 Developer / Reviewer / Tester 각 Step 규율. E2E 우회 금지 등 |
| [commands.md](commands.md) | 전체 pnpm 명령 + 인프라(docker/prisma) 명령 표 |
| [dev-flow.md](dev-flow.md) | 인프라 vs SDD 트랙 분기, SDD 산출물 위치, 개념 문서 작성 규칙 |

## 사용법

CLAUDE.md 상단 "참조 문서" 섹션에서 이 문서들을 링크한다. Claude가 해당 주제를 다룰 때만 선택적으로 읽게 해 컨텍스트 윈도우를 보호.

추가 규칙이 늘어나면 여기에 새 파일을 만들고 인덱스에 등록.
