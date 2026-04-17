## Meta
- type: fullstack
- package: monorepo
- status: ADDED

## Capabilities
- admin-users-rbac

## ADDED Requirements

### Requirement: 관리자 역할 조회

super_admin은 관리자 상세 화면에서 해당 관리자에게 할당된 역할 목록을 확인할 수 있다.

#### Scenario: 역할 목록 정상 조회
- **Given** super_admin이 관리자 상세 페이지(`/admin/users/:id`)를 방문한다
- **When** 페이지가 로드된다
- **Then** `GET /admin-users/:id/roles`가 호출되고 역할 목록이 표시된다
- **And** 각 역할 행에 역할 이름과 "제거" 버튼이 표시된다

#### Scenario: 역할이 없는 관리자
- **Given** 역할이 한 개도 할당되지 않은 관리자 상세를 조회한다
- **When** 역할 섹션이 렌더링된다
- **Then** "할당된 역할이 없습니다" 안내가 표시된다

---

### Requirement: 관리자 역할 할당 (active 상태만)

super_admin은 active 상태인 관리자에게 역할을 할당할 수 있다.

#### Scenario: active 관리자에게 역할 정상 할당
- **Given** 상태가 ACTIVE인 관리자의 상세 페이지에서 "역할 추가" 버튼을 클릭한다
- **When** 역할 선택 다이얼로그에서 역할을 선택하고 확인한다
- **Then** `POST /admin-users/:id/roles`가 호출되고 역할 목록에 추가된다
- **And** 해당 관리자의 다음 로그인 시 해당 역할 권한이 적용된다

#### Scenario: 비활성 관리자에게 역할 할당 차단
- **Given** 상태가 PENDING 또는 SUSPENDED인 관리자의 상세 페이지에서 역할 추가를 시도한다
- **When** 역할 할당 요청이 전송된다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "활성 상태인 관리자에게만 역할을 할당할 수 있습니다" 메시지가 표시된다
- **And** UI에서는 ACTIVE 상태가 아닌 경우 "역할 추가" 버튼이 비활성화된다

#### Scenario: 이미 할당된 역할 중복 할당 방지
- **Given** 이미 할당된 역할을 다시 할당하려 한다
- **When** `POST /admin-users/:id/roles`가 호출된다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "이미 할당된 역할입니다" 메시지가 표시된다

---

### Requirement: 관리자 역할 제거

super_admin은 관리자에게서 역할을 제거할 수 있다. 단, 마지막 SUPER_ADMIN 사용자의 SUPER_ADMIN 역할 제거는 차단된다.

#### Scenario: 역할 정상 제거
- **Given** 관리자가 여러 역할을 보유하고 있고 일반 역할을 제거한다
- **When** "제거" 버튼 클릭 후 확인한다
- **Then** `DELETE /admin-users/:id/roles/:roleId`가 호출되고 목록에서 해당 역할이 제거된다

#### Scenario: 마지막 SUPER_ADMIN 역할 제거 차단
- **Given** SUPER_ADMIN 역할을 가진 관리자가 시스템 내 1명뿐이다
- **When** 해당 관리자의 SUPER_ADMIN 역할 제거를 시도한다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "마지막 SUPER_ADMIN 관리자의 역할은 제거할 수 없습니다" 메시지가 표시된다

---

### Requirement: User.role enum → UserRole 관계 마이그레이션

기존 User.role 문자열 필드가 제거되고 UserRole 관계 테이블로 대체된다. 기존 데이터는 마이그레이션을 통해 유지된다.

#### Scenario: 기존 super_admin 사용자 마이그레이션
- **Given** 마이그레이션 실행 전 User.role = 'super_admin'인 사용자가 존재한다
- **When** Prisma 마이그레이션이 실행된다
- **Then** 해당 사용자에게 SUPER_ADMIN 역할이 UserRole로 연결된다
- **And** 사용자의 로그인 후 사이드바에 SUPER_ADMIN 권한 메뉴가 표시된다

#### Scenario: 기존 admin 사용자 마이그레이션
- **Given** 마이그레이션 실행 전 User.role = 'admin'인 사용자가 존재한다
- **When** Prisma 마이그레이션이 실행된다
- **Then** 해당 사용자에게 ADMIN 역할이 UserRole로 연결된다

#### Scenario: 마이그레이션 후 로그인 정상 동작
- **Given** 마이그레이션이 완료된 후 기존 사용자가 로그인한다
- **When** `/auth/me`가 호출된다
- **Then** roles 배열과 menus 트리가 정상적으로 반환된다
- **And** 기존 접근 가능하던 화면에 여전히 접근 가능하다

---

### Requirement: 다중 역할 권한 합집합 적용

관리자가 여러 역할을 보유한 경우 각 메뉴의 권한은 합집합(OR)으로 계산된다.

#### Scenario: 다중 역할 권한 합집합
- **Given** 관리자 A가 역할 R1(메뉴 M: canRead=true, canWrite=false)과 역할 R2(메뉴 M: canRead=true, canWrite=true)를 보유한다
- **When** `/auth/me`가 호출된다
- **Then** 메뉴 M에 대해 canRead=true, canWrite=true가 반환된다
- **And** 두 역할 중 하나라도 canDelete=true이면 canDelete=true로 반환된다
