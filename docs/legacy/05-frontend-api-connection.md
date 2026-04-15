# 05. Admin 프론트엔드 ↔ API 백엔드 연동

## 개요

Next.js admin 앱에서 NestJS API를 호출하여 게시글 목록을 표시한다.
공유 타입 패키지(`@monorepo/types`)를 통해 프론트와 백엔드가 같은 타입을 사용한다.

---

## 전체 흐름

```
admin (Next.js:3000) → fetch → api (NestJS:4000) → Prisma → PostgreSQL(:5432)
```

---

## CORS 설정

### 왜 필요한가?

admin(localhost:3000)에서 api(localhost:4000)를 호출하면 **다른 포트 = 다른 출처(origin)**.
브라우저는 보안상 다른 출처의 API 호출을 기본적으로 차단한다 (Same-Origin Policy).
`enableCors()`를 해야 다른 출처에서의 요청을 허용한다.

### apps/api/src/main.ts

```ts
const app = await NestFactory.create(AppModule);
app.enableCors();  // 다른 출처(admin:3000)에서의 API 호출 허용
```

실무에서는 `app.enableCors({ origin: 'https://admin.example.com' })` 처럼 허용할 출처를 명시한다.

---

## 공유 타입에 Post 추가

### packages/types/src/index.ts

```ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}
```

프론트에서 API 응답을 받을 때 `Post` 타입을 쓰면:
- 자동완성이 됨 (`post.titl` → `post.title`)
- 오타나 잘못된 필드 접근 시 컴파일 에러
- 백엔드가 필드를 바꾸면 타입도 바꿔야 하니까 프론트에서 바로 감지

---

## Server Component에서 데이터 페칭

### apps/admin/src/app/page.tsx

```tsx
import type { Post } from "@monorepo/types";

export default async function Home() {
  const posts: Post[] = await fetch("http://localhost:4000/post", {
    cache: "no-store",
  }).then((res) => res.json());

  return (
    <main>
      <h1>자유게시판</h1>
      {posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
              <small>{post.author} | {new Date(post.createdAt).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

### 핵심 개념: Server Component

- `"use client"`가 없으면 기본이 **Server Component**
- Server Component는 **서버에서 실행**됨 → `async/await`로 바로 fetch 가능
- `useState`, `useEffect` 필요 없음. 데이터를 가져와서 바로 렌더링.
- 클라이언트(브라우저)에 JavaScript가 안 내려감 → 번들 사이즈 작음

### Server Component vs Client Component

| | Server Component | Client Component |
|---|---|---|
| 선언 | 기본값 (아무것도 안 붙임) | `"use client"` 파일 상단에 추가 |
| 실행 위치 | 서버 | 브라우저 |
| 데이터 페칭 | `async/await`로 직접 | `useEffect` + `useState` |
| 이벤트 핸들러 | 사용 불가 (`onClick` 등) | 사용 가능 |
| 용도 | 데이터 조회, 목록 표시 | 폼 입력, 버튼 클릭, 상태 관리 |

### cache: "no-store"

```ts
fetch("http://localhost:4000/post", { cache: "no-store" })
```

Next.js는 기본적으로 fetch 결과를 **캐싱**한다. 게시글이 추가/수정되어도 캐시된 데이터를 보여줌.
`cache: "no-store"`를 넣으면 매번 최신 데이터를 가져온다.

---

## 공유 타입의 가치

타입 없이:
```tsx
// 프론트
const posts = await fetch("/post").then(res => res.json());
posts[0].titel  // 오타인데 런타임에서야 발견
```

공유 타입 사용:
```tsx
// 프론트
const posts: Post[] = await fetch("/post").then(res => res.json());
posts[0].titel  // 컴파일 에러! "titel"은 Post에 없음
```

모노레포 + 공유 타입 패키지의 핵심 가치는 **프론트-백엔드 간 타입 불일치를 빌드 타임에 잡는 것**.

---

## 현재 완성된 구조

```
monorepo-project/
├── docker-compose.yml         # PostgreSQL
├── apps/
│   ├── admin/                 # Next.js (포트 3000)
│   │   └── src/app/page.tsx   # API 호출 → 게시글 목록 표시
│   └── api/                   # NestJS (포트 4000)
│       └── src/
│           ├── post/          # 자유게시판 CRUD
│           └── prisma/        # DB 연결
└── packages/
    ├── types/                 # Post, User, ApiResponse 공유 타입
    └── ui/                    # 공유 UI 컴포넌트
```
