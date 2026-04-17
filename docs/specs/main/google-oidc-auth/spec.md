## ADDED Requirements

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

### Requirement: 세션 사용자 조회

인증된 요청에 대해 현재 사용자 정보를 반환한다. AuthGuard가 미인증 요청을 차단한다.

#### Scenario: 인증된 세션으로 사용자 조회

- **Given** 유효한 세션 쿠키를 가진 요청
- **When** `GET /auth/me` 요청
- **Then** HTTP 200, `{ id, email, name, picture, roles }` 반환

#### Scenario: 미인증 상태에서 보호 엔드포인트 접근

- **Given** 세션 쿠키가 없는 요청
- **When** AuthGuard가 적용된 엔드포인트(`GET /auth/me` 포함)에 접근
- **Then** HTTP 401, `{ message: "Unauthorized" }` 반환
- **And** 응답 본문에 세션 토큰·사용자 정보 미포함

---

### Requirement: 세션 파기 (로그아웃)

서버 측에서 세션 정보를 파기하고 세션 쿠키 삭제 지시를 응답에 포함한다.

#### Scenario: 인증된 사용자가 로그아웃 요청

- **Given** 유효한 세션 쿠키를 가진 요청
- **When** `POST /auth/logout` 요청
- **Then** HTTP 200, `Set-Cookie` 헤더로 세션 쿠키 만료 처리
- **And** 이후 동일 쿠키로 보호 엔드포인트 접근 시 401 반환

---

### Requirement: Prisma User 모델

Google 계정 정보를 DB에 저장하여 이후 RBAC 연동 기반을 마련한다. `status`(pending|active|rejected)와 `role`(super_admin|admin) 컬럼이 포함된다.

#### Scenario: 최초 로그인 시 사용자 레코드 생성

- **Given** DB에 존재하지 않는 Google 계정(`email`)
- **When** 해당 계정으로 최초 로그인 성공
- **Then** `User` 테이블에 `{ email, name, picture, provider: "google" }` 레코드 생성
- **And** `Account` 테이블에 Google provider 연결 레코드 생성

#### Scenario: 재로그인 시 기존 사용자 레코드 유지

- **Given** DB에 이미 존재하는 `email`
- **When** 동일 계정으로 재로그인
- **Then** 기존 `User` 레코드 유지 (중복 생성 없음), `updatedAt` 갱신

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
