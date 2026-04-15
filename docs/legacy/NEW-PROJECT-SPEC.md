# AXIS — 프로젝트 설계 문서

> **axis** · 범용 운영 플랫폼 기반 (core + 비즈니스 모듈 확장형)
>
> 이 문서는 기존 `monorepo-project`를 버리고 새로 시작하는 프로젝트의 설계 명세입니다.
> 다른 세션/페이지에서 이 문서 하나만 보고도 작업을 재개할 수 있도록 자기완결적으로 작성됨.

작성일: 2026-04-14

---

## 0. 프로젝트 개요

### 이름 — `axis`

**의미**: 중심축. 기반(core)이면서 여러 모듈이 회전 확장되는 플랫폼.

**파생 패턴**:
```
axis              ← 이 프로젝트 (기반 플랫폼)
axis-mes          ← MES 비즈니스 확장
axis-vdi          ← VDI 비즈니스 확장
axis-<domain>     ← 다른 비즈니스
```

**패키지 스코프**: `@axis/admin`, `@axis/api`, `@axis/ui`, `@axis/types`

### 성격

```
┌─────────────────────────────────────────┐
│  axis (이 프로젝트) — 범용 기반 모듈      │
│  ├── IAM (역할/메뉴/관리자/권한)         │
│  ├── 공통 코드 관리                      │
│  ├── 프로필 관리                         │
│  ├── 공지사항                            │
│  ├── 일정 관리                           │
│  └── 대시보드 (시스템 사용 현황)          │
├─────────────────────────────────────────┤
│  axis-mes, axis-vdi, … (파생 프로젝트)   │
│  ↑ axis를 템플릿으로 시작해서             │
│    비즈니스 모듈 추가                     │
└─────────────────────────────────────────┘
```

### 목적 (우선순위)

1. **풀스택 실무 패턴 체득** — 프론트엔드+백엔드 흐름을 직접 설명할 수 있을 수준
2. **교육용 자료** — 타인에게 가르칠 수 있는 보편적 도메인
3. **재사용 가능한 기반** — 새 비즈니스 프로젝트의 출발점

---

## 1. 기본 원칙

1. **실무 프로덕션 기준**으로 처음부터 설계. "일단 단순하게 → 나중에 개선" 금지.
2. **학습 가치는 "왜 이 구조인지" 설명**으로 챙기고 코드는 실무 기준으로 작성.
3. 설계 판단 지점은 **선택지 제시 + 확정 후 진행**.
4. **도메인 중립성 유지** — 특정 비즈니스에 묶이는 코드가 axis 본체에 들어가지 않음.
5. **확장 지점 명확** — 비즈니스 모듈이 붙을 자리(메뉴/라우팅/권한/DB)가 구조적으로 열려있음.

---

## 2. 기술 스택 (확정)

| 영역 | 선택 | 이유 |
|------|------|------|
| **모노레포** | Turborepo + pnpm | 업계 표준, 가벼움 |
| **런타임** | Node 22 LTS | 안정성 |
| **프론트 프레임워크** | Next.js 16 App Router | JD 명시 |
| **언어** | TypeScript (strict) | JD 명시 |
| **UI** | React 19 + shadcn/ui + Radix + Tailwind 4 | 디자인 시스템 |
| **디자인 시스템** | `packages/ui` + Storybook | JD 명시 |
| **백엔드** | NestJS 11 | TS 공유 |
| **DB** | PostgreSQL 16 | Prisma 궁합 |
| **ORM** | Prisma 7 | 생태계 성숙 |
| **캐시** | Redis | SSE/알림 브로드캐스트 |
| **인증** | Auth.js v5 + Keycloak (OIDC) | JD 명시 |
| **세션** | httpOnly 쿠키 | 보안 기본 |
| **인가** | RBAC (Role/Permission/Menu) | JD 명시 |
| **서버 상태** | TanStack Query v5 | JD 명시 |
| **클라이언트 상태** | Zustand v5 | JD 명시 |
| **폼** | react-hook-form + zod v3 | 표준 |
| **차트** | Recharts | JD 명시 |
| **실시간** | SSE | JD 명시 |
| **API 타입** | OpenAPI → openapi-typescript | 자동 생성 |
| **코드 품질** | ESLint 9 + Prettier + Husky + lint-staged + commitlint + Changesets | 실무 표준 |
| **테스트** | Playwright (E2E) + Vitest + Testing Library + MSW | JD 명시 |
| **관측성** | Pino + @next/bundle-analyzer + Lighthouse CI | JD 명시 |
| **인프라** | Docker Compose + 앱별 Dockerfile | JD 명시 |
| **CI** | GitHub Actions | 일반 |

---

## 3. 모노레포 디렉토리 구조

```
axis/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── e2e.yml
│       └── lighthouse.yml
├── apps/
│   ├── admin/                    # 어드민 콘솔 (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/       # 인증 필요 (RBAC 적용)
│   │   │   │   │   ├── iam/      # 역할/메뉴/관리자/권한
│   │   │   │   │   ├── code/     # 공통 코드 관리
│   │   │   │   │   ├── profile/
│   │   │   │   │   ├── notice/
│   │   │   │   │   ├── schedule/
│   │   │   │   │   └── dashboard/
│   │   │   │   ├── (public)/
│   │   │   │   │   └── login/
│   │   │   │   └── api/          # BFF Route Handler
│   │   │   │       ├── auth/[...nextauth]/
│   │   │   │       └── [...proxy]/
│   │   │   ├── features/         # 도메인별 (api/components/queries/store/types)
│   │   │   │   ├── iam/
│   │   │   │   ├── code/
│   │   │   │   ├── profile/
│   │   │   │   ├── notice/
│   │   │   │   ├── schedule/
│   │   │   │   └── dashboard/
│   │   │   ├── components/
│   │   │   │   └── providers/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts               # 클라이언트 fetcher
│   │   │   │   ├── api-server.ts        # 서버 fetcher (server-only)
│   │   │   │   ├── get-query-client.ts
│   │   │   │   └── auth.ts              # Auth.js
│   │   │   ├── hooks/
│   │   │   │   └── use-permission.ts
│   │   │   └── middleware.ts
│   │   └── Dockerfile
│   └── api/                      # NestJS
│       ├── src/
│       │   ├── auth/             # Keycloak Strategy, Guard
│       │   ├── rbac/             # Role/Permission/Menu
│       │   ├── admin/            # 관리자
│       │   ├── code/             # 공통 코드
│       │   ├── profile/
│       │   ├── notice/
│       │   ├── schedule/
│       │   ├── dashboard/
│       │   └── prisma/
│       └── prisma/schema.prisma
├── packages/
│   ├── ui/                       # 디자인 시스템 + Storybook
│   ├── types/                    # 공유 타입
│   ├── api-client/               # OpenAPI 자동 생성
│   ├── config-eslint/
│   ├── config-tailwind/
│   └── config-ts/
├── docker/
│   └── docker-compose.yml        # postgres, keycloak, redis
├── docs/
│   ├── patterns/                 # 안티패턴 vs 정석 비교
│   ├── architecture/             # 아키텍처 결정 기록 (ADR)
│   └── phase/                    # Phase별 학습 문서
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── README.md                     # 프로젝트 소개 + 학습 가이드
```

---

## 4. 도메인 구성 (확정)

### 4.1 IAM (Identity & Access Management)

- **관리자 관리**: 계정 CRUD, 비활성화, 역할 할당
- **역할 관리**: Role 정의, Permission 매핑, 역할별 메뉴 접근 편집
- **메뉴 관리**: 트리 CRUD, 순서 조정, 권한 연결
- **권한 관리**: Permission 마스터 관리 (`post:write` 등 코드 기반)

**학습 포인트**:
- RBAC 패턴 B (Permission 엔티티 정규화)
- 복잡한 폼 (역할 할당 체크박스 트리)
- 트리 UI (메뉴 계층 편집, drag & drop 선택)
- 백엔드 Guard + Decorator (`@RequirePermission`)
- 프론트 권한 훅 + 메뉴 필터링

### 4.2 공통 코드 관리 (Code Management)

- **그룹 코드 / 코드 값**: dropdown이나 enum성 값을 DB로 관리
- 예: 상태 코드(USE_YN), 분류 코드(카테고리), 국가 코드 등

**학습 포인트**:
- Master/Detail 구조 (그룹 → 코드)
- 캐싱 전략 (자주 안 바뀌는 데이터 → staleTime 길게)
- 어드민이 관리하는 메타 데이터 개념

### 4.3 프로필 관리 (Profile)

- 내 계정 정보 조회/수정, 비밀번호 변경
- 프로필 이미지 업로드

**학습 포인트**:
- 파일 업로드 (presigned URL 패턴)
- `useMe` 훅 + Zustand 미러링 패턴
- 수정 후 전역 상태 갱신

### 4.4 공지사항 (Notice)

- 공지 CRUD + 목록/상세
- 첨부파일
- 게시 기간, 고정(pinned)

**학습 포인트**:
- 낙관적 업데이트 (고정 토글)
- Rich Text 에디터 (TipTap 또는 경량 대안)
- 파일 업로드 흐름
- 페이지네이션

### 4.5 일정 관리 (Schedule)

- 팀/개인 일정 등록, 수정, 삭제
- 월/주/일 달력 뷰
- (선택) 반복 일정, 참석자 지정

**학습 포인트**:
- 달력 컴포넌트 (자체 구현 or `react-big-calendar`)
- 날짜/시간 다루기 (`date-fns` / `dayjs`)
- 드래그 인터랙션 (일정 생성)
- 복합 폼 (시작-종료 시각, 반복 규칙)

### 4.6 대시보드 (Dashboard)

- KPI 카드 (관리자 수, 오늘 접속, 활성 공지, 다가오는 일정)
- 시계열 차트 (로그인 추이, 공지 작성 추이)
- 최근 활동 피드 (실시간 SSE)

**학습 포인트**:
- 여러 쿼리 동시 prefetch (`Promise.all`)
- Recharts 시계열/분포
- SSE 실시간 피드
- (선택) Grafana 임베딩 — 시스템 메트릭

---

## 5. 아키텍처 영역별 설계

### 5.1 인증 (Authentication) — Auth.js v5 + Keycloak

```ts
// apps/admin/src/lib/auth.ts
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,  // 서버 전용
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" },       // httpOnly 쿠키 JWE
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      if (Date.now() < (token.expiresAt as number) * 1000) return token;
      return await refreshAccessToken(token);   // 만료 시 갱신
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
```

**자동 처리**: PKCE, state, nonce, 토큰 수령/검증, httpOnly 쿠키 저장, refresh rotation.

**자체 구현**: `refreshAccessToken` (실패 시 세션 폐기), `middleware.ts` (라우트 보호).

### 5.2 인가 (Authorization) — RBAC

**Prisma 스키마 골격**:
```prisma
model Admin {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  name         String
  isSuperAdmin Boolean    @default(false)
  isActive     Boolean    @default(true)
  roles        AdminRole[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Role {
  id          Int              @id @default(autoincrement())
  code        String           @unique  // SUPER_ADMIN, OPERATOR, VIEWER
  name        String
  description String?
  admins      AdminRole[]
  permissions RolePermission[]
}

model Permission {
  id          Int              @id @default(autoincrement())
  code        String           @unique  // iam:admin:write, notice:read
  name        String
  description String?
  roles       RolePermission[]
  menus       Menu[]
}

model Menu {
  id                   Int         @id @default(autoincrement())
  code                 String      @unique
  name                 String
  path                 String?
  icon                 String?
  order                Int         @default(0)
  parentId             Int?
  parent               Menu?       @relation("MenuTree", fields: [parentId], references: [id])
  children             Menu[]      @relation("MenuTree")
  requiredPermission   Permission? @relation(fields: [requiredPermissionId], references: [id])
  requiredPermissionId Int?
}

model AdminRole {
  adminId Int
  roleId  Int
  admin   Admin @relation(fields: [adminId], references: [id])
  role    Role  @relation(fields: [roleId], references: [id])
  @@id([adminId, roleId])
}

model RolePermission {
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}
```

**NestJS Guard + Decorator**:
```ts
@RequirePermission("notice:write")
@UseGuards(AuthGuard, PermissionGuard)
@Post()
create(@Body() dto: CreateNoticeDto) { ... }

// PermissionGuard
canActivate(ctx) {
  const required = this.reflector.get<string>("permission", ctx.getHandler());
  const { user } = ctx.switchToHttp().getRequest();
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(required);
}
```

**프론트 권한 체크**:
```tsx
// 훅
const canWrite = useHasPermission("notice:write");

// 선언적
<IfPermission code="notice:write">
  <Button>작성</Button>
</IfPermission>

// 메뉴는 requiredPermission 기준 자동 필터링
```

**`/auth/me` 응답**:
```json
{
  "id": 1, "email": "admin@axis.dev", "name": "관리자",
  "isSuperAdmin": false,
  "roles": [{ "code": "OPERATOR", "name": "운영자" }],
  "permissions": ["iam:admin:read", "notice:write", ...],
  "menus": [ /* 권한 필터링된 트리 */ ]
}
```

### 5.3 데이터 아키텍처 — SSR prefetch + BFF

**BFF (Next.js Route Handler)**:
- 모든 API 호출은 `/api/*` (같은 도메인)
- Route Handler가 `auth()`로 세션 추출 → NestJS에 Bearer 전달
- 백엔드 URL(`API_URL`)은 **서버 전용 env** (NEXT_PUBLIC_ 없음)

```ts
// apps/admin/src/app/api/[...proxy]/route.ts
import { auth } from "@/lib/auth";

async function proxy(req: Request) {
  const session = await auth();
  if (!session?.accessToken) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");
  return fetch(`${process.env.API_URL}${path}${url.search}`, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
  });
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
```

**TanStack Query — Hydration 기본**:
```ts
// lib/get-query-client.ts
import { QueryClient, isServer, defaultShouldDehydrateQuery } from "@tanstack/react-query";

function make() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 },
      dehydrate: {
        shouldDehydrateQuery: (q) =>
          defaultShouldDehydrateQuery(q) || q.state.status === "pending",
      },
    },
  });
}
let browserClient: QueryClient | undefined;
export function getQueryClient() {
  if (isServer) return make();
  return (browserClient ??= make());
}
```

```tsx
// app/(auth)/notice/page.tsx (Server Component)
export default async function NoticePage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: noticeKeys.list({}),
      queryFn: () => getNoticesServerApi({}),
    }),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NoticeList />
    </HydrationBoundary>
  );
}
```

**Query Key Factory** (강제):
```ts
export const noticeKeys = {
  all: ["notice"] as const,
  lists: () => [...noticeKeys.all, "list"] as const,
  list: (filters: Filters) => [...noticeKeys.lists(), filters] as const,
  details: () => [...noticeKeys.all, "detail"] as const,
  detail: (id: number) => [...noticeKeys.details(), id] as const,
};
```

**API 레이어**:
- `lib/api.ts` — 클라 fetcher (baseURL: `/api`, `credentials: "include"`)
- `lib/api-server.ts` — 서버 fetcher (`server-only` + `auth()`)
- `features/*/api/index.ts` — 클라용
- `features/*/api/server.ts` — 서버 prefetch용 (GET만)

**Error Boundary + Suspense**:
```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Skeleton />}>
    <NoticeList />
  </Suspense>
</ErrorBoundary>
```

### 5.4 상태 관리 규칙

| 상태 | 도구 | 기준 |
|------|------|------|
| 서버 DB 데이터 (notice/admin/role 등) | TanStack Query | 원본이 서버 |
| 로그인 유저 정보 | `useMe()` + Zustand 미러 | 서버 원본 + 동기 편의 |
| UI 전역 (다크모드, 사이드바, 모달) | Zustand | 여러 컴포넌트 공유 |
| 한 컴포넌트 UI | useState | 지역 |
| 폼 입력 | react-hook-form + zod | 폼 전용 |
| 낙관적 업데이트 | `setQueryData` | 캐시 조작 |

### 5.5 디자인 시스템 (`packages/ui`)

- shadcn/ui 기반 + Tailwind 4
- CVA로 variant 관리
- Storybook MDX 문서화
- Hooks: `useMediaQuery`, `useDebounce`, `useDisclosure`
- Tokens: 색상/타이포/spacing을 CSS 변수로

**초기 컴포넌트**: Button, Input, Textarea, Select, Label, Card, Dialog, Sheet, Tabs, Table, Form, Toast, Badge, Alert, DropdownMenu, Calendar (일정용), TreeView (메뉴용)

### 5.6 관측성/품질

- **Pino** 구조화 로그 (양쪽 서버)
- **@next/bundle-analyzer** — `ANALYZE=true pnpm build`
- **Lighthouse CI** — PR마다
- **Playwright E2E** — 로그인 → 공지 CRUD → 권한 체크 → 로그아웃 시나리오
- **Vitest** — 훅/유틸
- **MSW** — Storybook + 테스트

---

## 6. 재사용 전략 (AXIS → 파생 프로젝트)

### 방식 1 — GitHub Template Repository ⭐ 기본 방식

```
axis 레포 설정 → "Template repository" 체크
    ↓
새 비즈니스 프로젝트 시작 시:
    "Use this template" → axis-mes 레포 생성
    ↓
axis-mes에서 apps/admin/src/app/(auth)/mes/ 추가
axis-mes에서 apps/api/src/mes/ 추가
axis-mes에서 prisma/schema.prisma에 MES 테이블 추가
axis-mes에서 메뉴 seed에 MES 항목 추가
```

- **장점**: 단순, 독립 진화, Git 히스토리 깨끗
- **단점**: axis 업그레이드가 자동 반영 안 됨 (필요 시 cherry-pick)

### 방식 2 — 같은 모노레포에 앱 추가 (조직 선호 시)

```
axis/
├── apps/
│   ├── admin/          (기반 — 진화)
│   ├── admin-mes/      (MES — admin 재사용 + 확장)
│   └── admin-vdi/
└── packages/           (공통 자산)
```

### 방식 3 — NPM 패키지 (사내 레지스트리)

```
@axis/ui, @axis/auth, @axis/rbac 를 Verdaccio/GitHub Packages에 배포
각 프로젝트 package.json에서 의존
```

→ **초기엔 방식 1, 성숙 후 방식 2/3으로 진화**.

### 파생 시 확장 지점 (설계에 반영됨)

| 영역 | 확장 방식 |
|------|-----------|
| **메뉴** | DB seed에 row 추가 → 자동 렌더 |
| **권한** | Permission 코드 추가 (`mes:production:write` 같은 네임스페이스) |
| **라우팅** | `app/(auth)/mes/` 디렉토리 추가 |
| **API** | NestJS 모듈 추가 (`src/mes/`) |
| **DB** | Prisma 스키마에 MES 모델 추가 (기존 core 테이블 그대로) |
| **UI 컴포넌트** | `packages/ui` 그대로 사용, 비즈니스 특화는 해당 프로젝트에 로컬 |

---

## 7. Phase별 로드맵 (학습 포인트 포함)

### Phase 0 — 기초 세팅 (반나절)
- 레포 생성, 모노레포 골격 (pnpm-workspace, turbo.json, tsconfig.base)
- `packages/config-*` 셋업 (eslint/prettier/tailwind/ts)
- Husky + lint-staged + commitlint + Changesets
- GitHub Actions: ci.yml
- docker-compose (postgres, keycloak, redis)
- `.env.example` + 타입 안전 env (`@t3-oss/env-nextjs`)

**학습 포인트**: 모노레포 workspace 동작 원리, Turborepo 캐시, 공통 설정 패키지화

### Phase 1 — 디자인 시스템 (반나절)
- `packages/ui` + shadcn
- Tailwind preset
- Storybook
- 기초 컴포넌트 15~20개

**학습 포인트**: CVA 패턴, 디자인 토큰 CSS 변수, Storybook MDX

### Phase 2 — NestJS + RBAC DB (1일)
- Prisma 셋업 (Prisma 7 adapter)
- RBAC 스키마 + 마이그레이션
- Seed: Role/Permission/Menu 기본 데이터
- OpenAPI (NestJS Swagger) 생성
- RBAC Guard + `@RequirePermission` 데코레이터

**학습 포인트**: 패턴 B RBAC, isSuperAdmin 우회, 권한 코드 네임스페이스

### Phase 3 — 인증 (Auth.js + Keycloak + BFF) (1일)
- Keycloak Client 설정 (Public Client + PKCE)
- Auth.js v5 + Keycloak Provider
- httpOnly 세션 + refresh rotation
- BFF Route Handler
- `/auth/me` 엔드포인트
- middleware.ts (경로 보호)

**학습 포인트**: OIDC 플로우, PKCE, httpOnly 쿠키 보안, BFF 패턴, refresh rotation

### Phase 4 — 프론트 아키텍처 기본 (1일)
- QueryClient 팩토리 + Providers
- Route Group `(public)` / `(auth)`
- HydrationBoundary 패턴
- ErrorBoundary + Suspense
- 권한 훅 (`useHasPermission`, `<IfPermission>`)
- 메뉴 컴포넌트 (권한 필터링 + 트리)
- API 레이어
- OpenAPI → openapi-typescript 파이프라인

**학습 포인트**: Server/Client Component 경계, SSR prefetch가 "데이터 전달"이 아닌 "캐시 공유"임, Query Key Factory

### Phase 5 — IAM 기능 (1~2일)
- 관리자 관리 (TanStack Table: 검색/필터/정렬/페이지네이션)
- 역할 관리 + 권한 매핑 UI
- 메뉴 관리 (트리 편집)

**학습 포인트**: 복잡한 테이블, 트리 UI, 복합 폼, 마스터 데이터 CRUD

### Phase 6 — 공통 코드 + 프로필 (1일)
- 공통 코드 (그룹/코드 CRUD)
- 프로필 관리 + 이미지 업로드

**학습 포인트**: 파일 업로드 (presigned URL), staleTime 전략, Zustand 미러링

### Phase 7 — 공지 + 일정 (2일)
- 공지사항 (CRUD + 낙관적 업데이트 + 파일)
- 일정 관리 (달력 + 복합 폼)

**학습 포인트**: 낙관적 업데이트, 날짜 다루기, 달력 컴포넌트, 드래그 인터랙션

### Phase 8 — 대시보드 + 실시간 (1~2일)
- KPI 카드 + Recharts 시계열
- SSE 실시간 활동 피드
- (선택) Grafana 임베딩

**학습 포인트**: Promise.all 병렬 prefetch, Recharts, SSE `EventSource` + queryClient.setQueryData, iframe 임베딩 시 인증 전달

### Phase 9 — 품질 (1일)
- Playwright E2E 3~5개 시나리오
- Vitest 단위 테스트
- MSW Storybook 통합
- Bundle analyze + Lighthouse
- Dockerfile (standalone build) + 프로덕션 docker-compose
- README 학습 가이드 작성

**학습 포인트**: 번들 분석, Lighthouse 수치 개선, 프로덕션 빌드

### Phase 10 — 재사용 준비 (반나절)
- GitHub Template Repository 설정
- README: "axis로 새 프로젝트 시작하는 법"
- `docs/architecture/ADR-*` 정리
- `docs/patterns/*` 안티패턴 vs 정석 문서

**학습 포인트**: 템플릿으로서의 완성도, 문서화

---

## 8. 교육 자료화 전략

### 8.1 `docs/patterns/` — 안티패턴 vs 정석

각 파일에 "이렇게 하면 X vs 이렇게 해야 O" 비교:
- `authentication.md` — localStorage vs httpOnly 쿠키
- `state-management.md` — 컴포넌트 useState vs TanStack Query
- `data-fetching.md` — fetch-on-render vs Hydration
- `rbac.md` — 프론트 체크만 vs 백엔드 Guard+프론트
- `optimistic-update.md` — await 후 setState vs setQueryData
- `error-handling.md` — try/catch 산재 vs Error Boundary 계층
- `forms.md` — useState 폼 vs react-hook-form+zod
- `query-keys.md` — 문자열 키 vs Query Key Factory

### 8.2 커밋 히스토리를 학습 흐름으로

- 기능별 PR 단위 커밋
- Conventional Commits (feat/fix/refactor/docs/chore)
- Phase 경계에 태그 (`v0.1-foundation`, `v0.2-design-system`, ...)

→ 교육 대상이 `git log`만 따라가도 흐름 이해 가능.

### 8.3 설명 주석 규칙

- 단순 기능 설명 X
- "왜 이렇게 하는가"를 한 줄
```ts
// Query Client를 서버에서는 요청마다 새로 만들어 유저 간 캐시 격리,
// 브라우저에서는 싱글톤으로 유지해 하이드레이션 일관성 보장.
export function getQueryClient() { ... }
```

### 8.4 README.md — 튜토리얼 역할

- 왜 이 프로젝트 / 뭘 배울 수 있는지
- Phase별 요약 + 학습 포인트
- 실행 방법 (`docker-compose up + pnpm dev`)
- "이 부분이 궁금하면 이 파일/커밋 보세요" 가이드
- axis를 템플릿으로 새 프로젝트 시작하는 법

---

## 9. 기존 프로젝트에서 이전할 자산

### 살릴 것 (axis 레포에 참고용 보관)
- `docs/01~09.md` → `axis/docs/legacy/`
- Keycloak Realm 설정 (docker로 다시 올리면 재사용)
- `.env` 값들 (민감 정보 재발급)
- UI 구조 (LoginForm 등 코드 패턴만 참고)

### 버릴 것
- 전체 소스 코드 (재작성)
- 자체 JWT 시스템 (Auth.js로 대체)
- 기존 `fetchApi`, `Providers.tsx`
- 기존 Prisma 스키마 (RBAC 포함해서 재설계)

---

## 10. JD 매핑 (42dot Agentic AI Platform)

### Responsibilities
| JD 항목 | 대응 |
|---------|------|
| Next.js 14+ App Router + TS | Phase 0+ |
| 대시보드 (Grafana + Recharts) | Phase 8 |
| RBAC 어드민 관리 | Phase 2, 5 |
| TanStack Query + Zustand | Phase 4 |
| RESTful + BFF | Phase 3, 4 |
| 회원/알림 도메인 UI | Phase 5~8 |
| SSE 실시간 | Phase 8 |
| OIDC/JWT 인증 | Phase 3 |
| 디자인 시스템 | Phase 1 |
| 빌드·배포 (Docker) | Phase 9 |

### Qualifications
- App Router + TS 프로덕션 ✅
- TanStack Query/Zustand ✅
- RESTful + 비동기 패칭 (낙관적 업데이트, Race Condition, Retry, Error 계층) ✅
- 복잡한 테이블/폼/필터 ✅ (Phase 5)
- 시각화 ✅ (Phase 8)
- SSR/CSR 혼합, 코드 스플리팅, 번들 최적화 ✅ (Phase 4, 9)

### Preferred
- Grafana 임베딩 ✅ (Phase 8)
- RBAC UI ✅ (Phase 5)
- SSE ✅ (Phase 8)
- OAuth 2.0/OIDC ✅ (Phase 3)
- 디자인 시스템 ✅ (Phase 1)
- Storybook ✅ (Phase 1)
- 모노레포 ✅
- Docker ✅
- E2E ✅ (Phase 9)

---

## 11. 이전 실무 프로젝트 레퍼런스

**경로**: `/Users/parkhansol/work/devel/uplex-dev/vdi-dev/usp-core-service/frontrend/usp-core-web-admin-module`

사용자가 실무에서 Keycloak OIDC를 직접 구현한 레퍼런스 (Vite + React SPA).

**참고 파일**:
- `src/auth/tokenRefresh.ts` — refresh token rotation, 동시 갱신 디바운싱
- `src/api/axiosInstance.ts` — interceptor 만료 선제 감지 + 자동 갱신
- `src/utils/tokenUtils.ts` — JWT 디코드 + 만료 체크
- `src/actions/auth/AuthActions.tsx` — id_token_hint 로그아웃 + Grafana 세션 연쇄 삭제
- `src/container/authentication/signin/signinbasic/signinbasic.tsx` — Authorization Request
- `src/container/main/index.tsx` — code → token 교환 (callback)

**한계 (axis로 이식 시 자동 해결)**:
- PKCE 없음 → Auth.js 자동 제공
- state/nonce 없음 → Auth.js 자동
- client_secret 브라우저 노출 → BFF 서버에만
- sessionStorage 토큰 → httpOnly 쿠키

---

## 12. 새 세션 시작 프롬프트 템플릿

```
AXIS 프로젝트를 이 설계 문서 기반으로 시작한다:
[이 문서 경로]

확정 사항:
- 프로젝트명: axis
- 성격: 범용 운영 플랫폼 기반 (core + 비즈니스 모듈 확장)
- 기술 스택: 문서 2절 참조
- 도메인: IAM / 공통코드 / 프로필 / 공지 / 일정 / 대시보드 (문서 4절)
- 재사용 전략: GitHub Template Repository (문서 6절)

Phase 0 — 기초 세팅부터 시작.
"일단 단순하게" 금지. 핵심 패턴은 처음부터 박는다.
막히는 판단 지점은 A/B/C 선택지로 먼저 질문.
```

---

## 13. 핵심 원칙 체크리스트

새 기능/파일 작성 전에:

- [ ] 이 코드가 프로덕션에 그대로 올라가도 괜찮은가?
- [ ] "나중에 개선" 식 임시 구현이 아닌가?
- [ ] 보안 베이스라인(httpOnly, CSRF, XSS) 지켜졌는가?
- [ ] 타입 안전성(TS strict + zod + OpenAPI)이 확보됐는가?
- [ ] 로딩/에러/빈 상태가 모두 처리됐는가?
- [ ] 캐시 무효화 전략이 명확한가? (Query Key Factory)
- [ ] 권한 체크(RBAC)가 필요한 API/UI에 적용됐는가?
- [ ] 반응형 + 접근성 기본 수준인가?
- [ ] 서버 코드가 `server-only` 처리됐는가?
- [ ] 도메인 중립인가? (특정 비즈니스에 묶이지 않았는가?)

---

## 14. 결정 로그

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-14 | 기존 `monorepo-project` 버리고 재시작 | 학습 단계 단순 구현 누적으로 아키텍처 어중간 |
| 2026-04-14 | 프로젝트명 **`axis`** | 중심축 의미, 짧음(4자), 파생 깔끔(`axis-mes` 등) |
| 2026-04-14 | 범용 플랫폼 성격 (core + 확장) | 이 프로젝트는 기반, 비즈니스는 파생 프로젝트 |
| 2026-04-14 | 재사용 전략 = GitHub Template Repository | 초기 단순성, 각 프로젝트 독립 진화 |
| 2026-04-14 | Auth.js v5 (자체 JWT 폐기) | OIDC/PKCE/refresh/BFF 한 번에 표준화 |
| 2026-04-14 | RBAC 패턴 B (Permission 엔티티) | 확장성 + `@RequirePermission` 선언적 체크 |
| 2026-04-14 | 메뉴 트리 (parentId) | 실무 어드민 표준 |
| 2026-04-14 | `isSuperAdmin` 플래그 방식 | Guard 로직 단순, 복구 수단 확보 |
| 2026-04-14 | SSR prefetch + HydrationBoundary 처음부터 | "로딩 중..." 없는 기본 UX |
| 2026-04-14 | BFF Route Handler 처음부터 | 토큰 httpOnly, 백엔드 URL 은닉 |
| 2026-04-14 | 디자인 시스템 + Storybook 처음부터 | JD 필수 |
| 2026-04-14 | Playwright E2E 조기 도입 | 리그레션 방지 + JD 매칭 |
| 2026-04-14 | 도메인: IAM/코드/프로필/공지/일정/대시보드 | 범용 core 기능, 비즈니스 중립 |

---

## 끝

이 문서를 axis 레포의 `docs/DESIGN-SPEC.md`로 옮긴 뒤 Phase 0부터 시작.
