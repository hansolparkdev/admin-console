# Google OIDC + Auth.js v5

## 한 줄 정의

**Auth.js v5**가 Google OIDC 프로토콜을 처리해 httpOnly JWE 쿠키 세션을 발급하고, Next.js 미들웨어가 모든 보호 경로를 게이트한다.

## 왜 필요한가

### 직접 OAuth 구현이 깨지는 시나리오

```ts
// ❌ 이렇게 직접 구현하면
const code = searchParams.get("code");
const token = await exchangeCode(code); // PKCE 없이 구현
localStorage.setItem("access_token", token); // XSS 취약
```

- PKCE(Proof Key for Code Exchange) 누락 → 인가 코드 탈취 가능
- state 파라미터 없이 CSRF 공격 노출
- token 만료 처리, 갱신, silent refresh — 직접 구현하면 수백 줄
- 모든 IDP(Google, Keycloak, GitHub 등)마다 다른 엔드포인트/스코프 파싱

Auth.js는 이것들을 **검증된 라이브러리로 일임**하고, 세션은 httpOnly 쿠키에만 둔다.

### callbackUrl open-redirect 위협

```
/login?callbackUrl=https://evil.com/steal
```

세션 쿠키를 훔치지 않아도, 로그인 후 리디렉션을 외부 도메인으로 보낼 수 있다.
`resolveCallbackUrl()` 유틸이 same-origin 검증 + `//` prefix 제거 + `javascript:` 차단을 처리한다.

## 표준 근거

- **RFC 6749** — OAuth 2.0 Authorization Framework
- **RFC 7636** — PKCE (Proof Key for Code Exchange) — 인가 코드 탈취 방어
- **OpenID Connect Core 1.0** — ID Token, UserInfo, nonce
- **RFC 7519** — JWT, **RFC 7516** — JWE (JSON Web Encryption) — Auth.js 세션 쿠키 형식
- **OWASP A01:2021** — Broken Access Control — open-redirect 포함
- **Auth.js v5 문서** — https://authjs.dev

## 우리 구조에서 어디에

```
apps/admin/
├── auth.ts                              # NextAuth() 설정 (providers, callbacks, pages)
├── src/
│   ├── middleware.ts                    # auth() 래퍼 — 모든 요청 게이트
│   ├── middleware-logic.ts             # 순수 함수 (isPublicPath, shouldRedirectToLogin …)
│   ├── lib/
│   │   ├── callback-url.ts             # resolveCallbackUrl — same-origin 검증
│   │   └── auth-error-messages.ts      # 에러 코드 → 한국어 UX 메시지
│   └── app/
│       ├── api/auth/[...nextauth]/route.ts  # Auth.js handlers 위임
│       ├── (public)/login/             # 로그인 UI (Server + Client 컴포넌트 분리)
│       └── (auth)/layout.tsx           # 서버-사이드 세션 가드 + 헤더
```

### 요청 흐름

```
브라우저 → /dashboard
  └─ middleware.ts (auth())
       ├─ 세션 없음 → 307 /login?callbackUrl=/dashboard
       └─ 세션 있음 → 통과 → (auth)/layout.tsx → DashboardPage

로그인 성공:
  Google OIDC → /api/auth/callback/google (Auth.js)
    → JWT callback (access/refresh_token 저장)
    → session callback (accessToken 노출)
    → Set-Cookie: authjs.session-token (httpOnly JWE)
    → 307 callbackUrl (/dashboard)
```

### JWT callback 설계

```ts
jwt({ token, account }) {
  if (account) {
    // 최초 sign-in 시만 실행 — token에 복사
    token.accessToken  = account.access_token;
    token.refreshToken = account.refresh_token;
    token.expiresAt    = account.expires_at;
  }
  return token;
}
```

- refresh token rotation은 **별도 슬라이스**에서 추가 (이 슬라이스에서는 저장만)
- `session.accessToken`은 BFF proxy가 Bearer 헤더로 변환할 때 사용

## 대안과 trade-off

| 방식 | 보안 | 복잡도 | 적합한 상황 |
|---|---|---|---|
| **Auth.js v5 (우리 선택)** | 높음 — PKCE, state, httpOnly | 낮음 (라이브러리 일임) | 표준 OIDC IDP + Next.js |
| 직접 OAuth 구현 | 구현 품질에 따라 천차만별 | 매우 높음 | IDP가 비표준이거나 완전 제어가 필요할 때 |
| Keycloak + KC adapter | 높음 | 중간 | On-prem, 멀티 테넌트, 세밀한 RBAC |
| Passport.js | 중간 | 중간 | Express 기반 (Next.js App Router와 맞지 않음) |
| Clerk / WorkOS | 높음 | 낮음 | SaaS — 벤더 종속 + 비용 |

**Keycloak 보존 이유**: `docker/docker-compose.yml`에 주석으로 남아있다. On-prem 배포(MES, 내부망)에서 Admin Console을 분기(fork)할 때 Google OIDC 대신 Keycloak으로 교체 가능하도록.

## 참고 자료

- [Auth.js v5 — Getting Started](https://authjs.dev/getting-started)
- [Auth.js — Google Provider](https://authjs.dev/getting-started/providers/google)
- [Auth.js — Session Strategies (JWT)](https://authjs.dev/concepts/session-strategies)
- [RFC 6749 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OWASP — Unvalidated Redirects and Forwards Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
