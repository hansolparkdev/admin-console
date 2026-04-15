# BFF (Backend For Frontend)

## 한 줄 정의

브라우저와 실제 API 서버 사이에 **프론트엔드 서버(Next.js)를 한 단계 끼워넣어** 인증·CORS·URL 은닉을 대신 처리하게 하는 패턴.

## 왜 필요한가

### BFF 없을 때 생기는 문제

브라우저가 API 서버를 직접 호출하는 구조:

```
[Browser] ──── fetch(https://api.company.com/users) ────▶ [API]
```

1. **API URL 노출**
   브라우저가 API 주소를 알아야 하니 번들에 박힘. Next.js면 `NEXT_PUBLIC_API_URL` 같은 env로 노출해야 하는데, 이건 공격자에게 엔드포인트 지도를 그대로 넘겨주는 셈.

2. **CORS 설정 필요**
   브라우저 origin(`app.company.com`)과 API origin(`api.company.com`)이 달라서 preflight, credentials, SameSite 쿠키 정책까지 다 신경 써야 함. 구성 실수 하나면 로그인 쿠키가 안 실려 간다.

3. **토큰을 브라우저가 직접 다뤄야 함**
   OIDC flow가 브라우저에서 완결되니 access_token·refresh_token이 JS 메모리나 storage에 머문다. 대부분은 어쩔 수 없이 `localStorage` / `sessionStorage`에 저장 → **XSS 한 번이면 토큰 유출**. OWASP가 명시적으로 금지하는 패턴.

4. **refresh / rotation 로직이 클라로 옴**
   만료 선제 감지, 동시 요청 디바운싱, silent refresh iframe 같은 복잡도를 프론트가 다 떠안음.

### BFF 있을 때

```
[Browser] ──── fetch(/api/users) ────▶ [Next.js BFF] ──── fetch(http://api:3001/users) ────▶ [API]
          same-origin                    서버 코드                Bearer 토큰 서버에서 주입
          httpOnly 쿠키만                auth() 호출               API URL은 env, 번들엔 없음
```

- **브라우저는 `/api/*` only** (same-origin) → CORS 없음, API URL 모름
- **세션은 httpOnly 쿠키** → JS로 접근 불가, XSS로 유출 불가
- **토큰 변환은 서버에서** → 클라는 존재조차 모름
- **refresh 로직도 서버** → Auth.js가 세션 갱신 담당

## 표준 근거

- **IETF**: `draft-ietf-oauth-browser-based-apps` 섹션 6.2 "Backend For Frontend (BFF)"에서 공식 명명된 권장 패턴. SPA+OAuth 조합에서 가장 안전한 선택지로 제시.
- **OWASP**: Session Management Cheat Sheet — "For web applications that have session data stored on the server, use session cookies with the httpOnly and Secure attributes".
- **Auth.js 공식 튜토리얼**: `app/api/auth/[...nextauth]/route.ts` + BFF proxy가 표준 구성.
- **Netflix Tech Blog** — BFF 개념 자체를 업계에 공식화한 글 중 하나.

## 우리 구조에서 어디에

| 파일 | 역할 |
|---|---|
| `apps/admin/src/app/api/[...proxy]/route.ts` | Catch-all route. 브라우저의 `/api/*` 요청을 `API_URL`(서버 전용 env)로 전달. GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD 모두 같은 함수로 처리. |
| `apps/admin/src/lib/api.ts` | 클라이언트 fetcher. `baseURL = "/api"`, `credentials: "include"`. |
| `apps/admin/src/lib/api-server.ts` | 서버 fetcher. BFF 거치지 않고 `API_URL` 직접 호출(Server Component prefetch용). `server-only` import로 클라 번들 유출 차단. |

## 요청이 흐르는 경로 (예: `/api/health`)

1. Client component: `apiFetch("/health")`
2. Fetch: `GET /api/health` (same-origin, cookies 자동 첨부)
3. Next.js App Router가 `apps/admin/src/app/api/[...proxy]/route.ts`에 매칭. `params.proxy = ["health"]`.
4. BFF 함수가 `API_URL`(현재 `http://localhost:3001`) + `/health` 조립
5. `fetch()` 서버 측에서 실행. 응답 stream 그대로 브라우저에 다시 전달.
6. Client는 same-origin 응답만 보고, `localhost:3001`은 절대 알지 못함.

> Step 9(Google OIDC)가 붙으면 4번과 5번 사이에 `const session = await auth()` → `headers.set("Authorization", `Bearer ${session.accessToken}`)` 2줄이 추가된다. 그 외는 그대로.

## 구현 디테일 (우리 선택과 이유)

### Body를 `arrayBuffer()`로 전달
```ts
body: hasBody ? await req.arrayBuffer() : undefined,
```
`req.text()`는 바이너리(업로드된 이미지 등)를 깨뜨린다. `arrayBuffer`는 JSON·텍스트·바이너리 모두 무손실.

### `content-length` / `content-encoding` 응답 헤더 제거
```ts
resHeaders.delete("content-length");
resHeaders.delete("content-encoding");
```
Next.js가 응답을 재인코딩(gzip 재적용 등)하면서 upstream이 보내준 길이/인코딩이 실제 바디와 mismatch 될 수 있다. 브라우저가 "선언된 길이보다 짧다"라며 파싱 실패하는 사고의 원인. 안전하게 지움.

### `host` / `connection` 요청 헤더 제거
```ts
headers.delete("host");
headers.delete("connection");
headers.delete("content-length");
```
`host`는 당연히 upstream 호스트로 바꿔야 하고, `connection`은 HTTP/2에서 금지된 hop-by-hop 헤더. `content-length`는 본문을 재조립하니 재계산하게 둔다.

### `Set-Cookie`는 그대로 pass-through
Auth.js가 admin-console 도메인의 쿠키(세션)를 독점 관리하고, upstream API가 자체 쿠키를 쓰지 않는 한(우리 NestJS는 stateless) Set-Cookie 충돌 없음. 필요해지면 필터링 추가.

### Catch-all 세그먼트 이름 `[...proxy]`
CLAUDE.md §핵심 폴더 규칙에 확정된 이름. `[...slug]` / `[...all]` 같은 관용어 대신 의도를 드러내는 이름.

## 단점 / 주의사항

- **레이턴시 1 hop 추가**: 브라우저 → Next.js → API. 내부망이면 <5ms라 무시 가능. 크로스리전이면 Next.js 배포 리전을 API 근처로.
- **Next.js 스케일 포인트 추가**: 실질적 프록시 역할이라 Next.js 인스턴스 수를 API 트래픽에 맞춰 늘려야 함.
- **WebSocket은 별도 처리**: Next.js route handler로 WS 업그레이드 불가. 실시간 필요 시 WS는 서브도메인·별도 엔드포인트로 우회하거나 서버사이드 이벤트(SSE)로 대체. 우리는 SSE 채택(CLAUDE.md).
- **Streaming/SSE는 OK**: `upstream.body` 그대로 반환하면 chunked 스트리밍 자연 통과.

## 대안과 trade-off

| 방식 | 언제 쓰나 | 왜 우리가 BFF인가 |
|---|---|---|
| 직접 호출 + localStorage 토큰 | 공개 API·내부 툴·학습용 | XSS 치명적. 프로덕션 어드민엔 부적절 |
| 직접 호출 + httpOnly 쿠키 (동일 도메인) | API가 같은 domain/subdomain이고 OIDC 안 씀 | OIDC에서 client_secret 다루려면 서버 필요 |
| API Gateway (Kong/Nginx) 앞에 두기 | 트래픽 초고량·멀티 백엔드 | 학습·소규모엔 과함. Next.js BFF가 기능 충분 |
| **Next.js BFF (우리 선택)** | SPA+OIDC+복잡한 어드민 | 표준 권고, 보안 기본값 좋음, Auth.js와 합이 맞음 |

## 참고 자료

- [IETF OAuth for Browser-Based Apps (draft)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) — §6.2 BFF
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Auth.js — Installation & Session](https://authjs.dev/getting-started/installation)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Netflix Tech Blog — BFF](https://netflixtechblog.com/)
