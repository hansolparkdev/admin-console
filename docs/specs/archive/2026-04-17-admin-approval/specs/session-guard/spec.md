## MODIFIED Requirements

### Requirement: 미인증 접근 차단 및 active 상태 검증

기존에는 Auth.js 세션 존재 여부만 검사하여 `(app)` 라우트 그룹 진입을 통제했다. 이제 세션이 존재하더라도 DB `User.status !== 'active'`인 경우 콘솔 진입을 차단하고 `/login`으로 리디렉션한다. 세션 오브젝트에 `status`와 `role` 필드가 포함되어야 한다.

#### Scenario: 비인증 사용자 접근 차단 (기존 동작 유지)
- **Given** 사용자가 유효한 세션 쿠키 없이 `(app)` 라우트 그룹의 임의 경로에 접근하면
- **When** `(app)/layout.tsx`에서 `auth()`가 null을 반환하면
- **Then** 즉시 `/login?callbackUrl=<original-path>`로 리디렉션된다

#### Scenario: pending 상태 세션 — 콘솔 진입 차단
- **Given** 사용자가 유효한 세션 쿠키를 보유하고 있으나 세션의 `status = pending`이고
- **When** `(app)` 라우트 그룹의 임의 경로에 접근하면
- **Then** `(app)/layout.tsx`에서 `session.user.status !== 'active'`를 감지하여 `/login`으로 리디렉션된다
- **And** 세션 쿠키는 파기된다 (`signOut()` 또는 `redirect('/login')` 처리)

#### Scenario: rejected 상태 세션 — 콘솔 진입 차단
- **Given** 사용자가 유효한 세션 쿠키를 보유하고 있으나 세션의 `status = rejected`이고
- **When** `(app)` 라우트 그룹의 임의 경로에 접근하면
- **Then** `(app)/layout.tsx`에서 `session.user.status !== 'active'`를 감지하여 `/login`으로 리디렉션된다
- **And** 세션 쿠키는 파기된다

#### Scenario: active 상태 세션 — 콘솔 정상 진입 (기존 동작 유지)
- **Given** 사용자가 `status = active`인 유효한 세션 쿠키를 보유하고
- **When** `(app)` 라우트 그룹의 임의 경로에 접근하면
- **Then** 리디렉션 없이 해당 페이지가 정상 렌더링된다

#### Scenario: 세션 타입에 status/role 포함
- **Given** Auth.js 세션이 발급될 때
- **When** `session` 오브젝트를 참조하면
- **Then** `session.user.status` (`pending | active | rejected`)와 `session.user.role` (`super_admin | admin`) 필드가 포함되어 있다
- **And** TypeScript 타입(`next-auth.d.ts` 확장)에서 해당 필드가 타입 안전하게 접근 가능하다
