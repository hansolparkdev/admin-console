## ADDED Requirements

### Requirement: 미인증 접근 차단 및 로그인 유도

`(app)` 라우트 그룹에 접근하는 미인증 사용자를 로그인 화면으로 redirect하고, 원래 경로를 `callbackUrl` 파라미터로 보존한다.

#### Scenario: 미인증 사용자가 보호 경로에 접근

- **Given** 세션 쿠키가 없는 사용자
- **When** `/dashboard` 등 `(app)` 그룹 하위 경로에 접근
- **Then** `/login?callbackUrl=%2Fdashboard`로 redirect
- **And** 로그인 화면이 표시됨

#### Scenario: 인증된 사용자가 보호 경로에 접근

- **Given** 유효한 세션을 가진 사용자
- **When** `(app)` 그룹 하위 경로에 접근
- **Then** 요청 경로 그대로 렌더링 (redirect 없음)

---

### Requirement: 로그인 성공 후 원래 경로 복귀

로그인 성공 시 `callbackUrl`이 있으면 해당 경로로, 없으면 콘솔 기본 화면(`/dashboard`)으로 이동한다.

#### Scenario: callbackUrl이 있는 상태에서 로그인 성공

- **Given** `/login?callbackUrl=%2Fdashboard%2Fusers`로 유도된 사용자
- **When** Google 계정으로 로그인 성공
- **Then** `/dashboard/users`로 redirect

#### Scenario: callbackUrl 없이 로그인 성공

- **Given** 직접 `/login`에 접근한 사용자
- **When** Google 계정으로 로그인 성공
- **Then** 콘솔 기본 화면(`/dashboard` 또는 루트 redirect 대상)으로 이동

#### Scenario: callbackUrl이 외부 URL인 경우 (Open Redirect 방지)

- **Given** `/login?callbackUrl=https%3A%2F%2Fevil.com`
- **When** 로그인 성공
- **Then** 외부 URL 무시, 기본 경로(`/dashboard`)로 redirect

---

### Requirement: 세션 만료 후 보호 경로 재접근

세션 만료 상태에서 보호 경로 접근 시 현재 경로를 `callbackUrl`로 보존하여 로그인 화면으로 이동하고, 재로그인 후 원래 경로로 복귀한다.

#### Scenario: 세션 만료 후 보호 경로 접근

- **Given** 이전에 로그인했으나 세션이 만료된 사용자
- **When** 북마크된 `/dashboard/settings`에 접근
- **Then** `/login?callbackUrl=%2Fdashboard%2Fsettings`로 redirect
- **And** 로그인 성공 후 `/dashboard/settings`로 복귀

---

### Requirement: 로그아웃 후 보호 경로 차단

로그아웃 후 세션 쿠키가 파기되어 이후 보호 경로 접근 시 로그인 화면으로 유도된다.

#### Scenario: 로그아웃 후 보호 경로 접근 시도

- **Given** 로그아웃이 완료된 사용자
- **When** 브라우저 히스토리로 `/dashboard`에 접근 시도
- **Then** `/login`으로 redirect

---

## MODIFIED Requirements

### Requirement: active 상태 검증 강화

세션이 존재하더라도 DB `User.status !== 'active'`인 경우 콘솔 진입을 차단하고 `/login`으로 리디렉션한다. 세션 오브젝트에 `status`와 `role` 필드가 포함된다.

#### Scenario: pending 상태 세션 — 콘솔 진입 차단
- **Given** 사용자가 유효한 세션 쿠키를 보유하고 있으나 세션의 `status = pending`이고
- **When** `(app)` 라우트 그룹의 임의 경로에 접근하면
- **Then** `(app)/layout.tsx`에서 `session.user.status !== 'active'`를 감지하여 `/login`으로 리디렉션된다

#### Scenario: rejected 상태 세션 — 콘솔 진입 차단
- **Given** 사용자가 유효한 세션 쿠키를 보유하고 있으나 세션의 `status = rejected`이고
- **When** `(app)` 라우트 그룹의 임의 경로에 접근하면
- **Then** `(app)/layout.tsx`에서 `session.user.status !== 'active'`를 감지하여 `/login`으로 리디렉션된다

#### Scenario: 세션 타입에 status/role 포함
- **Given** Auth.js 세션이 발급될 때
- **When** `session` 오브젝트를 참조하면
- **Then** `session.user.status` (`pending | active | rejected`)와 `session.user.role` (`super_admin | admin`) 필드가 포함되어 있다
- **And** TypeScript 타입(`next-auth.d.ts` 확장)에서 해당 필드가 타입 안전하게 접근 가능하다

---

### Requirement: app-entry 루트 진입점 분기 (기존 app-entry 수정)

루트 `page.tsx`가 세션 여부를 확인하여 인증 사용자는 콘솔 기본 화면으로, 미인증 사용자는 로그인 화면으로 분기한다.

#### Scenario: 인증된 사용자가 루트(`/`)에 접근

- **Given** 유효한 세션을 가진 사용자
- **When** `/` 접근
- **Then** `/dashboard`로 redirect

#### Scenario: 미인증 사용자가 루트(`/`)에 접근

- **Given** 세션 쿠키가 없는 사용자
- **When** `/` 접근
- **Then** `/login`으로 redirect
