# 09. 프론트엔드 아키텍처 및 CRUD 구현

## 개요

Next.js App Router 기반 어드민 프론트엔드 구현.
Feature 기반 폴더 구조, TanStack Query + Zustand + react-hook-form + zod 조합으로
실무 패턴의 로그인 → 인증 → 게시판 CRUD를 구현한다.

---

## 사용 라이브러리

| 라이브러리 | 역할 |
|-----------|------|
| **TanStack Query** | API 데이터 페칭, 캐싱, 로딩/에러 상태 관리 |
| **Zustand** | 전역 상태 관리 (로그인 유저 정보 등) |
| **react-hook-form** | 폼 상태 관리 |
| **zod** | 유효성 검증 스키마 정의 |
| **@hookform/resolvers** | zod와 react-hook-form 연결 |
| **shadcn/ui** | UI 컴포넌트 (Radix + Tailwind 기반) |

---

## 폴더 구조

```
src/
├── app/                          # 라우팅만
│   ├── layout.tsx                # 루트 레이아웃 (Providers, 폰트)
│   ├── globals.css
│   ├── (public)/                 # 헤더 없는 라우트 그룹
│   │   └── login/
│   │       └── page.tsx
│   └── (auth)/                   # 헤더 있는 라우트 그룹
│       ├── layout.tsx            # Header 포함
│       ├── page.tsx              # / (대시보드)
│       └── post/
│           ├── page.tsx          # /post (목록)
│           ├── new/
│           │   └── page.tsx      # /post/new (작성)
│           └── [id]/
│               ├── page.tsx      # /post/1 (상세)
│               └── edit/
│                   └── page.tsx  # /post/1/edit (수정)
├── components/                   # 공통 컴포넌트
│   ├── Header.tsx
│   ├── Providers.tsx
│   └── ui/                       # shadcn 컴포넌트
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── card.tsx
├── features/                     # 도메인별 (Feature 기반)
│   ├── auth/
│   │   ├── api/index.ts          # API 호출 함수
│   │   ├── components/           # UI 컴포넌트
│   │   │   └── LoginForm.tsx
│   │   ├── queries/index.ts      # TanStack Query hooks
│   │   ├── store/index.ts        # Zustand 스토어
│   │   └── types/index.ts        # 타입 정의
│   └── post/
│       ├── api/index.ts
│       ├── components/
│       │   ├── PostList.tsx
│       │   ├── PostDetail.tsx
│       │   ├── PostForm.tsx
│       │   └── PostEditForm.tsx
│       ├── queries/index.ts
│       ├── store/
│       └── types/index.ts
├── lib/                          # 공통 유틸
│   ├── api.ts                    # fetch 인스턴스
│   └── utils.ts                  # shadcn cn 유틸
├── hooks/                        # 공통 hooks
└── store/                        # 공통 스토어
```

### 폴더 구조 설계 원칙

| 원칙 | 적용 |
|------|------|
| **응집도** | 도메인에 필요한 것이 한 폴더에 모여있음. post 관련 코드는 features/post/에만 있음. |
| **관심사 분리** | api/components/queries/store가 역할별로 나뉨 |
| **독립성** | post 도메인을 삭제해도 다른 도메인에 영향 없음 |
| **확장성** | 새 도메인 추가 시 폴더만 복사해서 구조 잡으면 됨 |

---

## Route Group

괄호 `()`로 감싼 폴더는 **URL에 안 나오고** 레이아웃을 그룹별로 다르게 적용할 수 있다.

```
(public)/login/page.tsx  →  URL: /login     (헤더 없음)
(auth)/page.tsx          →  URL: /           (헤더 있음)
(auth)/post/page.tsx     →  URL: /post       (헤더 있음)
```

- `(public)` — 로그인 페이지 등 인증 불필요한 페이지. 헤더 없음.
- `(auth)` — 인증 필요한 페이지. layout.tsx에서 Header 포함.

---

## 인증 흐름 (프론트엔드)

### proxy.ts (Next.js 16)

Next.js 16에서 middleware.ts가 deprecated되고 proxy.ts로 변경됨.

```ts
export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // 토큰 없이 보호된 페이지 접근 → /login으로 리다이렉트
  // 토큰 있고 /login 접근 → /로 리다이렉트
}
```

- 모든 요청이 이 함수를 거침 (서버에서 실행)
- 쿠키에서 토큰을 확인해서 인증 여부 판단
- 파일 위치: `src/proxy.ts` (app 폴더 안이 아님)

### 로그인 → 토큰 저장 → API 요청

```
1. LoginForm에서 이메일/비밀번호 입력
2. useMutation으로 /auth/login API 호출
3. 성공 시:
   - Zustand에 token + user 저장 (클라이언트 상태)
   - document.cookie에 token 저장 (proxy에서 읽기 위해)
   - / 페이지로 이동
4. 이후 API 요청 시:
   - fetchApi가 쿠키에서 토큰을 자동으로 가져와서 Authorization 헤더에 첨부
```

### 로그아웃

```
1. Zustand 상태 초기화 (token, user = null)
2. 쿠키 삭제 (max-age=0)
3. /login으로 이동
```

---

## 공통 API 인스턴스

### lib/api.ts

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? match[1] : null;
}

export async function fetchApi(endpoint: string, options?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API 요청 실패");
  }

  return res.json();
}
```

- 모든 API 호출의 공통 설정 (base URL, 토큰, 에러 처리)
- 쿠키에서 토큰을 자동으로 가져와서 헤더에 첨부
- 각 도메인 API에서 토큰을 직접 넘길 필요 없음
- `NEXT_PUBLIC_` 접두사: 클라이언트(브라우저)에서 접근 가능한 환경변수

---

## TanStack Query 패턴

### 조회 (useQuery)

```ts
export function usePosts() {
  return useQuery({
    queryKey: ["posts"],     // 캐시 키
    queryFn: getPostsApi,    // API 호출 함수
  });
}
```

- `queryKey` — 캐시 키. 같은 키면 같은 데이터를 공유.
- 로딩/에러/성공 상태를 자동 관리.
- 캐시된 데이터가 있으면 즉시 보여주고 백그라운드에서 리페치.

### 변경 (useMutation)

```ts
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createPostApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
```

- `mutationFn` — 생성/수정/삭제 API 호출.
- `invalidateQueries` — 변경 후 목록을 자동 리페치. 캐시를 무효화해서 최신 데이터를 다시 가져옴.
- `isPending`, `isError` 등 상태를 자동 제공.

### 컴포넌트에서 사용

```tsx
const { data: posts, isLoading, isError } = usePosts();
const createMutation = useCreatePost();

// 조회
if (isLoading) return <p>로딩 중...</p>;

// 변경
createMutation.mutate(data, {
  onSuccess: () => router.push("/post"),
});
```

---

## Zustand 패턴

```ts
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => {
    document.cookie = "token=; path=/; max-age=0";
    set({ token: null, user: null });
  },
}));
```

- `create`로 스토어 생성. Redux보다 훨씬 간결.
- `set`으로 상태 변경. 구독 중인 컴포넌트가 자동 리렌더.
- 컴포넌트에서 `useAuthStore((state) => state.user)`로 필요한 것만 구독.

---

## react-hook-form + zod 패턴

### 스키마 정의 (zod)

```ts
const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
```

- `z.infer` — 스키마에서 TypeScript 타입을 자동 추출. 타입을 따로 정의할 필요 없음.

### 폼 사용

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
});
```

- `register("email")` — input에 연결. onChange, value 자동 관리.
- `handleSubmit` — 제출 시 zod 검증 → 통과하면 onSubmit 호출.
- `errors.email?.message` — 검증 실패 메시지 자동 제공.
- `zodResolver` — zod 스키마를 react-hook-form의 검증기로 연결.

---

## shadcn/ui

Radix UI + Tailwind CSS 기반 컴포넌트 라이브러리.

특징:
- 코드가 프로젝트에 복사됨 (`components/ui/`). 직접 수정 가능.
- npm 패키지가 아니라 복붙 방식. 번들 사이즈 최소.
- 내부적으로 Radix UI 사용 (접근성, 키보드 지원 기본 제공).

설치:
```bash
pnpm dlx shadcn@latest init         # 초기화
pnpm dlx shadcn@latest add button   # 컴포넌트 추가
```

---

## Server Component vs Client Component

| | Server Component | Client Component |
|---|---|---|
| 선언 | 기본값 (아무것도 안 붙임) | `"use client"` 파일 상단에 추가 |
| 실행 위치 | 서버 | 브라우저 |
| 사용 가능 | async/await, DB 접근 | useState, onClick, useForm 등 |
| 용도 | 페이지 레이아웃, 데이터 조회 | 폼, 버튼, 상태 관리 |

현재 프로젝트 적용:
- `app/` 안의 page.tsx, layout.tsx → **Server Component** (라우팅만)
- `features/` 안의 컴포넌트 → **Client Component** (useForm, useMutation 등 사용)

page.tsx는 Server Component로 두고, 실제 UI는 features의 Client Component를 import해서 사용하는 패턴.

```tsx
// app/(auth)/post/page.tsx (Server Component)
import PostList from "@/features/post/components/PostList";  // Client Component

export default function PostPage() {
  return <PostList />;
}
```

---

## 현재 구현된 라우팅

| URL | 페이지 | 인증 |
|-----|--------|------|
| `/login` | 로그인 | 불필요 |
| `/` | 대시보드 | 필요 |
| `/post` | 게시글 목록 | 필요 |
| `/post/new` | 게시글 작성 | 필요 |
| `/post/[id]` | 게시글 상세 | 필요 |
| `/post/[id]/edit` | 게시글 수정 | 필요 |
