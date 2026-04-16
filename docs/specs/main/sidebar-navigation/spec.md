### Requirement: 메뉴 prefix 매칭 활성 판정

`is-menu-active(pathname, href)` 순수 함수. pathname이 href로 시작하되 다음 문자가 `/` 또는 문자열 끝인 경우에만 true. false positive(예: `/usersettings` → `/users` 매칭) 방지.

#### Scenario: 정확한 경로 일치

- **Given** pathname이 `"/dashboard"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: 하위 경로 일치

- **Given** pathname이 `"/dashboard/anything"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: Users 경로 하위 깊이 일치

- **Given** pathname이 `"/users/123/edit"`이고 href가 `"/users"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: false positive — /usersettings는 /users와 매칭하지 않음

- **Given** pathname이 `"/usersettings"`이고 href가 `"/users"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 false이다

#### Scenario: false positive — /dashboarding은 /dashboard와 매칭하지 않음

- **Given** pathname이 `"/dashboarding"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 false이다

### Requirement: SidebarNav 활성 메뉴 표시

`usePathname()`으로 현재 경로를 읽어 활성 메뉴에 `var(--sidebar-accent)` 배경과 `aria-current="page"`를 부여. `"use client"` 컴포넌트. 비활성 메뉴에는 `aria-current` 없음.

#### Scenario: /dashboard 경로에서 Dashboard 활성

- **Given** 현재 pathname이 `"/dashboard"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** Dashboard 항목에 `aria-current="page"` 속성이 있다
- **And** Users 항목에는 `aria-current` 속성이 없다

#### Scenario: /users 경로에서 Users 활성

- **Given** 현재 pathname이 `"/users"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** Users 항목에 `aria-current="page"` 속성이 있다
- **And** Dashboard 항목에는 `aria-current` 속성이 없다

#### Scenario: /users/abc 경로에서 Users 활성 (런타임 prefix 매칭)

- **Given** 사용자가 브라우저에서 `/users/abc`로 접근한다
- **When** 페이지가 렌더된다
- **Then** 사이드바 Users 항목에 `aria-current="page"`가 있다
- **And** Dashboard 항목에는 `aria-current`가 없다

#### Scenario: 메뉴 항목 키보드 포커스

- **Given** `SidebarNav`가 렌더되었다
- **When** 메뉴 항목들의 역할을 확인한다
- **Then** 각 항목이 `role="link"`로 노출된다
- **And** 각 항목이 키보드 포커스(Tab) 가능하다

### Requirement: Sidebar 구조 및 워드마크

사이드바는 `<aside>` 랜드마크, 내부에 `<nav aria-label="사이드바 주 메뉴">`. 워드마크는 Stitch "Admin Console Layout" 원본 매치: "The Lens"(uppercase, tracking-widest, Manrope bold) + sub "Admin Console" 2단 구성. 전체는 단일 `<Link href="/dashboard">`로 Tab 첫 포커스 진입점.

#### Scenario: nav 랜드마크 존재

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `aria-label="사이드바 주 메뉴"` 속성을 가진 nav 요소가 존재한다

#### Scenario: 워드마크 2단 텍스트 및 링크 렌더

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** 워드마크 영역을 탐색한다
- **Then** "The Lens" 텍스트와 "Admin Console" 텍스트가 모두 존재한다
- **And** 두 텍스트는 동일한 `role="link"` 요소 내부에 위치한다
- **And** 해당 링크의 href가 `"/dashboard"`이다

#### Scenario: 워드마크 Tab 순서 첫 번째

- **Given** 브라우저에서 `/dashboard` 페이지가 로드되었다
- **When** 사용자가 Tab을 1회 누른다
- **Then** 워드마크 링크가 포커스를 받는다

#### Scenario: 사이드바 메뉴 구성

- **Given** `SidebarNav`가 렌더되었다
- **When** 메뉴 항목을 순서대로 탐색한다
- **Then** 항목이 [Dashboard, Users, Analytics, Settings, Reports] 5개이고 순서가 일치한다

### Requirement: 사용자 푸터

사이드바 하단에 아바타(이니셜 "A") + "Admin User" + "Administrator"를 분리 렌더. placeholder 고정값. 로그인 슬라이스 병합 시 세션 프로필로 교체.

#### Scenario: 사용자 푸터 정보 렌더

- **Given** `SidebarUserFooter` 컴포넌트가 렌더되었다
- **When** 푸터 영역을 탐색한다
- **Then** "Admin User" 텍스트가 존재한다
- **And** "Administrator" 텍스트가 존재한다
- **And** 이름과 역할이 별도 DOM 요소에 분리 렌더된다

#### Scenario: 아바타 이니셜 렌더

- **Given** `SidebarUserFooter` 컴포넌트가 렌더되었다
- **When** 아바타 영역을 탐색한다
- **Then** 이니셜 "A" 텍스트가 원형 아바타 영역 내에 존재한다

### Requirement: 메뉴 항목 시각 사양

메뉴 항목 터치 타겟 높이 ≥ 44px. 아이콘(lucide-react, 20px) + 라벨 구성. 활성 항목은 Stitch "Admin Console Layout" 원본 매치: `var(--sidebar-accent)` 배경 + `var(--sidebar-accent-foreground)` 텍스트 + **우측 4px `var(--sidebar-primary)` 액센트 바**. 바는 CSS border가 아닌 자식 엘리먼트의 inline 스타일로 구현하여 "border 클래스 0건" 원칙을 유지한다.

#### Scenario: 활성 메뉴 우측 액센트 바 렌더

- **Given** `/dashboard`에서 Dashboard 항목이 활성 상태이다
- **When** 활성 메뉴 항목 DOM을 탐색한다
- **Then** `aria-hidden="true"`의 자식 span이 존재한다
- **And** 해당 span의 inline style에 `width: 4px`, `right: 0`, `background-color: var(--sidebar-primary)`가 포함된다

#### Scenario: border 클래스는 여전히 사용하지 않음

- **Given** `components/layout/**` 및 `app/(app)/**` 범위 파일이 작성되었다
- **When** `border(-t|-b|-l|-r)?|divide-` 패턴으로 grep을 실행한다
- **Then** 매칭 건수가 0이다 (시각적 bar는 CSS border가 아닌 절대배치된 자식 엘리먼트로 구현)

#### Scenario: 메뉴 이동 시 Shell 유지

- **Given** 사용자가 `/dashboard`에 있다
- **When** 사이드바 "Users" 링크를 클릭한다
- **Then** URL이 `/users`로 변경된다
- **And** 사이드바와 헤더는 DOM에서 유지된다 (re-mount 없음)
- **And** 메인 영역 콘텐츠만 교체된다
