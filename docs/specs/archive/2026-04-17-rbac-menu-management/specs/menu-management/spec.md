## Meta
- type: fullstack
- package: monorepo
- status: ADDED

## Capabilities
- menu-management

## ADDED Requirements

### Requirement: 메뉴 트리 조회

super_admin은 `/admin/menus` 화면에서 전체 메뉴(활성·비활성 모두)를 계층 트리로 확인할 수 있다.

#### Scenario: 메뉴 트리 정상 조회
- **Given** super_admin이 `/admin/menus`에 접근한다
- **When** 페이지가 로드된다
- **Then** `GET /menus` 응답으로 parentId 기반 계층 트리가 렌더링된다
- **And** 각 메뉴 행에 이름, 경로, 아이콘, 활성 여부, 순서 조작 버튼이 표시된다

#### Scenario: 빈 메뉴 목록
- **Given** DB에 메뉴가 없다
- **When** 페이지가 로드된다
- **Then** "등록된 메뉴가 없습니다" 안내 메시지가 표시된다

---

### Requirement: 메뉴 생성

super_admin은 이름·경로·아이콘·상위 메뉴를 지정하여 새 메뉴를 생성할 수 있다.

#### Scenario: 메뉴 정상 생성
- **Given** super_admin이 "메뉴 추가" 버튼을 클릭한다
- **When** 폼에 이름(필수), 경로(선택), 아이콘(선택), 상위 메뉴(선택)를 입력하고 저장한다
- **Then** `POST /menus`가 호출되고 트리 목록이 갱신된다
- **And** 새 메뉴가 트리에 나타난다

#### Scenario: 이름 누락 시 유효성 검사
- **Given** 메뉴 생성 폼이 열려 있다
- **When** 이름 없이 저장 버튼을 클릭한다
- **Then** "이름은 필수입니다" 인라인 에러가 표시되고 API 호출이 일어나지 않는다

---

### Requirement: 메뉴 수정

super_admin은 기존 메뉴의 이름·경로·아이콘·상위 메뉴를 수정할 수 있다.

#### Scenario: 메뉴 정상 수정
- **Given** 트리에서 특정 메뉴의 "수정" 버튼을 클릭한다
- **When** 폼에서 이름을 변경하고 저장한다
- **Then** `PATCH /menus/:id`가 호출되고 트리에 변경사항이 반영된다

---

### Requirement: 메뉴 삭제 및 하위 메뉴 보호

super_admin은 메뉴를 삭제할 수 있으나, 하위 메뉴가 있는 경우 삭제가 차단된다.

#### Scenario: 하위 메뉴 없는 메뉴 삭제
- **Given** 하위 메뉴가 없는 메뉴의 "삭제" 버튼을 클릭한다
- **When** 확인 다이얼로그에서 삭제를 승인한다
- **Then** `DELETE /menus/:id`가 호출되고 해당 메뉴가 트리에서 제거된다

#### Scenario: 하위 메뉴가 있는 메뉴 삭제 시도
- **Given** 하위 메뉴가 존재하는 메뉴의 "삭제" 버튼을 클릭한다
- **When** 확인 다이얼로그에서 삭제를 승인한다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "하위 메뉴가 존재하여 삭제할 수 없습니다" 안내 메시지가 표시된다
- **And** 메뉴는 트리에 유지된다

---

### Requirement: 메뉴 순서 변경

super_admin은 같은 레벨 내에서 위/아래 버튼으로 메뉴 순서를 조정할 수 있다.

#### Scenario: 메뉴 위로 이동
- **Given** 2번째 메뉴의 "위로" 버튼을 클릭한다
- **When** 요청이 처리된다
- **Then** `PATCH /menus/:id/order`가 `{ direction: "up" }`으로 호출된다
- **And** 해당 메뉴와 바로 위 메뉴의 order가 교환되어 트리에 반영된다

#### Scenario: 최상단 메뉴 위로 이동 시 버튼 비활성화
- **Given** 같은 레벨에서 order가 가장 낮은 메뉴가 있다
- **When** 해당 메뉴를 렌더링한다
- **Then** "위로" 버튼이 비활성화(disabled) 상태로 표시된다

---

### Requirement: 메뉴 활성/비활성 토글

super_admin은 메뉴를 비활성화하여 모든 사용자의 사이드바에서 숨길 수 있다.

#### Scenario: 메뉴 비활성화
- **Given** 활성 상태인 메뉴의 토글을 클릭한다
- **When** 요청이 처리된다
- **Then** `PATCH /menus/:id`가 `{ isActive: false }`로 호출된다
- **And** 해당 메뉴가 비활성 상태로 표시된다
- **And** 사이드바에서 해당 메뉴가 사라진다

#### Scenario: 비활성 메뉴 재활성화
- **Given** 비활성 상태인 메뉴의 토글을 클릭한다
- **When** 요청이 처리된다
- **Then** `PATCH /menus/:id`가 `{ isActive: true }`로 호출된다
- **And** 해당 메뉴가 활성 상태로 변경되어 권한 있는 사용자 사이드바에 표시된다

---

### Requirement: 메뉴 관리 접근 제어

메뉴 관리 화면과 API는 SUPER_ADMIN 역할만 접근 가능하다.

#### Scenario: SUPER_ADMIN 정상 접근
- **Given** SUPER_ADMIN 역할을 가진 관리자가 `/admin/menus`에 접근한다
- **When** 페이지가 로드된다
- **Then** 메뉴 트리와 CRUD 버튼이 표시된다

#### Scenario: 일반 ADMIN 접근 차단
- **Given** SUPER_ADMIN 역할이 없는 관리자가 `/admin/menus`에 직접 접근한다
- **When** 서버 컴포넌트에서 권한이 검증된다
- **Then** `/admin/errors/403` 페이지로 redirect된다

#### Scenario: API 직접 호출 차단
- **Given** SUPER_ADMIN 역할이 없는 사용자가 `POST /menus`를 직접 호출한다
- **When** RbacGuard가 역할을 검증한다
- **Then** `403 Forbidden`이 반환된다
