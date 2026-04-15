---
name: spec
description: plan.md를 아키텍트에 전달해 슬라이스별 SDD 산출물(proposal/design/tasks/spec)을 생성합니다. 사용법 /spec {feature}
---

plan.md를 기반으로 슬라이싱하여 각 슬라이스의 SDD 산출물을 생성합니다.

## 사전 조건
- `docs/plans/$ARGUMENTS/plan.md` 존재
- 루트 `CLAUDE.md` 존재 (없으면 `/init` 먼저)

## Step 1: 컨텍스트 추출

### 루트 CLAUDE.md 읽기
- `STRUCTURE` = 프로젝트 타입 (frontend | backend | fullstack | monorepo)
- `PACKAGES_LIST` = 모노레포면 apps/*, packages/* 목록
- `STACK_MAP` = 모노레포면 패키지별 스택, 단일이면 전역 스택

### 기존 스펙 도메인 목록
- `EXISTING_DOMAINS` = `docs/specs/main/` 하위 폴더 목록

## Step 2: 아키텍트 호출

전달 변수:
- `FEATURE` = `$ARGUMENTS`
- `STRUCTURE`
- `PACKAGES` (모노레포만)
- `STACK` (슬라이스가 여러 패키지로 갈릴 수 있으므로 맵 또는 전역값)
- `EXISTING_DOMAINS`

아키텍트는 `docs/plans/$ARGUMENTS/plan.md` 1회 읽고 `docs/specs/changes/{feature}-{slice}/` 아래 4개 파일 생성.

## Step 3: 산출물 확인

생성된 슬라이스 폴더를 나열하고 각 `proposal.md`에서:
- `패키지:` 필드 (단일이면 `.`, 모노레포면 패키지 경로)
- `type:` 필드
- `영향 도메인:`

`tasks.md`의 `선행 슬라이스:`로 의존관계 파악.

## Step 4: 유저에게 슬라이스 계획 보고

```
✓ 슬라이싱 완료: N개

순서:
1. {slice1}  [패키지: .]         의존: 없음
2. {slice2}  [패키지: apps/web]  의존: 없음
3. {slice3}  [패키지: apps/api]  의존: 없음

다음 단계:
/dev {slice1}     # 순서대로 각자 실행
/dev {slice2}
...
```

## 규칙
- 이 스킬은 스펙 생성만. 개발은 `/dev`가 담당.
- 모노레포면 아키텍트가 반드시 패키지별로 슬라이스 분리해야 함
- plan.md 이외 어떤 파일도 재편집하지 않음
