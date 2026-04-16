### Requirement: Shell 4영역 구조

데스크톱 전용(1024px+) 운영 콘솔의 공통 UI 프레임. 고정 사이드바(256px) + 고정 글래스 헤더(64px) + 메인 콘텐츠 영역 + Main Footer로 구성. 모든 치수·색상은 CSS 변수(`var(--*)`)로만 참조. No-Line 원칙(border·divide 클래스 금지) 엄격 적용.

#### Scenario: `/dashboard` 진입 시 Shell 4영역 모두 렌더

- **Given** 사용자가 `/dashboard` URL로 접근한다
- **When** 페이지가 렌더된다
- **Then** `role="complementary"` (aside) 사이드바가 visible이다
- **And** `role="banner"` (header) 헤더가 visible이다
- **And** `role="main"` 메인 영역이 visible이다
- **And** `role="contentinfo"` (footer) 푸터가 visible이다

#### Scenario: `/admins` 진입 시 Shell 4영역 모두 렌더

- **Given** 사용자가 `/admins` URL로 접근한다
- **When** 페이지가 렌더된다
- **Then** 사이드바·헤더·메인·푸터 4영역이 모두 visible이다
- **And** 메인 영역 내용만 교체되고 사이드바·헤더·푸터는 유지된다

#### Scenario: 사이드바 폭 및 헤더 높이 CSS 변수 기반

- **Given** `globals.css`에 `--sidebar-width: 16rem`, `--header-height: 4rem`이 선언되어 있다
- **When** 브라우저가 스타일을 계산한다
- **Then** 사이드바의 `width` 계산값이 256px이다
- **And** 헤더의 `height` 계산값이 64px이다
- **And** 메인 영역의 `margin-left`가 사이드바 폭과 동일하다
- **And** 메인 영역의 `margin-top`이 헤더 높이와 동일하다

### Requirement: 글래스 헤더 시각 효과

헤더 배경은 `var(--header-glass-bg)` 참조, `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter: blur(12px)` 병기. 헤더 z-index는 50. 헤더 우측에는 라이트/다크 토글, 알림, 수직 divider, 프로필 링크 순서로 구성하며 브랜드 배지를 포함하지 않는다.

#### Scenario: 헤더 backdrop-filter 적용

- **Given** `globals.css`에 `--header-glass-bg: rgb(248 250 252 / 0.8)`이 선언되어 있다
- **When** 브라우저(Chrome/Safari)가 헤더 스타일을 렌더한다
- **Then** `getComputedStyle(header).backdropFilter` 또는 `.webkitBackdropFilter`에 `"blur(12px)"`가 포함된다
- **And** 클래스명 문자열로 검증하지 않는다

#### Scenario: 헤더 배경 갱신 및 브랜드 부재

- **Given** `globals.css`에 `--header-glass-bg: rgb(248 250 252 / 0.8)`이 선언되어 있다
- **When** 브라우저가 헤더 스타일을 렌더한다
- **Then** `getComputedStyle(header).backdropFilter`에 `blur(12px)`가 포함된다
- **And** `role="banner"` 내부에 "The Executive Lens" 텍스트가 존재하지 않는다
- **And** `role="banner"` 내부에 "Admin Console" 텍스트가 존재하지 않는다

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

#### Scenario: 검색 인풋 한국어 placeholder 및 너비

- **Given** `SearchInput` 컴포넌트가 렌더되었다
- **When** input 요소를 탐색한다
- **Then** placeholder 속성이 "시스템 기능 검색..."이다
- **And** 너비 관련 클래스 또는 style에 `w-80`(320px)이 적용된다

### Requirement: No-Line 원칙

`apps/admin/src/components/layout/**` 및 `apps/admin/src/app/(app)/**` 범위에서 border·divide 클래스와 hex·rgba 리터럴을 사용하지 않는다. shadcn `components/ui/*`는 검증 범위 제외.

#### Scenario: border 클래스 사용 0건

- **Given** `components/layout/**`와 `app/(app)/**` 파일이 작성되었다
- **When** `border(-t|-b|-l|-r)?|divide-` 패턴으로 grep을 실행한다
- **Then** 매칭 건수가 0이다

#### Scenario: CSS 리터럴 사용 0건

- **Given** 동일 범위 파일이 작성되었다
- **When** `#[0-9a-fA-F]{3,6}` 및 `rgba?\(` 패턴으로 grep을 실행한다
- **Then** 매칭 건수가 0이다

### Requirement: z-index 계층

Sidebar z-index 40, Header z-index 50. 두 고정 요소는 물리적으로 겹치지 않는다(좌우 인접).

#### Scenario: Sidebar/Header z-index 갱신

- **Given** Shell이 1280×800 viewport에서 렌더된다
- **When** Sidebar와 Header의 CSS z-index 값을 확인한다
- **Then** `<aside>` z-index가 40이다
- **And** `<header>` z-index가 50이다
- **And** 두 요소의 bounding rect가 겹치지 않는다(좌우 인접)

### Requirement: 접근성 랜드마크

`<aside>`, `<header>`, `<main>`, `<footer role="contentinfo">` 랜드마크를 각 1개씩 구성. `<nav aria-label="사이드바 주 메뉴">`로 사이드바 nav를 랜드마크화.

#### Scenario: 랜드마크 4개 각 1개 존재

- **Given** `(app)/layout.tsx`가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `role="complementary"` (aside) 1개, `role="banner"` (header) 1개, `role="main"` 1개, `role="contentinfo"` (footer) 1개가 존재한다
- **And** `aria-label="사이드바 주 메뉴"` nav가 aside 내부에 있다

#### Scenario: children이 main 내부에 렌더

- **Given** `(app)/layout.tsx`가 children을 prop으로 받는다
- **When** 렌더된다
- **Then** children 콘텐츠가 `role="main"` 요소 내부에 위치한다

### Requirement: Sidebar 배경 및 워드마크

Sidebar 배경 `var(--sidebar)` = `#1e293b`(slate-800). 워드마크는 `<Link href="/dashboard" aria-label="ADMIN CONSOLE 홈">`(Tab 첫 포커스 진입점). 내부 `<h2 aria-hidden="true">ADMIN CONSOLE</h2>`(20px / 700 / tracking-tight / white) + `<p aria-hidden="true">Admin Console System</p>`(12px / 500 / uppercase / tracking-widest / `var(--sidebar-subtle)`). "The Lens", "The Executive Lens" 문자열을 포함하지 않는다.

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

### Requirement: Sidebar 사용자 프로필 블록

사이드바 하단에 3줄 텍스트 + 40px 회색 원 아바타 placeholder. 이미지 없음. 로그인 슬라이스 병합 시 세션 프로필로 교체.

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

### Requirement: CSS 변수 선언

`globals.css` `:root`에 Shell 치수·색상 토큰 전체 선언. `.dark` 블록에 다크모드 값 선언.

#### Scenario: 라이트모드 변수 선언 확인

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `:root` 블록을 파싱한다
- **Then** `--sidebar-width: 16rem` 선언이 존재한다
- **And** `--header-height: 4rem` 선언이 존재한다
- **And** `--header-glass-bg: rgb(248 250 252 / 0.8)` 선언이 존재한다
- **And** `--sidebar: #1e293b` 선언이 존재한다

#### Scenario: 신규 토큰 4종 선언 존재

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `:root` 블록을 파싱한다
- **Then** `--sidebar-hover-bg`, `--sidebar-avatar-bg`, `--header-button-hover-bg`, `--footer-muted-foreground` 4종이 모두 존재한다

#### Scenario: 다크모드 변수 선언 확인

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `.dark` 블록을 파싱한다
- **Then** `--header-glass-bg` 다크 값 선언이 존재한다

### Requirement: Main Footer (contentinfo)

`(app)/layout.tsx` Shell flex-col 마지막 요소로 `<footer role="contentinfo">` 신설. `<main>` 바깥, `ml-64` 부모 div 내부에 위치.

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
