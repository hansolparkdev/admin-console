## Meta
- type: frontend
- package: apps/admin
- status: MODIFIED

## Capabilities
- sidebar-navigation

## MODIFIED Requirements

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
