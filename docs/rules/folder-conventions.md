# 핵심 폴더 규칙

CLAUDE.md의 "워크스페이스 구조"가 정체성이라면, 이 문서는 **각 앱 내부의 폴더 배치 규칙**이다. 새 파일 만들 위치를 결정할 때 이 문서를 참조한다.

## apps/admin

Next.js App Router 기반. 라우트 그룹으로 Shell(보호) / Public 영역을 분리하고, 공통 컴포넌트는 `components/`, 기능별 슬라이스는 `features/`에, 네비게이션·Query Key 등 공용 유틸은 `lib/<topic>/`에 둔다.

```
apps/admin/src/
├── app/                     # App Router — 라우팅 파일만 (page/layout/route/proxy)
│   ├── page.tsx             # 루트 진입점 (예: redirect("/dashboard"))
│   ├── layout.tsx           # 최상위 RootLayout (폰트·Provider만)
│   ├── proxy.ts             # Next.js 16 컨벤션 (middleware.ts 대체)
│   ├── (app)/               # Shell 라우트 그룹 (사이드바+헤더+메인이 얹힘, auth() 가드 hook point)
│   │   ├── layout.tsx       # Shell 조립 + TODO(auth) 위치
│   │   └── <segment>/page.tsx
│   ├── (public)/            # 공개 라우트 그룹 (로그인·에러·공개 페이지 — Shell 미적용)
│   │   └── <segment>/page.tsx
│   └── api/                 # BFF Route Handler
│       └── [...proxy]/route.ts   # 세션 → Bearer 변환
├── components/              # 공통 컴포넌트 (도메인 비종속)
│   ├── ui/                  # shadcn — kebab-case 파일명 (CLI 기본값)
│   │   ├── button.tsx
│   │   └── dropdown-menu.tsx
│   ├── layout/              # 헤더/사이드바/셸 — PascalCase
│   │   ├── Sidebar.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── Header.tsx
│   │   └── SearchInput.tsx
│   └── providers/
│       └── QueryProvider.tsx
├── features/                # 기능별 슬라이스 (도메인별 폴더)
│   └── <domain>/
│       ├── api.ts           # 해당 도메인 fetcher 호출 (kebab)
│       ├── queries.ts       # useQuery/useMutation + Query Key Factory (kebab)
│       ├── components/      # 이 도메인 전용 컴포넌트 (PascalCase)
│       │   ├── LoginForm.tsx
│       │   └── UserMenu.tsx
│       ├── store.ts         # Zustand (필요 시)
│       └── types.ts
└── lib/                     # 공용 유틸 (전부 kebab)
    ├── api.ts               # 클라이언트 fetcher (credentials: include, baseURL /api)
    ├── api-server.ts        # 서버 fetcher (server-only + auth())
    ├── get-query-client.ts  # QueryClient 팩토리 (서버 요청마다 새로 / 브라우저 싱글톤)
    ├── navigation/          # 네비게이션 유틸 (menu-config, is-menu-active 등)
    ├── query-keys/          # Query Key Factory 모음
    └── utils.ts             # cn helper (clsx + tailwind-merge)
```

### 라우트 그룹 컨벤션

- **`(app)/`** — Shell(사이드바 + 헤더 + 메인)이 얹히는 **인증 필요 일반 콘솔 전체**. `(app)/layout.tsx`에 `auth()` 가드 hook point. 세션 의미를 암시하는 `(auth)` 대신 중립명 `(app)` 사용 — 로그인 화면 자체가 이 그룹에 포함되지 않음을 분명히 하려는 의도.
- **`(public)/`** — 로그인·에러·약관 등 Shell 미적용 공개 페이지. 세션 불필요.
- **`(app)/` vs `(public)/` 결정 기준**: "Shell이 보여야 하는가?" — 그렇다면 `(app)/`, 아니면 `(public)/`.

### 규칙

- `app/` 하위에는 **라우팅 파일만** 둔다: `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, `not-found.tsx`, `error.tsx`, `loading.tsx` 등 Next.js 컨벤션 파일. 그 외 컴포넌트·유틸은 `components/` 또는 `features/<domain>/`으로.
- `features/<domain>/`은 자족적이어야 한다. 다른 feature를 import하지 않는다 (공유 필요하면 `components/` 또는 `lib/`로 승격).
- `components/`는 도메인 비종속 공통 UI만. 특정 도메인에 종속된 컴포넌트는 `features/<domain>/components/`에.
- `lib/<topic>/`은 **도메인 비종속 공용 유틸**을 topic별 폴더로 묶는다 (예: `lib/navigation/`, `lib/query-keys/`). 특정 feature 전용 유틸은 `features/<domain>/`에.
- Next.js 16에서 `middleware.ts`는 deprecated → **`proxy.ts`** 사용.

### 파일명 casing (CLAUDE.md §코드 컨벤션 참조)

| 파일 유형 | casing | 예 |
| --- | --- | --- |
| React 컴포넌트 `.tsx` | PascalCase | `LoginForm.tsx`, `Header.tsx` |
| shadcn `components/ui/*` | kebab-case (예외) | `dropdown-menu.tsx` |
| 유틸·서버·타입 `.ts` | kebab-case | `api-server.ts`, `callback-url.ts` |
| 테스트 | 대상 이름 그대로 + `.test.tsx`/`.test.ts` | `LoginForm.test.tsx` |
| Next.js 라우팅 | Next.js 규약(소문자) | `page.tsx`, `proxy.ts` |

### Export (CLAUDE.md §코드 컨벤션 참조)

- `page.tsx`, `layout.tsx`: **default export** (Next.js 강제)
- 그 외 모든 컴포넌트·유틸: **named export**

## apps/api

- `src/<domain>/` — 도메인 모듈 (controller/service/dto)
- `src/auth/` — Keycloak Strategy, Guard
- `src/rbac/` — Role/Permission/Menu, `@RequirePermission` 데코레이터
- `src/prisma/` — Prisma module, client 싱글톤
