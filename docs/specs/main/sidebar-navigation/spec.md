### Requirement: 메뉴 prefix 매칭 활성 판정

`is-menu-active(pathname, href)` 순수 함수. pathname이 href로 시작하되 다음 문자가 `/` 또는 문자열 끝인 경우에만 true. false positive(예: `/adminsettings` → `/admins` 매칭, `/dashboarding` → `/dashboard` 매칭) 방지.

#### Scenario: 정확한 경로 일치

- **Given** pathname이 `"/dashboard"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

#### Scenario: 하위 경로 일치

- **Given** pathname이 `"/dashboard/anything"`이고 href가 `"/dashboard"`이다
- **When** `isMenuActive` 함수를 호출한다
- **Then** 결과가 true이다

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

### Requirement: SidebarNav 활성 메뉴 표시

`usePathname()`으로 현재 경로를 읽어 활성 메뉴에 `var(--sidebar-accent)` 배경과 `aria-current="page"`를 부여. `"use client"` 컴포넌트. 비활성 메뉴에는 `aria-current` 없음. 활성 항목에 `translate-x-1` transform 적용, 우측 4px bar `<span>` 없음.

#### Scenario: /dashboard 경로에서 Dashboard 활성

- **Given** 현재 pathname이 `"/dashboard"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** Dashboard 항목에 `aria-current="page"` 속성이 있다
- **And** 관리자 관리 항목에는 `aria-current` 속성이 없다

#### Scenario: /admins 경로에서 관리자 관리 활성

- **Given** 현재 pathname이 `"/admins"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** 관리자 관리 항목에 `aria-current="page"` 속성이 있다
- **And** 대시보드 항목에는 `aria-current` 속성이 없다

#### Scenario: /admins/abc 경로에서 관리자 관리 활성 (런타임 prefix 매칭)

- **Given** 사용자가 브라우저에서 `/admins/abc`로 접근한다
- **When** 페이지가 렌더된다
- **Then** 사이드바 관리자 관리 항목에 `aria-current="page"`가 있다
- **And** 대시보드 항목에는 `aria-current`가 없다

#### Scenario: 활성 메뉴 bar 제거 및 translate-x-1 추가

- **Given** 현재 pathname이 `"/dashboard"`이다
- **When** `SidebarNav`가 렌더된다
- **Then** 대시보드 항목에 `aria-current="page"` 속성이 있다
- **And** 대시보드 항목의 자식 요소에 `width: 4px`인 `<span>`이 존재하지 않는다
- **And** 대시보드 항목 className에 `translate-x-1`이 포함된다 (또는 computed transform이 none이 아니다)

#### Scenario: 메뉴 항목 키보드 포커스

- **Given** `SidebarNav`가 렌더되었다
- **When** 메뉴 항목들의 역할을 확인한다
- **Then** 각 항목이 `role="link"`로 노출된다
- **And** 각 항목이 키보드 포커스(Tab) 가능하다

### Requirement: Sidebar 구조 및 워드마크

사이드바는 `<aside>` 랜드마크, 내부에 `<nav aria-label="사이드바 주 메뉴">`. 워드마크는 `<Link href="/dashboard" aria-label="ADMIN CONSOLE 홈">`(Tab 첫 포커스 진입점). 내부 `<h2 aria-hidden="true">ADMIN CONSOLE</h2>` + `<p aria-hidden="true">Admin Console System</p>` 2단 구성. "The Lens" 문자열을 포함하지 않는다.

#### Scenario: nav 랜드마크 존재

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** DOM을 탐색한다
- **Then** `aria-label="사이드바 주 메뉴"` 속성을 가진 nav 요소가 존재한다

#### Scenario: 워드마크 aria-label 및 자식 aria-hidden

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** 워드마크 링크를 탐색한다
- **Then** `aria-label="ADMIN CONSOLE 홈"` 속성을 가진 링크가 존재한다
- **And** 내부 `<h2>`와 `<p>` 요소가 각각 `aria-hidden="true"` 속성을 가진다
- **And** 해당 링크의 href가 `"/dashboard"`이다

#### Scenario: 워드마크 Tab 순서 첫 번째

- **Given** 브라우저에서 `/dashboard` 페이지가 로드되었다
- **When** 사용자가 Tab을 1회 누른다
- **Then** 워드마크 링크가 포커스를 받는다

#### Scenario: 사이드바 메뉴 구성

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
- **And** `href="/users"`, `href="/analytics"`, `href="/settings"`, `href="/reports"` 링크가 존재하지 않는다

### Requirement: 사용자 프로필 블록 (sidebar 협력)

`SidebarUserFooter`가 `<aside>` 내부 최하단(`mt-auto`)에 위치. 상세 사양은 shell-layout capability의 "Sidebar 사용자 프로필 블록" Requirement를 따른다. 로그인 슬라이스 병합 시 세션 프로필로 교체.

#### Scenario: SidebarUserFooter 위치

- **Given** `Sidebar` 컴포넌트가 렌더되었다
- **When** aside 내부 구조를 탐색한다
- **Then** `SidebarUserFooter`가 `mt-auto` 클래스를 가진 요소 내부에 위치한다

### Requirement: 메뉴 항목 시각 사양

메뉴 항목 터치 타겟 높이 ≥ 44px. 아이콘(lucide-react, 22px) + 라벨 구성. 활성 항목은 `var(--sidebar-accent)` 배경 + `var(--sidebar-accent-foreground)` 텍스트 + `translate-x-1` transform + `rounded-xl`(12px) + `font-semibold`. 비활성 텍스트는 `var(--sidebar-muted-foreground)`. hover 배경 `var(--sidebar-hover-bg)`. transition `all 200ms`. 우측 4px bar `<span>`을 사용하지 않는다.

#### Scenario: 메뉴 항목 시각 사양

- **Given** `SidebarNav` 컴포넌트가 렌더되었다
- **When** 메뉴 항목 요소를 탐색한다
- **Then** 각 항목의 className에 `rounded-xl`이 포함된다
- **And** 아이콘 요소의 크기가 22px에 해당하는 클래스(예: `w-[22px]` 또는 `size-[22px]`)가 적용된다
- **And** 각 항목의 터치 타겟 높이가 44px 이상이다

#### Scenario: 메뉴 이동 시 Shell 유지

- **Given** 사용자가 `/dashboard`에 있다
- **When** 사이드바 "관리자 관리" 링크를 클릭한다
- **Then** URL이 `/admins`로 변경된다
- **And** 사이드바와 헤더는 DOM에서 유지된다 (re-mount 없음)
- **And** 메인 영역 콘텐츠만 교체된다

#### Scenario: border 클래스는 사용하지 않음

- **Given** `components/layout/**` 및 `app/(app)/**` 범위 파일이 작성되었다
- **When** `border(-t|-b|-l|-r)?|divide-` 패턴으로 grep을 실행한다
- **Then** 매칭 건수가 0이다 (시각적 강조는 CSS border가 아닌 translate-x-1 transform으로 구현)

### Requirement: 사이드바 메뉴 동적 로딩

기존 정적 `menu-config.ts` 배열 대신 `/auth/me` 응답의 menus 트리를 사이드바에 렌더링한다.

#### Scenario: 로그인 후 동적 메뉴 로딩
- **Given** 관리자가 로그인하여 `(app)` 레이아웃이 마운트된다
- **When** 서버 컴포넌트에서 `/auth/me`를 prefetch하고 `HydrationBoundary`로 전달한다
- **Then** 클라이언트의 `SidebarNav`가 me 응답의 menus 트리를 렌더링한다
- **And** isActive=true이고 자신의 역할에 canRead=true 이상인 메뉴만 표시된다
- **And** 정적 menu-config.ts의 하드코딩된 메뉴는 더 이상 사용되지 않는다

#### Scenario: 메뉴 계층 구조 렌더링
- **Given** menus 트리에 부모-자식 구조가 있다
- **When** 사이드바가 렌더링된다
- **Then** 부모 메뉴는 접을 수 있는 섹션으로 표시된다
- **And** 자식 메뉴는 들여쓰기된 항목으로 표시된다

---

### Requirement: 사이드바 로딩 상태 처리

메뉴 데이터를 로딩 중일 때 사이드바에 로딩 상태를 표시한다.

#### Scenario: 메뉴 로딩 중 스켈레톤 표시
- **Given** `(app)` 레이아웃에서 me 데이터를 불러오는 중이다
- **When** `SidebarNav`가 렌더링된다
- **Then** 메뉴 영역에 스켈레톤 로딩 UI가 표시된다
- **And** 다른 레이아웃(헤더, 메인 영역)은 정상 표시된다

---

### Requirement: 사이드바 에러 상태 처리

메뉴 로딩 실패 시 사이드바에 에러 상태와 재시도 버튼을 표시한다.

#### Scenario: /auth/me 실패 시 에러 + 재시도
- **Given** `/auth/me` 요청이 네트워크 오류 또는 서버 오류로 실패한다
- **When** `SidebarNav`가 에러 상태를 감지한다
- **Then** "메뉴를 불러오지 못했습니다" 메시지와 "재시도" 버튼이 표시된다
- **And** "재시도" 버튼 클릭 시 me 쿼리가 refetch된다

---

### Requirement: 사이드바 빈 상태 처리

역할이 없거나 허용된 메뉴가 없는 관리자에게 적절한 안내를 표시한다.

#### Scenario: 역할 미할당 관리자 로그인
- **Given** 역할이 하나도 할당되지 않은 관리자가 로그인한다
- **When** 사이드바가 렌더링된다
- **Then** "역할이 할당되지 않았습니다. 관리자에게 문의해 주세요" 안내가 표시된다
- **And** 사이드바에 메뉴 항목이 없다

---

### Requirement: 권한 없는 경로 접근 시 403 처리

허용되지 않은 경로에 직접 접근할 경우 403 안내 페이지로 이동한다.

#### Scenario: 권한 없는 경로 직접 접근
- **Given** 관리자가 자신의 역할에 허용되지 않은 경로(`/admin/menus`)에 URL을 직접 입력하여 접근한다
- **When** 서버 컴포넌트에서 세션의 roles를 기반으로 권한을 검증한다
- **Then** `/admin/errors/403` 페이지로 서버사이드 redirect된다
- **And** 403 페이지에 "접근 권한이 없습니다" 메시지와 "홈으로 이동" 버튼이 표시된다

#### Scenario: 사이드바에서 권한 없는 메뉴 미표시
- **Given** 관리자가 특정 메뉴에 대한 권한이 없다
- **When** 사이드바가 렌더링된다
- **Then** 해당 메뉴가 사이드바 목록에 표시되지 않는다
- **And** 관리자는 해당 메뉴의 존재 자체를 알 수 없다
