### Requirement: 역할 목록 조회

super_admin은 `/admin/roles` 화면에서 등록된 역할 목록을 확인할 수 있다.

#### Scenario: 역할 목록 정상 조회
- **Given** super_admin이 `/admin/roles`에 접근한다
- **When** 페이지가 로드된다
- **Then** `GET /roles` 응답으로 역할 목록이 테이블로 표시된다
- **And** 각 행에 역할 이름, 설명, 할당된 관리자 수, CRUD 버튼이 표시된다

#### Scenario: SUPER_ADMIN 역할 삭제 버튼 비활성화
- **Given** 역할 목록에 SUPER_ADMIN(isSystem=true) 역할이 있다
- **When** 목록이 렌더링된다
- **Then** SUPER_ADMIN 행의 삭제 버튼이 비활성화되거나 숨겨진다

---

### Requirement: 역할 생성

super_admin은 이름과 설명으로 새 역할을 생성할 수 있다.

#### Scenario: 역할 정상 생성
- **Given** super_admin이 "역할 추가" 버튼을 클릭한다
- **When** 이름(필수), 설명(선택)을 입력하고 저장한다
- **Then** `POST /roles`가 호출되고 역할 목록이 갱신된다
- **And** 새 역할이 목록에 나타난다

#### Scenario: 중복 이름 역할 생성 시도
- **Given** 이미 존재하는 역할 이름으로 생성을 시도한다
- **When** 저장 버튼을 클릭한다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "이미 존재하는 역할 이름입니다" 에러 메시지가 표시된다

---

### Requirement: 역할 수정

super_admin은 역할의 이름과 설명을 수정할 수 있다. SUPER_ADMIN 역할도 수정 가능하다.

#### Scenario: 역할 정상 수정
- **Given** 역할 목록에서 "수정" 버튼을 클릭한다
- **When** 이름 또는 설명을 변경하고 저장한다
- **Then** `PATCH /roles/:id`가 호출되고 목록에 변경사항이 반영된다

---

### Requirement: 역할 삭제 보호

역할 삭제는 두 가지 조건에서 차단된다: isSystem=true 또는 할당된 관리자 존재.

#### Scenario: SUPER_ADMIN 역할 삭제 차단
- **Given** SUPER_ADMIN(isSystem=true) 역할에 대해 `DELETE /roles/:id`가 호출된다
- **When** RolesService.remove()가 실행된다
- **Then** `409 Conflict`가 반환된다
- **And** "시스템 역할은 삭제할 수 없습니다" 메시지가 응답에 포함된다

#### Scenario: 할당된 관리자가 있는 역할 삭제 차단
- **Given** 1명 이상의 관리자가 할당된 역할의 삭제 버튼을 클릭한다
- **When** 확인 다이얼로그에서 삭제를 승인한다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "해당 역할이 할당된 관리자가 있습니다. 먼저 역할 할당을 해제해 주세요" 메시지가 표시된다

#### Scenario: 할당된 관리자 없는 일반 역할 정상 삭제
- **Given** 할당된 관리자가 없는 일반 역할의 삭제를 확인한다
- **When** `DELETE /roles/:id`가 호출된다
- **Then** 역할이 삭제되고 목록에서 제거된다

---

### Requirement: 역할 상세 — 관리자 추가/제거

역할 상세 화면에서 super_admin은 해당 역할에 관리자를 추가하거나 제거할 수 있다.

#### Scenario: 역할에 관리자 추가
- **Given** 역할 상세 화면에서 "관리자 추가" 버튼을 클릭한다
- **When** 관리자 검색 후 선택하여 확인한다
- **Then** `POST /roles/:id/users`가 호출되고 관리자 목록에 추가된다
- **And** 해당 관리자의 다음 요청부터 이 역할 권한이 적용된다

#### Scenario: 역할에서 관리자 제거
- **Given** 역할 상세 화면의 관리자 목록에서 특정 관리자의 "제거" 버튼을 클릭한다
- **When** 확인 다이얼로그에서 승인한다
- **Then** `DELETE /roles/:id/users/:userId`가 호출되고 목록에서 제거된다

#### Scenario: SUPER_ADMIN 역할에서 마지막 사용자 제거 차단
- **Given** SUPER_ADMIN 역할에 관리자가 1명만 남아 있다
- **When** 그 관리자를 역할에서 제거하려 한다
- **Then** 백엔드가 `409 Conflict`를 반환한다
- **And** "마지막 SUPER_ADMIN 관리자는 제거할 수 없습니다" 메시지가 표시된다

---

### Requirement: 역할 상세 — 메뉴별 권한 매트릭스

역할 상세 화면에서 super_admin은 메뉴별 canRead/canWrite/canDelete를 체크박스로 설정할 수 있다.

#### Scenario: 권한 매트릭스 조회
- **Given** 역할 상세 페이지가 로드된다
- **When** `GET /roles/:id`가 호출된다
- **Then** 전체 메뉴 목록과 현재 역할의 RoleMenu 권한이 체크박스 매트릭스로 표시된다
- **And** 비활성 메뉴는 회색으로 표시되어 설정이 가능하되 사이드바에 미노출임을 표시한다

#### Scenario: 권한 일괄 저장
- **Given** 권한 매트릭스에서 체크박스를 변경한다
- **When** "저장" 버튼을 클릭한다
- **Then** `PUT /roles/:id/menus`가 전체 권한 배열로 호출된다
- **And** 변경된 권한이 저장되고 성공 토스트가 표시된다

#### Scenario: 메뉴 권한 독립성
- **Given** 상위 메뉴의 canRead를 변경한다
- **When** 저장된다
- **Then** 하위 메뉴의 권한은 변경되지 않는다
- **And** 각 메뉴는 독립적인 권한을 유지한다

---

### Requirement: 역할 관리 접근 제어

역할 관리 화면과 API는 SUPER_ADMIN 역할만 접근 가능하다.

#### Scenario: 일반 ADMIN 역할 관리 접근 차단
- **Given** SUPER_ADMIN 역할이 없는 관리자가 `/admin/roles`에 직접 접근한다
- **When** 서버 컴포넌트에서 권한이 검증된다
- **Then** `/admin/errors/403` 페이지로 redirect된다

#### Scenario: API 직접 호출 차단
- **Given** SUPER_ADMIN 역할이 없는 사용자가 `POST /roles`를 직접 호출한다
- **When** RbacGuard가 역할을 검증한다
- **Then** `403 Forbidden`이 반환된다
