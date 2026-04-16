## ADDED Requirements

### Requirement: Google OIDC 토큰 검증

apps/api가 Auth.js v5 signIn 콜백에서 전달받은 Google ID Token을 검증하고 조직 계정 허용 규칙을 집행한다. 허용 여부는 환경 변수(`ALLOWED_DOMAINS`, `ALLOWED_EMAILS`)로 주입된 설정을 서버에서만 참조한다.

#### Scenario: 허용된 조직 도메인 계정으로 검증 요청

- **Given** `ALLOWED_DOMAINS=example.com`으로 설정된 서버
- **When** `user@example.com` Google 계정의 ID Token으로 `POST /auth/verify` 요청
- **Then** HTTP 200, `{ allowed: true, user: { email, name, picture } }` 반환
- **And** apps/admin Auth.js signIn 콜백이 로그인 성공으로 처리

#### Scenario: 비인가 개인 Gmail 계정으로 검증 요청

- **Given** `ALLOWED_DOMAINS=example.com`으로 설정된 서버
- **When** `user@gmail.com` Google 계정의 ID Token으로 `POST /auth/verify` 요청
- **Then** HTTP 403, `{ allowed: false, reason: "unauthorized_domain" }` 반환
- **And** apps/admin Auth.js signIn 콜백이 로그인 실패(`?error=unauthorized_domain`)로 처리

#### Scenario: 허용 목록에 명시된 개인 계정으로 검증 요청

- **Given** `ALLOWED_EMAILS=special@gmail.com`으로 설정된 서버
- **When** `special@gmail.com` Google 계정의 ID Token으로 `POST /auth/verify` 요청
- **Then** HTTP 200, `{ allowed: true }` 반환

#### Scenario: 허용 도메인·목록 미설정 (개발 환경)

- **Given** `ALLOWED_DOMAINS`, `ALLOWED_EMAILS` 환경 변수가 모두 비어있는 서버
- **When** 임의 Google 계정으로 `POST /auth/verify` 요청
- **Then** HTTP 200, `{ allowed: true }` 반환 (전체 허용 개발 모드)

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

Google 계정 정보를 DB에 저장하여 이후 RBAC 연동 기반을 마련한다.

#### Scenario: 최초 로그인 시 사용자 레코드 생성

- **Given** DB에 존재하지 않는 Google 계정(`email`)
- **When** 해당 계정으로 최초 로그인 성공
- **Then** `User` 테이블에 `{ email, name, picture, provider: "google" }` 레코드 생성
- **And** `Account` 테이블에 Google provider 연결 레코드 생성

#### Scenario: 재로그인 시 기존 사용자 레코드 유지

- **Given** DB에 이미 존재하는 `email`
- **When** 동일 계정으로 재로그인
- **Then** 기존 `User` 레코드 유지 (중복 생성 없음), `updatedAt` 갱신
