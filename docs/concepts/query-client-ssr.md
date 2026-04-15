# QueryClient: 서버 per-request vs 브라우저 singleton

## 한 줄 정의

TanStack Query의 `QueryClient`를 **서버에서는 요청마다 새로** 만들고 **브라우저에서는 한 번만** 만들어 재사용하는 팩토리 패턴.

## 왜 필요한가

### 서버에서 싱글톤을 쓰면 벌어지는 사고

Node.js 프로세스 하나가 여러 요청을 처리한다. 서버용 `QueryClient`를 모듈 top-level에 한 번만 만들면:

```ts
// ❌ 위험한 예
const serverClient = new QueryClient();  // 모듈 로드 시 1회 생성, 이후 모든 요청 공유

export async function Page() {
  await serverClient.prefetchQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,  // 세션마다 다른 유저 반환
  });
  return <HydrationBoundary state={dehydrate(serverClient)}>...</HydrationBoundary>;
}
```

사용자 A의 요청이 `me` 쿼리를 캐시에 채움 → 1초 뒤 사용자 B의 요청이 같은 프로세스에 떨어짐 → B가 A의 유저 정보를 보게 됨. **데이터 유출.**

### 브라우저에서 새 인스턴스를 쓰면 생기는 문제

매 렌더마다 `new QueryClient()`를 만들면:

1. **캐시가 계속 초기화됨** — 페이지 이동할 때마다 첫 로드처럼 로딩 스피너가 뜸
2. **SSR hydration 깨짐** — 서버에서 prefetch한 데이터를 hydrate했는데, 다음 렌더에서 QueryClient가 바뀌면 cache가 빈 상태로 돌아감
3. **구독 끊김** — `useQuery`가 구독 중인 cache가 사라져 React가 무한 suspend

### 답: 환경 기반 분기

```ts
function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}

let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();  // 매 요청 새로
  browserClient ??= makeQueryClient();      // 브라우저는 한 번만
  return browserClient;
}
```

- **서버**: `isServer === true` → 항상 새 인스턴스. 요청 끝나면 GC.
- **브라우저**: `browserClient`가 `undefined`일 때만 생성, 이후 재사용.

### `pending` 쿼리 dehydrate

```ts
dehydrate: {
  shouldDehydrateQuery: (query) =>
    defaultShouldDehydrateQuery(query) || query.state.status === "pending",
},
```

기본값은 **성공한** 쿼리만 직렬화해 브라우저로 보낸다. `status: "pending"` 쿼리는 제외 → Server Component가 "await하지 않고 `prefetchQuery`로 시작만 해뒀다" 같은 스트리밍 prefetch 시나리오에서 브라우저가 다시 fetch하게 됨.

`pending` 쿼리도 dehydrate하면 브라우저가 **서버가 시작한 fetch를 이어받음** — Suspense가 서버→클라 경계를 매끄럽게 연결.

## 표준 근거

- **TanStack Query 공식 SSR 가이드** — [Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)에 이 패턴이 거의 그대로 들어있음. 우리 구현은 공식 예제의 축약.
- **Next.js 공식 예제** — `with-react-query` 포함 다수 레포가 동일 패턴 사용.

## 우리 구조에서 어디에

| 파일 | 역할 |
|---|---|
| `apps/admin/src/lib/get-query-client.ts` | 팩토리. `getQueryClient()`로 어디서든 호출 |
| `apps/admin/src/components/providers/query-provider.tsx` | 클라이언트 루트에서 `QueryClientProvider`로 래핑 |
| `apps/admin/src/app/layout.tsx` | `<QueryProvider>`로 전체 트리 감쌈 |

## 사용 패턴

### 클라이언트 컴포넌트

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { noticeKeys } from "@/features/notice/queries/keys";

export function NoticeList() {
  const { data } = useQuery({
    queryKey: noticeKeys.list({}),
    queryFn: () => apiFetch("/notices"),
  });
  // ...
}
```

### 서버 컴포넌트 (prefetch + hydrate)

```tsx
// Server Component
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { apiServerFetch } from "@/lib/api-server";
import { noticeKeys } from "@/features/notice/queries/keys";
import { NoticeList } from "./notice-list";  // client component

export default async function NoticePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: noticeKeys.list({}),
    queryFn: () => apiServerFetch("/notices"),
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NoticeList />
    </HydrationBoundary>
  );
}
```

**핵심 포인트**:
- 서버는 `apiServerFetch` (`lib/api-server.ts`)로 BFF 거치지 않고 API 직접 호출
- 브라우저는 `apiFetch` (`lib/api.ts`)로 BFF(`/api/*`) 경유
- **queryKey는 양쪽에서 동일** (Query Key Factory로 보장) → SSR hydration이 클라 쿼리와 정확히 매칭

## SSR 없이 클라 전용으로 쓰는 경우

단순 SPA처럼 쓰려면 Server Component에서 prefetch 안 하면 됨. 클라 쿼리는 browser singleton에 그대로 쌓임. SSR hydration이 없을 뿐 다른 설정 변경 없음.

## 대안과 trade-off

| 방식 | 장점 | 단점 |
|---|---|---|
| **팩토리 (우리 선택)** | 표준 패턴, SSR+CSR 모두 안전 | 파일 한 개 추가 |
| 프로바이더에서 `useState(() => new QueryClient())` | 한 곳에서 결정 | SSR prefetch(Server Component)에서는 provider 밖이라 접근 불가 |
| 서버 싱글톤 | 구현 가장 쉬움 | **데이터 유출 위험 — 프로덕션 금지** |
| 매 렌더 `new QueryClient()` | 캐시가 "깨끗" | 캐시 이점 전부 상실, hydration 깨짐 |

## 참고 자료

- [TanStack Query — Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [TanStack Query — SSR Overview](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [TkDodo — React Query and React Server Components](https://tkdodo.eu/blog/react-query-and-react-server-components)
