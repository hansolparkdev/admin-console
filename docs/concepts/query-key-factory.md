# Query Key Factory

## 한 줄 정의

TanStack Query의 모든 query key를 **도메인별 팩토리 객체**에서만 생성해, 문자열 리터럴 키 사용을 금지하는 관례.

## 왜 필요한가

### 문자열 리터럴 키가 깨지는 이유

```ts
// 공지 목록 페이지
useQuery({ queryKey: ["notices"], queryFn: getNotices });

// 공지 상세 페이지
useQuery({ queryKey: ["notice", id], queryFn: () => getNotice(id) });

// 공지 작성 후 invalidate
queryClient.invalidateQueries({ queryKey: ["notices"] });
queryClient.invalidateQueries({ queryKey: ["notice"] });  // ← 상세 목록 일괄 무효화 의도
```

1. **오타 — 타입이 안 잡힘**
   `["notcies"]`로 적어도 TS는 통과. 런타임에 "왜 invalidate가 안 되지?"로 드러남.

2. **계층 구조가 흐트러짐**
   `["notice", id]` vs `["notice-detail", id]` 처럼 같은 도메인인데 개발자마다 표기가 엇갈려 invalidation이 부분적으로만 걸림.

3. **invalidate 전략 추론 불가**
   전체 notice 캐시를 무효화하려면 키가 `["notice", ...]` 접두로 통일돼있어야 함. 문자열 리터럴로는 강제할 수 없음.

4. **TS 타입 추론 포기**
   `queryKey: any[]` 수준으로 쓰게 되어 filter(`partialKey`) 같은 고급 기능도 안전성 없이 사용.

### Factory로 해결

```ts
// src/features/notice/queries/keys.ts
export const noticeKeys = {
  all: ["notice"] as const,
  lists: () => [...noticeKeys.all, "list"] as const,
  list: (filters: NoticeFilters) => [...noticeKeys.lists(), filters] as const,
  details: () => [...noticeKeys.all, "detail"] as const,
  detail: (id: number) => [...noticeKeys.details(), id] as const,
};
```

사용:
```ts
useQuery({
  queryKey: noticeKeys.list({ category: "event" }),
  queryFn: () => getNotices({ category: "event" }),
});

useQuery({
  queryKey: noticeKeys.detail(42),
  queryFn: () => getNotice(42),
});

// 공지 하나 수정 → 목록 + 상세 모두 fresh 처리
await createNotice(dto);
queryClient.invalidateQueries({ queryKey: noticeKeys.all });
// 또는 범위 좁게
queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
```

**이점**:
- 오타 = 컴파일 에러
- `noticeKeys.all` 한 줄로 도메인 전체 캐시 무효화
- `noticeKeys.lists()` 하나로 모든 필터 조합의 리스트만 무효화 (상세는 보존)
- IDE 자동완성
- `queryKey`의 타입이 `readonly [...]`로 정확히 추론

## 표준 근거

- **TanStack Query 공식 문서** — "Effective Query Keys" 가이드가 이 패턴을 직접 권장.
- **TkDodo's blog** (TanStack Query 메인테이너) — [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys) 이 패턴의 표준 레퍼런스.
- **`@lukemorales/query-key-factory` 라이브러리** — 이 관례를 타입 헬퍼로 감싼 오픈소스. 쓸지 안 쓸지 선택.

## 우리 구조에서 어디에

이번 Step 8은 BFF 골격만 깔았고 팩토리는 아직 없음. **각 도메인 슬라이스에서** 다음 파일을 만든다:

```
apps/admin/src/features/<domain>/queries/keys.ts
```

예:
```
apps/admin/src/features/notice/queries/keys.ts    → noticeKeys
apps/admin/src/features/iam/admin/queries/keys.ts → adminKeys
apps/admin/src/features/schedule/queries/keys.ts  → scheduleKeys
```

CLAUDE.md §핵심 폴더 규칙(`src/features/<domain>/`)에 `queries/` 하위 폴더가 이미 명시됨.

## 관례

### 계층 구조

| 키 | 용도 |
|---|---|
| `<domain>Keys.all` | 도메인 전체 (invalidate all, 가장 넓은 범위) |
| `<domain>Keys.lists()` | 모든 목록 쿼리 (필터 무관) |
| `<domain>Keys.list(filters)` | 특정 필터 조합의 목록 |
| `<domain>Keys.details()` | 모든 상세 쿼리 |
| `<domain>Keys.detail(id)` | 특정 id의 상세 |
| `<domain>Keys.infinite(...)` | infinite query인 경우 |

### `as const`

`["notice"] as const` 하면 `readonly ["notice"]` 로 리터럴 타입이 고정 → `useQuery`가 key 타입을 정확히 좁혀 추론할 수 있음.

### 파일 위치는 feature 내부

글로벌 `src/lib/query-keys.ts` 한 파일에 몰지 말 것. 도메인 추가할 때마다 공용 파일이 비대해지고 coupling 발생.

### 한 도메인이 다른 도메인 키 참조 금지

`noticeKeys.ts`에서 `iamKeys`를 `import`하는 건 설계 smell. 해당 도메인 features 폴더끼리 의존 형성은 가능한 한 피함.

## CLAUDE.md 연결

금지 패턴:
- ❌ 문자열 리터럴 Query Key (`useQuery({ queryKey: ['notices'] })`) — Query Key Factory 강제

## 대안과 trade-off

| 방식 | 안전성 | 복잡도 | 적합한 곳 |
|---|---|---|---|
| **Factory 객체 (우리 선택)** | 높음 | 낮음 | 모든 프로덕션 앱 |
| `@lukemorales/query-key-factory` 라이브러리 | 높음 (+자동 파생 API) | 중간 (의존 추가) | 도메인 20+ 대형 앱 |
| 문자열 리터럴 | 낮음 | 낮음 (첫 코드 한 줄만 쉬움) | 해커톤·프로토타입 |
| Enum 기반 | 중간 | 중간 (key 확장 어려움) | 권장 안 함 |

## 참고 자료

- [TanStack Query — Effective Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TkDodo — Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [TkDodo — Leveraging the Query Function Context](https://tkdodo.eu/blog/leveraging-the-query-function-context)
- [@lukemorales/query-key-factory](https://github.com/lukemorales/query-key-factory)
