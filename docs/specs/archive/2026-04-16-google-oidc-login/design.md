## Context

현재 `(app)/layout.tsx`에는 `auth()` 가드 hook point가 TODO로 비어 있고, `(public)/` 그룹에 로그인 화면이 없다. `apps/api`에는 인증 모듈이 없다. 루트 `app/page.tsx`는 단순 redirect만 하며 세션 여부를 확인하지 않는다.

## Goals / Non-Goals

**Goals:**

- Auth.js v5 + Google OIDC Provider로 조직 계정 기반 인증 흐름 구현
- httpOnly 세션 쿠키 + BFF 패턴 준수 (브라우저에 토큰 미노출)
- 비인가 계정은 서버(`apps/api`)에서 1차 차단, 프론트 UI는 UX 안내용
- 미인증 접근 시 로그인 화면으로 유도하고 원래 경로 복귀
- 로그인 화면 디자인 충실도 strict (plan.md §5, §8 기준)

**Non-Goals:**

- 이메일/패스워드 인증 방식 지원
- Google 외 OIDC Provider(GitHub, Azure AD 등) 추가
- 세션 갱신 정책 및 만료 기간 최종 확정 (후속 보안 정책 슬라이스)
- "상태", "도움말", "이용 약관" 링크 목적지 구현 (후속 슬라이스)

## Decisions

### 1. Auth.js v5를 apps/admin에서 세션 레이어로 사용

Auth.js v5는 Next.js App Router와 네이티브로 통합되며 `auth()` 헬퍼가 Server Component·Route Handler 양쪽에서 동작한다. Google Provider 내장, httpOnly 쿠키 기본, `(app)/layout.tsx` hook point와 자연스럽게 연결된다.

**이유**: `middleware.ts`는 Next 16에서 금지 패턴(forbidden-patterns.md §3.2). `proxy.ts` 컨벤션과의 충돌 없이 `(app)/layout.tsx` server-side `auth()` 호출만으로 가드 구현 가능.

### 2. 조직 계정 검증을 apps/api에서 집행

Auth.js의 `signIn` 콜백에서 apps/api `/auth/verify` 엔드포인트를 호출하여 허용 도메인·허용 목록을 서버 설정 기반으로 검증한다. 프론트는 결과 에러 코드를 URL 파라미터로 수신해 UI에 사유를 표시한다.

**이유**: RBAC·도메인 검증은 반드시 백엔드에서 최종 결정해야 함(forbidden-patterns.md §1.3). 프론트 표시는 UX 용도이고 bypass 불가 구조를 보장한다.

### 3. 세션 저장소 전략 — Auth.js 기본 JWT 세션 + Redis 선택적 활성화

초기 구현은 Auth.js 기본 JWT 세션(서명된 쿠키)으로 진행하고, Redis 세션 스토어는 환경 변수(`AUTH_SESSION_STORE=redis`)로 활성화 가능하도록 확장 지점을 열어둔다.

**이유**: Prisma Session adapter 연결은 DB 마이그레이션 및 Session/Account 모델 추가를 필요로 한다. 초기에는 JWT로 빠르게 기동하되, 서버 측 강제 로그아웃이 필요해지는 시점에 Redis adapter로 전환하는 경로를 설계에 명시한다.

### 4. 콜백 에러를 URL 파라미터로 전달

Google 인증 취소, 비인가 계정, 서버 오류 각각에 대해 `?error=<code>` 파라미터로 로그인 화면에 전달한다. 로그인 화면 서버 컴포넌트가 `searchParams`에서 코드를 읽어 클라이언트 컴포넌트에 초기값으로 주입한다.

**이유**: Auth.js v5의 표준 에러 전달 방식. 클라이언트 상태로 에러를 관리하면 hydration mismatch가 발생할 수 있다. fetch-on-render 금지 패턴(forbidden-patterns.md §2.3)과도 일치한다.

### 5. 로그인 화면 라우트 — `(public)/login`

Shell이 필요 없는 공개 페이지이므로 `(public)` 그룹에 배치한다. plan.md §8 규약 예외 요청 없음 확인.

**이유**: folder-conventions.md §라우트 그룹 컨벤션 — "(public)/: 로그인·에러·공개 페이지. Shell 미적용."

## Risks / Trade-offs

- **Google OAuth 자격 증명 미설정 시 로컬 개발 불가**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET` 필수. 미설정 시 빌드 단계에서 명시적 오류 발생하도록 `env.ts` 검증 추가 필요 → 빌드 타임 조기 실패로 완화.
- **JWT 세션 서버측 강제 만료 불가**: JWT 기반이면 세션 파기가 쿠키 삭제 뿐이다. 토큰 만료 전 강제 로그아웃 필요 시 Redis adapter로 교체 필요. 현재 범위에서는 미구현으로 이 한계를 문서화.
- **허용 도메인·목록 값 미확정**: 환경 변수(`ALLOWED_DOMAINS`, `ALLOWED_EMAILS`)로 주입 가능 구조로 설계. 빈 값이면 전체 Google 계정 허용(개발 환경 안전망). 운영 환경에서 반드시 설정.
