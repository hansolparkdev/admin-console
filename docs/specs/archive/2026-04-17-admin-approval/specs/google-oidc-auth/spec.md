## MODIFIED Requirements

### Requirement: Google OIDC 토큰 검증 및 사용자 허용 판단

기존 `ALLOWED_DOMAINS` / `ALLOWED_EMAILS` 환경변수 기반 허용 체크를 제거하고, DB의 `User.status` 컬럼을 기준으로 콘솔 진입 허용 여부를 결정한다. Google OIDC 인증 자체는 유지하되, 인가 판단은 DB가 단일 진실원이다.

#### Scenario: 최초 신규 사용자 로그인 — pending 등록
- **Given** DB에 관리자 레코드가 1명 이상 존재하고
- **When** Google OIDC 인증에 성공한 신규 사용자(DB에 레코드 없음)가 로그인을 시도하면
- **Then** DB에 해당 사용자 레코드가 `status = pending`으로 생성되고
- **And** Auth.js `signIn` 콜백이 `{ allowed: false, reason: "pending_approval" }` 에러로 응답하여 `/api/auth/error?error=pending_approval`로 리디렉션된다

#### Scenario: pending 사용자 로그인 시도
- **Given** DB에 해당 사용자 레코드가 `status = pending`으로 존재하고
- **When** 해당 사용자가 Google OIDC 인증에 성공하면
- **Then** Auth.js `signIn` 콜백이 `{ allowed: false, reason: "pending_approval" }` 에러로 응답하고
- **And** 세션 쿠키가 발급되지 않으며 콘솔에 진입하지 못한다

#### Scenario: active 사용자 로그인
- **Given** DB에 해당 사용자 레코드가 `status = active`로 존재하고
- **When** 해당 사용자가 Google OIDC 인증에 성공하면
- **Then** Auth.js `signIn` 콜백이 `{ allowed: true }`를 반환하고
- **And** 세션 쿠키(httpOnly)가 발급되어 콘솔에 정상 진입한다

#### Scenario: rejected 사용자 로그인 시도
- **Given** DB에 해당 사용자 레코드가 `status = rejected`로 존재하고
- **When** 해당 사용자가 Google OIDC 인증에 성공하면
- **Then** Auth.js `signIn` 콜백이 `{ allowed: false, reason: "rejected" }` 에러로 응답하고
- **And** 세션 쿠키가 발급되지 않으며 콘솔에 진입하지 못한다
- **And** DB의 `status`는 `rejected` 그대로 유지된다

#### Scenario: DB 최초 사용자 — 자동 부트스트랩
- **Given** DB에 관리자 레코드가 0명이고
- **When** 임의의 사용자가 Google OIDC 인증에 성공하면
- **Then** DB 트랜잭션 내에서 해당 사용자가 `status = active`, `role = super_admin`으로 등록되고
- **And** Auth.js `signIn` 콜백이 `{ allowed: true }`를 반환하여 세션 쿠키가 발급된다

#### Scenario: 부트스트랩 경합 — 동시 최초 로그인
- **Given** DB에 관리자 레코드가 0명인 상태에서
- **When** 두 명 이상의 사용자가 동시에 Google OIDC 인증에 성공하면
- **Then** DB unique constraint + 트랜잭션에 의해 먼저 커밋된 1명만 `active + super_admin`이 되고
- **And** 나머지 사용자는 `status = pending`으로 등록되어 `pending_approval` 에러로 응답받는다

---

### Requirement: Prisma User 모델 — status/role 컬럼 추가

기존 User/Account 테이블에 관리자 승인 상태(`status`)와 역할(`role`) 컬럼을 추가한다.

#### Scenario: User 레코드 status 기본값
- **Given** 신규 사용자가 Google OIDC 로그인에 최초 성공하면
- **When** DB에 User 레코드가 생성될 때
- **Then** `status` 컬럼의 기본값은 `pending`이고
- **And** `role` 컬럼의 기본값은 `admin`이다

#### Scenario: 부트스트랩 사용자 레코드
- **Given** DB 관리자 레코드 0명 상태에서 최초 사용자가 로그인하면
- **When** DB에 User 레코드가 생성될 때
- **Then** `status = active`, `role = super_admin`으로 저장된다

#### Scenario: status Enum 값 강제
- **Given** API 또는 서비스가 User.status를 업데이트할 때
- **When** `pending`, `active`, `rejected` 이외의 값이 입력되면
- **Then** DB Enum 제약 또는 Prisma validation에 의해 오류가 발생하고 레코드가 변경되지 않는다
