## ADDED Requirements

### Requirement: Shell 3영역 구조

데스크톱 전용(1024px+) 운영 콘솔의 공통 UI 프레임. 고정 사이드바(256px) + 고정 글래스 헤더(64px) + 메인 콘텐츠 영역으로 구성. 모든 치수·색상은 CSS 변수(`var(--*)`)로만 참조. No-Line 원칙(border·divide 클래스 금지) 엄격 적용.

#### Scenario: `/dashboard` 진입 시 Shell 3영역 모두 렌더

- **Given** 사용자가 `/dashboard` URL로 접근한다
- **When** 페이지가 렌더된다
- **Then** `role="complementary"` (aside) 사이드바가 visible이다
- **And** `role="banner"` (header) 헤더가 visible이다
- **And** `role="main"` 메인 영역이 visible이다

#### Scenario: `/users` 진입 시 Shell 3영역 모두 렌더

- **Given** 사용자가 `/users` URL로 접근한다
- **When** 페이지가 렌더된다
- **Then** 사이드바·헤더·메인 3영역이 모두 visible이다
- **And** 메인 영역 내용만 교체되고 사이드바·헤더는 유지된다

#### Scenario: 사이드바 폭 및 헤더 높이 CSS 변수 기반

- **Given** `globals.css`에 `--sidebar-width: 16rem`, `--header-height: 4rem`이 선언되어 있다
- **When** 브라우저가 스타일을 계산한다
- **Then** 사이드바의 `width` 계산값이 256px이다
- **And** 헤더의 `height` 계산값이 64px이다
- **And** 메인 영역의 `margin-left`가 사이드바 폭과 동일하다
- **And** 메인 영역의 `margin-top`이 헤더 높이와 동일하다

### Requirement: 글래스 헤더 시각 효과

헤더 배경은 `var(--header-glass-bg)` 참조, `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter: blur(12px)` 병기.

#### Scenario: 헤더 backdrop-filter 적용

- **Given** `globals.css`에 `--header-glass-bg: rgb(255 255 255 / 0.8)`이 선언되어 있다
- **When** 브라우저(Chrome/Safari)가 헤더 스타일을 렌더한다
- **Then** `getComputedStyle(header).backdropFilter` 또는 `.webkitBackdropFilter`에 `"blur(12px)"`가 포함된다
- **And** 클래스명 문자열로 검증하지 않는다

#### Scenario: 헤더에 브랜드 텍스트 없음

- **Given** 헤더(`role="banner"`)가 렌더되었다
- **When** 헤더 DOM 내부 텍스트를 탐색한다
- **Then** "Admin Console" 텍스트가 존재하지 않는다

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

Sidebar z-index 30, Header z-index 40. 두 고정 요소는 물리적으로 겹치지 않는다(좌우 인접).

#### Scenario: Sidebar/Header 물리적 비중첩

- **Given** Sidebar가 `left: 0; width: var(--sidebar-width)`로, Header가 `left: var(--sidebar-width); right: 0`으로 배치되었다
- **When** 1280×800 viewport에서 렌더된다
- **Then** Sidebar와 Header의 bounding rect가 겹치지 않는다
- **And** 가로 스크롤이 발생하지 않는다

### Requirement: 접근성 랜드마크

`<aside>`, `<header>`, `<main>` 랜드마크를 각 1개씩 구성. `<nav aria-label="사이드바 주 메뉴">`로 사이드바 nav를 랜드마크화.

#### Scenario: 랜드마크 각 1개 존재

- **Given** `(app)/layout.tsx`가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `role="complementary"` (aside) 1개, `role="banner"` (header) 1개, `role="main"` 1개가 존재한다
- **And** `aria-label="사이드바 주 메뉴"` nav가 aside 내부에 있다

#### Scenario: children이 main 내부에 렌더

- **Given** `(app)/layout.tsx`가 children을 prop으로 받는다
- **When** 렌더된다
- **Then** children 콘텐츠가 `role="main"` 요소 내부에 위치한다

### Requirement: CSS 변수 선언

`globals.css` `:root`에 `--sidebar-width`, `--header-height`, `--header-glass-bg` 선언. `.dark` 블록에 `--header-glass-bg` 다크 값 선언.

#### Scenario: 라이트모드 변수 선언 확인

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `:root` 블록을 파싱한다
- **Then** `--sidebar-width: 16rem` 선언이 존재한다
- **And** `--header-height: 4rem` 선언이 존재한다
- **And** `--header-glass-bg: rgb(255 255 255 / 0.8)` 선언이 존재한다

#### Scenario: 다크모드 변수 선언 확인

- **Given** `apps/admin/src/app/globals.css`를 읽는다
- **When** `.dark` 블록을 파싱한다
- **Then** `--header-glass-bg: rgb(19 27 46 / 0.7)` 선언이 존재한다
