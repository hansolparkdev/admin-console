## MODIFIED Requirements

### Requirement: 로그인 차단 사용자 상태 안내 및 자동 로그아웃

Google OIDC 로그인 시도 후 `pending` 또는 `rejected` 상태로 인해 접근이 거부된 경우, 사용자에게 상태별 토스트 메시지를 노출하고 즉시 `signOut()`을 호출하여 미완성 세션 흔적을 제거한다. 토스트 노출 이후 세션이 남지 않도록 보장한다.

#### Scenario: pending 사용자 — 승인 대기 토스트 후 자동 로그아웃
- **Given** 사용자가 Google OIDC 인증에 성공했으나 DB `status = pending`이어서 Auth.js가 `/api/auth/error?error=pending_approval`로 리디렉션하고
- **When** 로그인 페이지(또는 에러 처리 컴포넌트)가 URL 파라미터 `error=pending_approval`을 감지하면
- **Then** "승인 대기 중입니다. 관리자 승인 후 다시 로그인해 주세요." 토스트가 노출되고
- **And** `signOut({ redirect: false })` 또는 `signOut({ callbackUrl: '/login' })`이 자동 호출되어 세션이 종료된다
- **And** 사용자는 콘솔 내부 경로에 진입하지 못하고 로그인 화면에 머문다

#### Scenario: rejected 사용자 — 거절 안내 토스트 후 자동 로그아웃
- **Given** 사용자가 Google OIDC 인증에 성공했으나 DB `status = rejected`이어서 Auth.js가 `/api/auth/error?error=rejected`로 리디렉션하고
- **When** 로그인 페이지(또는 에러 처리 컴포넌트)가 URL 파라미터 `error=rejected`를 감지하면
- **Then** "접근이 거절되었습니다. 관리자에게 문의해 주세요." 토스트가 노출되고
- **And** `signOut({ redirect: false })` 또는 `signOut({ callbackUrl: '/login' })`이 자동 호출되어 세션이 종료된다
- **And** 사용자는 콘솔 내부 경로에 진입하지 못하고 로그인 화면에 머문다

#### Scenario: 알 수 없는 에러 파라미터 — 기본 에러 안내
- **Given** `/api/auth/error?error=<unknown>` URL로 접근하면
- **When** 로그인 페이지가 에러 파라미터를 감지하지만 `pending_approval` / `rejected`에 해당하지 않으면
- **Then** "로그인 중 오류가 발생했습니다. 다시 시도해 주세요." 기본 에러 토스트가 노출된다
- **And** `signOut()`을 별도 호출하지 않는다 (세션이 없는 상태이므로)

#### Scenario: 정상 로그인 성공 — 토스트 없음
- **Given** 사용자가 Google OIDC 인증에 성공하고 DB `status = active`여서 세션이 정상 발급되면
- **When** `(app)` 라우트 그룹으로 리디렉션되면
- **Then** 에러 파라미터가 없으므로 토스트가 노출되지 않고 콘솔에 정상 진입한다
