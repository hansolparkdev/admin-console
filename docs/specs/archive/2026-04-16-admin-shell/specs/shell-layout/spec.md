---
capability: shell-layout
delta_kind: MODIFIED
from_archive: 2026-04-16-admin-shell/shell-layout/spec.md
---

# shell-layout — admin-shell 개편 델타

## 개편 요약

Stitch "관리자 관리" 스크린 기준으로 사이드바 배경·워드마크·프로필 블록, 헤더 배경·검색·우측 요소, z-index 계층을 전면 갱신한다. Main footer(`<footer role="contentinfo">`)를 신설해 Shell 4영역을 완성하며, CSS 토큰을 신규 4종 추가·기존 7종 값 갱신한다.

---

## MODIFIED Requirement 1 — Sidebar 배경·워드마크·z-index

### 기존 (docs/specs/main/shell-layout/spec.md: Shell 3영역 구조 일부)

- Sidebar z-index 30
- 워드마크 "The Lens"(h1) + "Admin Console"(sub), `<Link href="/dashboard">`

### 변경

- Sidebar 배경 `var(--sidebar)` = `#1e293b`(slate-800), z-index **40**
- 워드마크: `<Link href="/dashboard" aria-label="ADMIN CONSOLE 홈">` (Tab 첫 포커스 진입점)
  - `<h2 aria-hidden="true">ADMIN CONSOLE</h2>` — 20px / 700 / tracking-tight / white / `var(--font-sans)`
  - `<p aria-hidden="true">Admin Console System</p>` — 12px / 500 / uppercase / tracking-widest / `var(--sidebar-subtle)`
- "The Lens", "The Executive Lens" 문자열 제거

### 수용 기준 (AC)

- `globals.css` `:root`에 `--sidebar: #1e293b` 선언
- `<aside>` computed background-color가 `rgb(30, 41, 59)` 또는 `#1e293b`
- `<aside>` CSS z-index가 40
- `<Link aria-label="ADMIN CONSOLE 홈">` 존재 (`getByRole("link", { name: "ADMIN CONSOLE 홈" })` 일치)
- "ADMIN CONSOLE" 텍스트가 `<aside>` 내부에 존재
- "Admin Console System" 텍스트가 `<aside>` 내부에 존재, uppercase
- 내부 `<h2>`·`<p>`가 `aria-hidden="true"` 속성 보유
- "The Lens" 텍스트 부재

#### Scenario: 워드마크 aria-label 및 자식 aria-hidden

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** 워드마크 링크를 탐색한다
- **Then** `aria-label="ADMIN CONSOLE 홈"` 속성을 가진 링크가 존재한다
- **And** 내부 `<h2>`와 `<p>` 요소가 각각 `aria-hidden="true"` 속성을 가진다
- **And** 링크 접근 가능한 이름(accessible name)이 "ADMIN CONSOLE 홈"으로 단일화된다

#### Scenario: Sidebar 배경 색 갱신

- **Given** `globals.css`에 `--sidebar: #1e293b`가 선언되어 있다
- **When** 브라우저가 스타일을 계산한다
- **Then** `<aside>` computed background-color가 `rgb(30, 41, 59)`이다
- **And** "The Lens" 텍스트가 `<aside>` 내부에 존재하지 않는다

---

## MODIFIED Requirement 2 — Sidebar 사용자 프로필 블록

### 기존 (docs/specs/main/sidebar-navigation/spec.md: 사용자 푸터)

> - "Admin User" 텍스트
> - "Administrator" 텍스트
> - 아바타 이니셜 "A"

### 변경

3줄 텍스트 + 40px 회색 원 아바타로 재구성. 이미지 없는 placeholder. `data-testid="user-email"` 추가.

### 수용 기준 (AC)

- `최고 관리자` 텍스트 존재, uppercase + tracking-wider, 색 `var(--primary-fixed)`
- `Admin_User` 텍스트 존재, 14px / white
- `super-admin@system.com` 텍스트 존재, `data-testid="user-email"`, 10px / slate-400
- "Admin User"·"Administrator" 문자열 부재
- 이니셜 "A" 텍스트 부재
- 아바타 영역이 40×40px 원형, 배경 `var(--sidebar-avatar-bg)`, `<img>` 없음
- `SidebarUserFooter.tsx` 상단에 `// TODO(google-oidc-login): 세션 프로필로 교체` 주석 존재

#### Scenario: 사용자 프로필 3줄 렌더

- **Given** `SidebarUserFooter` 컴포넌트가 렌더되었다
- **When** 프로필 블록을 탐색한다
- **Then** "최고 관리자" 텍스트가 존재한다
- **And** "Admin_User" 텍스트가 존재한다
- **And** `data-testid="user-email"` 요소에 "super-admin@system.com" 텍스트가 존재한다
- **And** "Admin User", "Administrator" 문자열이 DOM 내에 존재하지 않는다

#### Scenario: 아바타 placeholder (이미지 없음)

- **Given** `SidebarUserFooter` 컴포넌트가 렌더되었다
- **When** 아바타 영역을 탐색한다
- **Then** `<img>` 요소가 존재하지 않는다
- **And** 40×40px 원형 `<div>`에 `var(--sidebar-avatar-bg)` 배경이 적용된다

---

## MODIFIED Requirement 3 — 글래스 헤더 시각 효과 갱신

### 기존 (docs/specs/main/shell-layout/spec.md: 글래스 헤더 시각 효과)

> `--header-glass-bg: rgb(255 255 255 / 0.8)`
>
> #### Scenario: 헤더 우측 브랜드 배지 렌더
> - **Then** "The Executive Lens" 텍스트가 존재한다

### 변경

- 헤더 배경 `var(--header-glass-bg)` 값 `rgb(248 250 252 / 0.8)`(slate-50/80)으로 갱신
- "The Executive Lens" 브랜드 배지 제거 (기존 스펙 Scenario 전면 REMOVED)
- Header z-index 40 → **50**

### 수용 기준 (AC)

- `globals.css` `:root`에 `--header-glass-bg: rgb(248 250 252 / 0.8)` 선언
- `<header>` computed backdrop-filter에 `blur(12px)` 포함
- `-webkit-backdrop-filter: blur(12px)` 병기
- `role="banner"` 내부 "The Executive Lens", "The Lens", "Admin Console" 텍스트 전부 0건
- `<header>` CSS z-index가 50

#### Scenario: 헤더 배경 갱신 및 브랜드 부재

- **Given** `globals.css`에 `--header-glass-bg: rgb(248 250 252 / 0.8)`이 선언되어 있다
- **When** 브라우저가 헤더 스타일을 렌더한다
- **Then** `getComputedStyle(header).backdropFilter`에 `blur(12px)`가 포함된다
- **And** `role="banner"` 내부에 "The Executive Lens" 텍스트가 존재하지 않는다
- **And** `role="banner"` 내부에 "Admin Console" 텍스트가 존재하지 않는다

#### Scenario: REMOVED — 헤더 우측 브랜드 배지 (기존 Scenario 삭제)

기존 spec의 "헤더 우측 브랜드 배지 렌더" Scenario는 본 개편으로 **삭제**된다. "The Executive Lens" 브랜드는 헤더에 존재하지 않아야 한다. 회귀 테스트(`Header.test.tsx`, E2E SC-07)가 부재 여부를 지속 검증한다.

---

## MODIFIED Requirement 4 — 헤더 우측 요소 재구성

### 기존

도움말(HelpCircle) 버튼 존재. 알림 dot 배경 `var(--primary)`. 프로필 링크 미존재. "The Executive Lens" 텍스트 존재.

### 변경

- 도움말 버튼 **제거**
- 라이트/다크 토글 버튼 **신설**: lucide `Sun` 20px, `<button type="button" aria-label="테마 전환">`, noop, `aria-pressed` 속성 없음
- 알림 dot 배경 `var(--destructive)` = `#9f403d`, 좌표 `top-2 right-2`, 링 `var(--notification-dot-ring)` = `#ffffff`
- 프로필 링크 **신설**: `<Link href="/admins" aria-label="프로필">`, 32px 회색 원 placeholder + `Admin_User` 텍스트
- 우측 순서: 라이트토글 → 알림 → 수직 divider → 프로필 링크

### 수용 기준 (AC)

- `aria-label="테마 전환"` 버튼이 존재한다
- 해당 버튼에 `aria-pressed` 속성이 없다
- `aria-label="알림"` 버튼이 존재한다
- `aria-label="도움말"` 버튼이 존재하지 않는다
- `aria-label="프로필"` 링크가 `href="/admins"`로 존재한다
- 프로필 링크 내부에 "Admin_User" 텍스트가 존재한다
- `Header.tsx` 소스에 `HelpCircle` import가 없다

#### Scenario: 라이트토글 버튼 noop + aria-pressed 부재

- **Given** `Header` 컴포넌트가 렌더되었다
- **When** `aria-label="테마 전환"` 버튼을 탐색한다
- **Then** 해당 버튼이 존재한다
- **And** `aria-pressed` 속성이 없다 (`not.toHaveAttribute("aria-pressed")`)

#### Scenario: 도움말 버튼 부재

- **Given** `Header` 컴포넌트가 렌더되었다
- **When** `role="button"` 요소 전체를 탐색한다
- **Then** `aria-label="도움말"` 버튼이 존재하지 않는다

#### Scenario: 프로필 링크 존재 및 href

- **Given** `Header` 컴포넌트가 렌더되었다
- **When** `aria-label="프로필"` 링크를 탐색한다
- **Then** 링크가 존재한다
- **And** href가 `"/admins"`이다
- **And** 링크 내부에 "Admin_User" 텍스트가 존재한다

---

## MODIFIED Requirement 5 — 헤더 검색 인풋 갱신

### 기존 (docs/specs/main/shell-layout/spec.md 간접)

- 너비 384px(w-96)
- placeholder "Search data points..." (영어)

### 변경

- 너비 320px (`w-80`)
- placeholder "시스템 기능 검색..." (한국어)
- 배경 `var(--search-input-bg)` = `#f0f4f7`

### 수용 기준 (AC)

#### Scenario: 검색 인풋 한국어 placeholder 및 너비

- **Given** `SearchInput` 컴포넌트가 렌더되었다
- **When** input 요소를 탐색한다
- **Then** placeholder 속성이 "시스템 기능 검색..."이다
- **And** 너비 관련 클래스 또는 style에 `w-80`(320px)이 적용된다

---

## MODIFIED Requirement 6 — z-index 계층 갱신

### 기존 (docs/specs/main/shell-layout/spec.md: z-index 계층)

> Sidebar z-index 30, Header z-index 40

### 변경

Sidebar z-index **40**, Header z-index **50** (Stitch 원본 매치).

### 수용 기준 (AC)

#### Scenario: Sidebar/Header z-index 갱신

- **Given** Shell이 1280×800 viewport에서 렌더된다
- **When** Sidebar와 Header의 CSS z-index 값을 확인한다
- **Then** `<aside>` z-index가 40이다
- **And** `<header>` z-index가 50이다
- **And** 두 요소의 bounding rect가 여전히 겹치지 않는다(좌우 인접)

---

## ADDED Requirement — Main Footer (contentinfo)

### 기존

기존 spec에 footer 없음.

### 변경

`(app)/layout.tsx` Shell flex-col 마지막 요소로 `<footer role="contentinfo">` 신설.

### 수용 기준 (AC)

- `<footer role="contentinfo">` 요소가 `(app)/layout.tsx` 렌더 결과에 존재한다
- footer 내부 `<p>` 텍스트: `© {YYYY} ADMIN CONSOLE. All rights reserved.` (YYYY = `new Date().getFullYear()`)
- padding `p-8`, text-align center
- 색 `var(--footer-muted-foreground)`
- `<main>` 바깥, `ml-64` 부모 div 내부에 위치

#### Scenario: footer 랜드마크 존재

- **Given** `(app)/layout.tsx`가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `role="contentinfo"` 요소가 1개 존재한다
- **And** `<aside>`, `<header>`, `<main>`, `<footer>` 랜드마크가 각각 1개씩 존재한다

#### Scenario: footer copyright 텍스트 동적 연도

- **Given** `(app)/layout.tsx`가 렌더되었다
- **When** `role="contentinfo"` 내부 텍스트를 확인한다
- **Then** 텍스트가 `© ${현재연도} ADMIN CONSOLE. All rights reserved.` 패턴과 일치한다
- **And** 연도가 `new Date().getFullYear()`로 동적 생성된다

---

## MODIFIED Requirement 7 — CSS 토큰 선언 갱신

### 기존 (docs/specs/main/shell-layout/spec.md: CSS 변수 선언)

> `--header-glass-bg: rgb(255 255 255 / 0.8)`

### 변경

신규 4종 추가, 기존 7종 값 갱신, 재할당 1종.

| 토큰 | 이전 값 | 신규 값 | 비고 |
|---|---|---|---|
| `--sidebar` | `#0f172a` | `#1e293b` | 갱신 |
| `--sidebar-accent` | (다른 값) | `rgba(255,255,255,0.1)` | 갱신 |
| `--sidebar-accent-foreground` | (다른 값) | `#ffffff` | 갱신 |
| `--sidebar-footer-bg` | (다른 값) | `rgba(30,41,59,0.4)` | 갱신 |
| `--header-glass-bg` | `rgb(255 255 255 / 0.8)` | `rgb(248 250 252 / 0.8)` | 갱신 |
| `--search-input-bg` | `#f8fafc` | `#f0f4f7` | 갱신 |
| `--notification-dot-ring` | (다른 값) | `#ffffff` | 갱신 |
| `--sidebar-hover-bg` | (없음) | `rgba(51,65,85,0.5)` | 신규 |
| `--sidebar-avatar-bg` | (없음) | `#334155` | 신규 |
| `--header-button-hover-bg` | (없음) | `rgba(226,232,240,0.5)` | 신규 |
| `--footer-muted-foreground` | (없음) | `rgba(86,97,102,0.6)` | 신규 |
| `--sidebar-primary` | `#2563eb` | `var(--sidebar-accent)` | 재할당 (bar 제거) |

### 수용 기준 (AC)

#### Scenario: 신규 토큰 4종 선언 존재

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `:root` 블록을 파싱한다
- **Then** `--sidebar-hover-bg`, `--sidebar-avatar-bg`, `--header-button-hover-bg`, `--footer-muted-foreground` 4종이 모두 존재한다

#### Scenario: 갱신 토큰 값 검증

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `:root` 블록을 파싱한다
- **Then** `--header-glass-bg: rgb(248 250 252 / 0.8)` 선언이 존재한다
- **And** `--sidebar: #1e293b` 선언이 존재한다

---

## MODIFIED Requirement 8 — 접근성 랜드마크 (footer 추가)

### 기존 (docs/specs/main/shell-layout/spec.md: 접근성 랜드마크)

> `<aside>`, `<header>`, `<main>` 랜드마크를 각 1개씩 구성.

### 변경

`<footer role="contentinfo">` 추가로 4개 랜드마크 완성.

### 수용 기준 (AC)

#### Scenario: 랜드마크 4개 각 1개 존재

- **Given** `(app)/layout.tsx`가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `role="complementary"` (aside) 1개, `role="banner"` (header) 1개, `role="main"` 1개, `role="contentinfo"` (footer) 1개가 존재한다
- **And** `aria-label="사이드바 주 메뉴"` nav가 aside 내부에 있다
