## ADDED Requirements

### Requirement: 관리자 목록 조회 API

super_admin 전용 `GET /admin/users` 엔드포인트. 전체 관리자 레코드를 status 기준으로 필터링하여 반환한다.

#### Scenario: 전체 목록 조회 (필터 없음)
- **Given** 요청자가 `role = super_admin`인 유효한 세션을 보유하고
- **When** `GET /admin/users` 요청을 보내면
- **Then** DB의 모든 관리자 레코드를 `createdAt` 내림차순으로 반환하고
- **And** 응답에는 `id`, `name`, `email`, `status`, `role`, `createdAt`, `updatedAt` 필드가 포함된다

#### Scenario: status 필터 조회
- **Given** 요청자가 `role = super_admin`인 유효한 세션을 보유하고
- **When** `GET /admin/users?status=pending` 요청을 보내면
- **Then** `status = pending`인 레코드만 반환된다

#### Scenario: super_admin 이외 접근 차단
- **Given** 요청자가 `role = admin` (super_admin 아님)인 세션을 보유하고
- **When** `GET /admin/users` 요청을 보내면
- **Then** HTTP 403 Forbidden이 반환된다

#### Scenario: 미인증 접근 차단
- **Given** 유효한 세션 없이
- **When** `GET /admin/users` 요청을 보내면
- **Then** HTTP 401 Unauthorized가 반환된다

---

### Requirement: 관리자 승인 API

super_admin이 `pending` 상태의 관리자를 `active`로 승인한다.

#### Scenario: pending 관리자 승인
- **Given** 요청자가 `role = super_admin`이고 대상 관리자가 `status = pending`이며
- **When** `PATCH /admin/users/:id/approve` 요청을 보내면
- **Then** 해당 관리자의 `status`가 `active`로 업데이트되고
- **And** 업데이트된 관리자 레코드가 응답으로 반환된다

#### Scenario: 이미 active 상태인 관리자 승인 시도
- **Given** 대상 관리자가 이미 `status = active`이고
- **When** `PATCH /admin/users/:id/approve` 요청을 보내면
- **Then** HTTP 409 Conflict 또는 HTTP 400 Bad Request가 반환된다

#### Scenario: 존재하지 않는 관리자 승인 시도
- **Given** 요청한 `:id`에 해당하는 관리자 레코드가 DB에 없고
- **When** `PATCH /admin/users/:id/approve` 요청을 보내면
- **Then** HTTP 404 Not Found가 반환된다

---

### Requirement: 관리자 거절 API

super_admin이 `pending` 또는 `active` 상태의 관리자를 `rejected`로 거절한다.

#### Scenario: pending 관리자 거절
- **Given** 요청자가 `role = super_admin`이고 대상 관리자가 `status = pending`이며
- **When** `PATCH /admin/users/:id/reject` 요청을 보내면
- **Then** 해당 관리자의 `status`가 `rejected`로 업데이트되고
- **And** 업데이트된 관리자 레코드가 응답으로 반환된다

#### Scenario: active 관리자 거절 (접근 취소)
- **Given** 요청자가 `role = super_admin`이고 대상 관리자가 `status = active`이며
- **When** `PATCH /admin/users/:id/reject` 요청을 보내면
- **Then** 해당 관리자의 `status`가 `rejected`로 업데이트되고
- **And** 해당 관리자의 기존 세션이 무효화된다 (다음 요청 시 세션 검증 실패 처리)

#### Scenario: super_admin 자기 자신 거절 금지
- **Given** 요청자가 `role = super_admin`이고 `:id`가 자기 자신의 ID이며
- **When** `PATCH /admin/users/:id/reject` 요청을 보내면
- **Then** HTTP 400 Bad Request가 반환된다 (자기 자신 거절 불가)

---

### Requirement: 관리자 상태 복구 API

super_admin이 `rejected` 상태의 관리자를 `pending` 또는 `active`로 되돌린다. (운영 유연성 우선 결정)

#### Scenario: rejected 관리자를 pending으로 복구
- **Given** 요청자가 `role = super_admin`이고 대상 관리자가 `status = rejected`이며
- **When** `PATCH /admin/users/:id/restore` 요청을 `{ targetStatus: "pending" }`과 함께 보내면
- **Then** 해당 관리자의 `status`가 `pending`으로 업데이트되고
- **And** 업데이트된 관리자 레코드가 응답으로 반환된다

#### Scenario: rejected 관리자를 active로 복구
- **Given** 요청자가 `role = super_admin`이고 대상 관리자가 `status = rejected`이며
- **When** `PATCH /admin/users/:id/restore` 요청을 `{ targetStatus: "active" }`과 함께 보내면
- **Then** 해당 관리자의 `status`가 `active`로 업데이트되고
- **And** 해당 관리자는 다음 로그인 시 콘솔에 정상 진입할 수 있다

#### Scenario: rejected 아닌 상태에서 복구 시도
- **Given** 대상 관리자가 `status = pending` 또는 `status = active`이고
- **When** `PATCH /admin/users/:id/restore` 요청을 보내면
- **Then** HTTP 400 Bad Request가 반환된다 (rejected 상태에서만 복구 가능)

---

### Requirement: 관리자 목록 화면

super_admin 전용 `/admin/users` 페이지. 관리자 목록을 상태별 탭으로 조회하고 각 행에서 상세 페이지로 이동한다.

#### Scenario: 목록 화면 진입 — super_admin만 허용
- **Given** 사용자가 `role = super_admin`인 세션을 보유하고
- **When** `/admin/users` 경로로 접근하면
- **Then** 관리자 목록 테이블이 렌더링되고
- **And** `pending`, `active`, `rejected` 상태별 필터 탭이 표시된다

#### Scenario: 목록 화면 진입 — super_admin 아닌 경우 접근 차단
- **Given** 사용자가 `role = admin` (super_admin 아님)인 세션을 보유하고
- **When** `/admin/users` 경로로 접근하면
- **Then** 403 페이지 또는 대시보드로 리디렉션된다

#### Scenario: 테이블 로딩/에러/빈 상태 처리
- **Given** `/admin/users` 페이지가 렌더링될 때
- **When** 데이터 로딩 중이면 `pending` 상태의 스켈레톤 UI가 표시되고
- **And** 에러 발생 시 에러 안내 메시지가 표시되며
- **Then** 데이터가 0건이면 "등록된 관리자가 없습니다." 빈 상태 UI가 표시된다

---

### Requirement: 관리자 상세 화면

super_admin 전용 `/admin/users/[id]` 페이지. 개별 관리자의 상세 정보와 승인/거절/복구 액션 버튼을 제공한다.

#### Scenario: 상세 화면 진입 및 액션 버튼 표시
- **Given** 사용자가 `role = super_admin`인 세션을 보유하고 대상 관리자 레코드가 존재하며
- **When** `/admin/users/:id` 경로로 접근하면
- **Then** 대상 관리자의 이름, 이메일, status, role, 가입일이 표시되고
- **And** 현재 `status`에 따라 가능한 액션 버튼만 활성화된다 (pending → 승인/거절, active → 거절, rejected → pending 복구/active 복구)

#### Scenario: 승인 버튼 클릭 — 낙관적 업데이트
- **Given** 대상 관리자가 `status = pending`이고
- **When** super_admin이 승인 버튼을 클릭하면
- **Then** `queryClient.setQueryData`로 UI가 즉시 `active`로 업데이트되고
- **And** `PATCH /admin/users/:id/approve` API 호출이 완료되면 서버 응답으로 최종 동기화된다
- **And** API 호출 실패 시 이전 상태로 롤백된다

#### Scenario: 존재하지 않는 관리자 상세 접근
- **Given** 요청한 `:id`에 해당하는 관리자 레코드가 DB에 없고
- **When** `/admin/users/:id` 경로로 접근하면
- **Then** 404 Not Found 페이지가 렌더링된다
