### Requirement: 루트 리다이렉트

`app/page.tsx`에서 `redirect("/dashboard")`를 호출해 루트 경로 진입 시 즉시 `/dashboard`로 서버 리다이렉트.

#### Scenario: 루트 경로 진입 시 /dashboard로 리다이렉트

- **Given** 사용자가 브라우저에서 `/` URL로 접근한다
- **When** 서버가 요청을 처리한다
- **Then** 브라우저 URL이 `/dashboard`로 변경된다
- **And** HTTP 307 상태로 리다이렉트된다

#### Scenario: redirect() 호출 단위 테스트

- **Given** `next/navigation`의 `redirect`가 모킹되었다
- **When** root `page.tsx` 컴포넌트가 렌더된다
- **Then** `redirect("/dashboard")`가 정확히 1회 호출된다

### Requirement: (app) 라우트 그룹 구조

`app/(app)/` 라우트 그룹 신설. `layout.tsx`에 Shell(Sidebar + Header + Main) 조합. 그룹명은 세션 보안 의미 없는 중립명 `(app)` 사용.

#### Scenario: (app) 그룹 내 모든 페이지가 Shell을 공유

- **Given** `(app)/layout.tsx`에 Shell이 렌더된다
- **When** `/dashboard` 또는 `/users`로 접근한다
- **Then** 두 경로 모두 동일한 사이드바·헤더가 표시된다
- **And** 사이드바와 헤더는 라우트 이동 시 재렌더되지 않는다

#### Scenario: 알 수 없는 경로는 Shell 미렌더

- **Given** 사용자가 `/unknown` URL로 접근한다
- **When** 페이지가 렌더된다
- **Then** Next.js 기본 404 페이지가 표시된다
- **And** 사이드바·헤더·메인 Shell 영역이 렌더되지 않는다

### Requirement: auth() hook point

`(app)/layout.tsx` 상단에 `TODO(google-oidc-login)` 주석으로 auth() 가드 삽입 위치를 명시. 본 슬라이스에는 실제 가드 없음.

#### Scenario: hook point 주석 존재

- **Given** `apps/admin/src/app/(app)/layout.tsx` 파일을 읽는다
- **When** 파일 상단 주석을 탐색한다
- **Then** `TODO(google-oidc-login)` 문자열이 존재한다
- **And** `auth()` 가드 적용 방법이 주석으로 명시되어 있다

#### Scenario: 미래 auth() 가드 통합 지점 (로그인 슬라이스 담당)

- **Given** 로그인 슬라이스가 병합된 이후 (본 슬라이스 범위 외)
- **When** `(app)/layout.tsx` hook point에 `auth()` 가드가 추가된다
- **Then** 미로그인 사용자가 `/dashboard` 접근 시 `/login?callbackUrl=...`로 리다이렉트된다
- **And** 기존 Shell 구조 변경 없이 한 줄 추가로 가드가 동작한다

### Requirement: dashboard placeholder 페이지

`(app)/dashboard/page.tsx`에 Headline-SM 타이틀 "Dashboard"와 후속 슬라이스 안내 문구를 렌더.

#### Scenario: dashboard 페이지 타이틀 렌더

- **Given** 사용자가 `/dashboard`에 접근한다
- **When** 메인 영역이 렌더된다
- **Then** "Dashboard" 텍스트가 Headline 수준 요소로 존재한다
- **And** 후속 슬라이스 안내 문구가 표시된다

### Requirement: users placeholder 페이지

`(app)/users/page.tsx`에 Headline-SM 타이틀 "Users"와 후속 슬라이스 안내 문구를 렌더.

#### Scenario: users 페이지 타이틀 렌더

- **Given** 사용자가 `/users`에 접근한다
- **When** 메인 영역이 렌더된다
- **Then** "Users" 텍스트가 Headline 수준 요소로 존재한다
- **And** 후속 슬라이스 안내 문구가 표시된다

### Requirement: 성능·접근성 기준

Lighthouse 성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02. 1280×800 viewport에서 가로 스크롤 없음.

#### Scenario: Lighthouse 기준 충족

- **Given** `/dashboard`가 1280×800 viewport에서 렌더된다
- **When** Lighthouse CI를 실행한다
- **Then** 성능 점수가 90 이상이다
- **And** 접근성 점수가 95 이상이다
- **And** CLS가 0.02 이하이다

#### Scenario: 가로 스크롤 없음

- **Given** 1280×800 viewport에서 `/dashboard`가 렌더된다
- **When** `document.documentElement.scrollWidth`를 확인한다
- **Then** 값이 1280 이하이다
