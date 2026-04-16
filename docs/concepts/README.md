# 개념 문서

이 폴더는 admin-console이 **왜 이렇게 만들어졌는지** 설명한다. 구현 자체는 코드와 `docs/setup.md`에, **설계 근거·대안·표준 레퍼런스**는 여기에.

## 사용 방법

- 새 패턴·라이브러리·보안 결정을 코드에 반영할 때, 해당 개념 문서를 **동시에** 작성한다.
- 각 문서는 다음 포맷:
  - **한 줄 정의**
  - **왜 필요한가** (대안이 깨지는 시나리오)
  - **표준 근거** (IETF / OWASP / 공식 문서 링크)
  - **우리 구조에서 어디에** (파일 경로 + 역할)
  - **대안과 trade-off**
  - **참고 자료**

## 목록

| 문서 | 주제 |
|---|---|
| [bff.md](bff.md) | Backend For Frontend — 브라우저/API 사이 Next.js 프록시 |
| [httponly-session.md](httponly-session.md) | 세션은 httpOnly 쿠키만, localStorage 금지 이유 |
| [oidc-authjs.md](oidc-authjs.md) | Google OIDC + Auth.js v5 — 세션 발급, 미들웨어 게이트, callbackUrl 검증 |
| [query-key-factory.md](query-key-factory.md) | TanStack Query 키 팩토리 — 문자열 리터럴 금지 |
| [query-client-ssr.md](query-client-ssr.md) | QueryClient 서버 per-request / 브라우저 singleton |
| [prisma-driver-adapter.md](prisma-driver-adapter.md) | Prisma 7 driver adapter (adapter-pg) 구조 |
| [shadcn-architecture.md](shadcn-architecture.md) | shadcn은 라이브러리가 아니라 복사 방식 |

## 앞으로 추가될 후보

구현 순서에 따라 도착할 때 쓴다:

- `rbac-pattern-b.md` — Role/Permission/Menu 정규화 (패턴 B)
- `sse-vs-websocket.md` — 왜 실시간에 SSE를 골랐나
- `monorepo-turborepo.md` — workspace 구조와 turbo 파이프라인 의도
- `bff-auth-bridge.md` — BFF 프록시에서 세션 → Bearer 변환 (Step 9에서 bff.md와 합칠 수 있음)
