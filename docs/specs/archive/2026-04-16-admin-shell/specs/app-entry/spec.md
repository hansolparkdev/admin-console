---
capability: app-entry
delta_kind: MODIFIED
from_archive: 2026-04-16-admin-shell/app-entry/spec.md
---

# app-entry — admin-shell 개편 델타

## 개편 요약

도메인 확정("관리자 계정 관리")에 따라 `/users` 라우트를 `/admins`로 리네임한다. `app/page.tsx`의 루트 redirect, `(app)` 라우트 그룹 구조, auth() hook point 주석, dashboard placeholder는 변경 없다.

---

## MODIFIED Requirement — users placeholder 페이지 → admins placeholder 페이지

### 기존 (docs/specs/main/app-entry/spec.md)

> `(app)/users/page.tsx`에 Headline-SM 타이틀 "Users"와 후속 슬라이스 안내 문구를 렌더.

#### 기존 Scenario: users 페이지 타이틀 렌더

- **Given** 사용자가 `/users`에 접근한다
- **When** 메인 영역이 렌더된다
- **Then** "Users" 텍스트가 Headline 수준 요소로 존재한다
- **And** 후속 슬라이스 안내 문구가 표시된다

### 변경

`(app)/users/page.tsx`를 `git mv`로 `(app)/admins/page.tsx`로 이동. 파일 내부 타이틀·안내 문구를 한국어로 교체.

### 수용 기준 (AC)

- `apps/admin/src/app/(app)/users/` 디렉터리가 존재하지 않는다
- `apps/admin/src/app/(app)/admins/page.tsx`가 존재한다
- `/admins` 접근 시 메인 영역에 `<h1>관리자 관리</h1>`가 렌더된다
- 안내 문구 "관리자 목록은 후속 슬라이스에서 추가됩니다."가 표시된다
- `<h1>` 내부 또는 페이지 어디에도 "Users" 텍스트가 존재하지 않는다

#### Scenario: admins 페이지 타이틀 렌더 (한국어)

- **Given** 사용자가 `/admins`에 접근한다
- **When** 메인 영역이 렌더된다
- **Then** "관리자 관리" 텍스트가 `<h1>` 요소로 존재한다
- **And** "관리자 목록은 후속 슬라이스에서 추가됩니다." 안내 문구가 표시된다
- **And** "Users" 텍스트가 어디에도 존재하지 않는다

#### Scenario: admins 페이지 default export

- **Given** `apps/admin/src/app/(app)/admins/page.tsx` 파일을 읽는다
- **When** export 방식을 확인한다
- **Then** default export 함수가 존재한다 (Next.js page 규약)

---

## MODIFIED Requirement — (app) 라우트 그룹 구조 (Shell 공유 대상 갱신)

### 기존 (docs/specs/main/app-entry/spec.md)

> #### Scenario: (app) 그룹 내 모든 페이지가 Shell을 공유
> - **When** `/dashboard` 또는 `/users`로 접근한다
> - **Then** 두 경로 모두 동일한 사이드바·헤더가 표시된다

### 변경

Shell 공유 대상 라우트가 `/users` → `/admins`로 변경.

### 수용 기준 (AC)

#### Scenario: (app) 그룹 내 모든 페이지가 Shell을 공유 (갱신)

- **Given** `(app)/layout.tsx`에 Shell이 렌더된다
- **When** `/dashboard` 또는 `/admins`로 접근한다
- **Then** 두 경로 모두 동일한 사이드바·헤더·푸터가 표시된다
- **And** 사이드바와 헤더는 라우트 이동 시 재렌더되지 않는다

---

## MODIFIED Requirement — 테스트 경로 (파일 위치 갱신)

### 기존

`apps/admin/tests/unit/app/(app)/users/page.test.tsx`

### 변경

`git mv`로 `apps/admin/tests/unit/app/(app)/admins/page.test.tsx`로 이동. assertion 교체.

### 수용 기준 (AC)

- `tests/unit/app/(app)/users/page.test.tsx` 파일이 존재하지 않는다
- `tests/unit/app/(app)/admins/page.test.tsx`가 존재한다
- 테스트가 `<h1>관리자 관리</h1>` 렌더를 단언한다
- 테스트가 "Users" 텍스트 부재를 단언한다

#### Scenario: 테스트 파일 위치 확인

- **Given** `apps/admin/tests/unit/app/(app)/` 디렉터리를 탐색한다
- **When** `users/` 및 `admins/` 하위 디렉터리를 확인한다
- **Then** `users/` 디렉터리가 존재하지 않는다
- **And** `admins/page.test.tsx`가 존재한다

---

## 변경 없음 (기존 Requirement 유지)

다음 Requirement는 본 개편에서 변경 없이 유지된다:

- **루트 리다이렉트**: `app/page.tsx`의 `redirect("/dashboard")` 그대로
- **auth() hook point**: `(app)/layout.tsx` 상단 `TODO(google-oidc-login)` 주석 유지
- **dashboard placeholder 페이지**: `(app)/dashboard/page.tsx` 변경 없음
- **성능·접근성 기준**: Lighthouse 성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02 동일
