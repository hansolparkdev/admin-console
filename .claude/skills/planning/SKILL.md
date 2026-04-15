---
name: planning
description: 기획 에이전트 + 비평 에이전트로 plan.md 작성. 사용법 /planning {기능명}
---

기획 에이전트와 비평 에이전트를 활용해 기획서를 작성합니다.

## Step 1: feature 이름 추출

- 입력: `$ARGUMENTS` (예: "로그인 기능")
- {feature}: 영문 소문자·하이픈으로 변환 (예: `login`, `user-profile`)

## Step 2: 구조 감지

루트 `CLAUDE.md`에서:
- `STRUCTURE` = `프로젝트 타입` 값 (frontend | backend | fullstack | monorepo)
- `PACKAGES` = 모노레포면 `워크스페이스 구조`의 apps/* 목록

**CLAUDE.md가 없으면** → `/init` 먼저 실행하라고 유저에게 안내 후 중단.

## Step 3: 기획 초안 (planner 호출)

전달 변수:
- `FEATURE`: {feature}
- `REQUIREMENT`: `$ARGUMENTS` 원문
- `STRUCTURE`: 위에서 추출
- `PACKAGES`: 모노레포만

## Step 4: 비평 루프 (최대 3회)

critic 호출:
- `현재 {N}회차입니다. 아래 기획서를 비평하세요.` + 초안 전체

- PASS → Step 5
- FAIL → 비평 결과를 planner에 전달해 수정 → 다시 critic
- 3회 완료 후 FAIL → 경고 헤더 추가하고 Step 5로

## Step 5: 저장

`docs/plans/{feature}/plan.md` 로 저장.

3회 FAIL이면 상단에 아래 추가:
```
> ⚠️ 경고: 비평 3회 후 미해결 문제 있음. 검토 후 진행하세요.
> 미해결: (FAIL 사유 요약)
```

## Step 6: 완료 안내

```
✓ plan.md 저장 ({비평 결과: PASS 또는 경고})

다음 단계:
- /dev {feature}  — 스펙 생성 + 전체 슬라이스 개발
```

## 참고
디자인 필요하면 plan.md 내용을 Google Stitch에 입력. 결과물(stitch-prompt.md, ui.png)은 docs/design/{feature}/ 에 유저가 직접 저장.
