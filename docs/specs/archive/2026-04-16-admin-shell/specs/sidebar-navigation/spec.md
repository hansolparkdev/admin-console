---
capability: sidebar-navigation
delta_kind: MODIFIED
from_archive: 2026-04-16-admin-shell/sidebar-navigation/spec.md
---

# sidebar-navigation — admin-shell 개편 델타

## 개편 요약

메뉴 구성을 5개 → 2개로 축소하고 `/users` → `/admins` 라우트로 교체한다. 활성 스타일에서 우측 4px bar `<span>`을 제거하고 `translate-x-1` transform을 추가한다. `is-menu-active` 함수 계약은 변경 없으며 테스트 케이스를 `/admins` 기준으로 재작성한다.

---

## MODIFIED Requirement 1 — 메뉴 prefix 매칭 활성 판정 (테스트 케이스 갱신)

### 기존 (docs/specs/main/sidebar-navigation/spec.md)

> #### Scenario: Users 경로 하위 깊이 일치
> - **Given** pathname이 `"/users/123/edit"`이고 href가 `"/users"`이다
> - **Then** 결과가 true이다
>
> #### Scenario: false positive — /usersettings는 /users와 매칭하지 않음
> - **Given** pathname이 `"/usersettings"`이고 href가 `"/users"`이다
> - **Then** 결과가 false이다

### 변경

함수 계약(`pathname이 href로 시작하되 다음 문자가 '/' 또는 문자열 끝`)은 동일. 테스트 케이스를 `/admins` 기준으로 교체. `/adminsettings` false positive 케이스 필수.

### 수용 기준 (AC) — 6 케이스 전원 통과

| pathname | href | 기대값 | 검증 목적 |
|---|---|---|---|
| `/dashboard` | `/dashboard` | true | 정확 일치 |
| `/dashboard/anything` | `/dashboard` | true | 하위 경로 |
| `/admins` | `/admins` | true | 관리자 관리 정확 일치 |
| `/admins/123` | `/admins` | true | 관리자 관리 하위 경로 |
| `/adminsettings` | `/admins` | **false** | false positive 방지 |
| `/dashboarding` | `/dashboard` | **false** | false positive 방지 |

#### Scenario: admins 경로 정확 일치

- **Given** pathname이 `"/admins"`이고 href가 `"/admins"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: admins 경로 하위 깊이 일치

- **Given** pathname이 `"/admins/123"`이고 href가 `"/admins"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: false positive — /adminsettings는 /admins와 매칭하지 않음

- **Given** pathname이 `"/adminsettings"`이고 href가 `"/admins"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 false이다
- **And** 관리자 관리 메뉴가 활성 상태가 되지 않는다

#### Scenario: false positive — /dashboarding은 /dashboard와 매칭하지 않음

- **Given** pathname이 `"/dashboarding"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 false이다

---

## MODIFIED Requirement 2 — SidebarNav 활성 메뉴 표시 (스타일 변경)

### 기존 (docs/specs/main/sidebar-navigation/spec.md)

> 활성 항목은 `var(--sidebar-accent)` 배경 + `var(--sidebar-accent-foreground)` 텍스트 + **우측 4px `var(--sidebar-primary)` 액센트 바**.

### 변경

- 우측 4px bar `<span>` **제거**
- `translate-x-1` transform (`transform: translateX(4px)`) **추가**
- `rounded-xl`(12px, 기존 `rounded-md`에서 변경)
- 활성 배경: `var(--sidebar-accent)` = `rgba(255,255,255,0.1)` 유지
- 활성 텍스트: `var(--sidebar-accent-foreground)` = `#ffffff` 유지, `font-semibold`
- 비활성 텍스트: `var(--sidebar-muted-foreground)` = `#94a3b8`
- 아이콘 크기 22px (기존 20px에서 변경)
- shadow-sm 추가

### 수용 기준 (AC)

- 활성 항목 내부에 `aria-hidden="true"` + 우측 배치 `<span>` 자식이 **존재하지 않는다**
- 활성 항목 className에 `translate-x-1`이 포함되거나 computed transform이 `translateX(4px)`이다
- 활성 항목 className에 `rounded-xl`이 포함된다
- 활성 항목에 `aria-current="page"` 속성이 있다
- 비활성 항목에 `aria-current` 속성이 없다

#### Scenario: 활성 메뉴 bar 제거 및 translate-x-1 추가

- **Given** 현재 pathname이 `"/dashboard"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** 대시보드 항목에 `aria-current="page"` 속성이 있다
- **And** 대시보드 항목의 자식 요소에 `width: 4px`인 `<span>`이 존재하지 않는다
- **And** 대시보드 항목 className에 `translate-x-1`이 포함된다 (또는 computed transform이 none이 아니다)

#### Scenario: 활성 전환 — /admins에서 관리자 관리 활성

- **Given** 현재 pathname이 `"/admins"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** 관리자 관리 항목에 `aria-current="page"` 속성이 있다
- **And** 대시보드 항목에 `aria-current` 속성이 없다

#### Scenario: REMOVED — 활성 메뉴 우측 액센트 바

기존 spec의 "활성 메뉴 우측 액센트 바 렌더" Scenario는 본 개편으로 **삭제**된다. 우측 4px bar는 Stitch 원본에 없었던 구현 일탈로, 정상화 후 회귀 테스트가 **bar 부재**를 검증한다.

---

## MODIFIED Requirement 3 — Sidebar 구조 및 워드마크 (메뉴 구성 갱신)

### 기존 (docs/specs/main/sidebar-navigation/spec.md)

> #### Scenario: 사이드바 메뉴 구성
> - **Then** 항목이 [Dashboard, Users, Analytics, Settings, Reports] 5개이고 순서가 일치한다

### 변경

메뉴 2개로 축소: `대시보드`(`/dashboard`/`LayoutDashboard`) + `관리자 관리`(`/admins`/`ShieldCheck`).

### 수용 기준 (AC)

- `menuItems.length === 2`
- 항목 0: `label === "대시보드"`, `href === "/dashboard"`, icon은 `LayoutDashboard` (lucide-react)
- 항목 1: `label === "관리자 관리"`, `href === "/admins"`, icon은 `ShieldCheck` (lucide-react)
- `menuItems`에 `/users`, `/analytics`, `/settings`, `/reports` href가 **존재하지 않는다**

#### Scenario: 메뉴 2개 구성 및 순서

- **Given** `menu-config.ts`의 `menuItems` 배열을 읽는다
- **When** 배열 길이와 각 항목의 속성을 확인한다
- **Then** 배열 길이가 2이다
- **And** 첫 번째 항목의 label이 "대시보드"이고 href가 "/dashboard"이다
- **And** 두 번째 항목의 label이 "관리자 관리"이고 href가 "/admins"이다
- **And** 두 항목 모두 icon 속성이 null 또는 undefined가 아니다

#### Scenario: Ghost 라우트 href 부재

- **Given** `menu-config.ts`의 `menuItems` 배열을 읽는다
- **When** 각 항목의 href를 확인한다
- **Then** href가 "/users", "/analytics", "/settings", "/reports" 중 어느 것도 포함하지 않는다

#### Scenario: 사이드바 렌더 — 2개 메뉴 항목

- **Given** `SidebarNav` 컴포넌트가 렌더되었다
- **When** `nav[aria-label="사이드바 주 메뉴"]` 내부 링크를 탐색한다
- **Then** `href="/dashboard"` 링크가 존재한다
- **And** `href="/admins"` 링크가 존재한다
- **And** `href="/users"`, `href="/analytics"`, `href="/settings"`, `href="/reports"` 링크가 **존재하지 않는다**

---

## MODIFIED Requirement 4 — 사용자 푸터 (스펙 이관)

### 기존 (docs/specs/main/sidebar-navigation/spec.md: 사용자 푸터)

> - "Admin User" 텍스트, "Administrator" 텍스트, 이니셜 "A"

### 변경

shell-layout capability로 상세 사양 이관. sidebar-navigation에서는 SidebarUserFooter가 SidebarNav와 함께 Sidebar 컴포넌트의 하위 구성요소로 협력한다는 구조적 사실만 유지.

### 수용 기준 (AC)

- `SidebarUserFooter`가 `<aside>` 내부 최하단(`mt-auto`)에 위치한다
- shell-layout 델타의 사용자 프로필 블록 요구사항과 일관성을 유지한다

---

## MODIFIED Requirement 5 — 메뉴 항목 시각 사양 (아이콘 크기·모서리 갱신)

### 기존 (docs/specs/main/sidebar-navigation/spec.md)

> - 아이콘(lucide-react, 20px)
> - 활성 항목: `var(--sidebar-accent)` 배경 + `var(--sidebar-accent-foreground)` 텍스트 + 우측 4px bar

### 변경

- 아이콘 22px (Stitch HTML `text-[22px]` 매치)
- 모서리 `rounded-xl`(12px, 기존 `rounded-md`에서 변경)
- 메뉴 hover 배경 `var(--sidebar-hover-bg)` = `rgba(51,65,85,0.5)` (신규 토큰)
- 터치 타겟 높이 ≥ 44px 유지 (`px-4 py-3` = 12px 수직 패딩)
- transition: `all 200ms`

### 수용 기준 (AC)

#### Scenario: 메뉴 항목 시각 사양

- **Given** `SidebarNav` 컴포넌트가 렌더되었다
- **When** 메뉴 항목 요소를 탐색한다
- **Then** 각 항목의 className에 `rounded-xl`이 포함된다
- **And** 아이콘 요소의 크기가 22px에 해당하는 클래스(예: `w-[22px]` 또는 `size-[22px]`)가 적용된다
- **And** 각 항목의 터치 타겟 높이가 44px 이상이다

#### Scenario: 메뉴 이동 시 Shell 유지 (라우트 갱신)

- **Given** 사용자가 `/dashboard`에 있다
- **When** 사이드바 "관리자 관리" 링크를 클릭한다
- **Then** URL이 `/admins`로 변경된다
- **And** 사이드바와 헤더는 DOM에서 유지된다 (re-mount 없음)
- **And** 메인 영역 콘텐츠만 교체된다
