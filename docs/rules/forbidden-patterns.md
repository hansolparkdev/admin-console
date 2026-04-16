# 금지 패턴

CLAUDE.md에는 카테고리별 1줄 요약만 있다. 실제 규칙·이유·대체안·예시는 이 문서가 단일 진실원이다.

**서브에이전트(`developer` / `reviewer` / `critic`)는 작업 착수 전에 이 파일을 Read로 반드시 읽는다.** 리뷰어는 개발자가 읽었다는 증거(리포트 내 명시)를 확인하지 못하면 PR을 차단한다.

---

## 1. 보안

### 1.1 토큰/세션을 `localStorage` / `sessionStorage`에 저장 금지

- **이유**: XSS 한 번이면 전부 유출. 쿠키는 `httpOnly`라 JS에서 접근 불가.
- **대체**: 세션 쿠키(`httpOnly`, `Secure`, `SameSite=Lax`). 토큰은 서버 세션에만.
- **대상 파일**: `apps/admin/src/**` 전부 (BFF 프록시가 쿠키 처리). 프론트에 토큰 노출 자체가 없음이 정답.

### 1.2 `NEXT_PUBLIC_API_URL` 같이 백엔드 URL을 브라우저에 노출 금지

- **이유**: 프론트는 항상 same-origin `/api/*`를 호출한다(BFF). 실제 API URL을 공개하면 CORS 우회·직접 호출 공격 표면 증가.
- **대체**: `API_URL`은 **서버 전용 env**. `apps/admin/src/app/api/[...proxy]/route.ts`에서만 읽는다.
- **체크**: `apps/admin/` 전체에서 `NEXT_PUBLIC_*API*` grep 0건.

### 1.3 RBAC 체크를 프론트만 하는 것 금지

- **이유**: 프론트 체크는 UX용. 진짜 가드는 백엔드에서만 유효.
- **대체**: 반드시 **백엔드 NestJS Guard + 프론트 UI 조건 렌더링** 양쪽. 프론트만 있는 권한 체크는 리뷰 reject.

### 1.4 비즈니스 로직(MES, VDI 등)을 `admin-console` 본체에 커밋 금지

- **이유**: 도메인 중립성 원칙. admin-console은 base platform. 특화 기능은 파생 프로젝트(`admin-mes` 등)에서.
- **대체**: 파생 레포 또는 별도 package에 배치. 본체 PR에 도메인 코드가 섞이면 차단.

### 1.5 `legacy/` 폴더 수정 금지

- **이유**: `docs/legacy/**`는 원본 설계 명세의 스냅샷. 변경되면 참조 근거가 흔들림.
- **대체**: 필요하면 현 디렉토리에 별도 문서로 draft 후 합의.

---

## 2. 상태 관리

### 2.1 문자열 리터럴 Query Key 사용 금지

- **금지 예**: `useQuery({ queryKey: ["notices"] })`
- **이유**: 오타·리네이밍·invalidate 누락 위험. 모든 키를 한 곳에서 관리해야 refactor·캐시 제어 가능.
- **대체**: Query Key Factory 패턴
  ```ts
  // features/notices/keys.ts
  export const noticeKeys = {
    all: ["notices"] as const,
    lists: () => [...noticeKeys.all, "list"] as const,
    detail: (id: string) => [...noticeKeys.all, "detail", id] as const,
  };
  useQuery({ queryKey: noticeKeys.lists() });
  ```

### 2.2 `setState` 후 `await`로 낙관적 업데이트 금지

- **금지 예**: `setItems(next); await mutate();` (reconciler 틈새에서 상태 역류)
- **이유**: 서버 응답 실패 시 롤백 책임이 컴포넌트에 새어나감.
- **대체**: `queryClient.setQueryData(key, next)` + `onError`에서 `setQueryData(key, previous)` 롤백.

### 2.3 fetch-on-render 패턴 금지

- **금지 예**: `useEffect(() => { fetch(...).then(setData); }, [])`
- **이유**: 워터폴 + SSR 미활용 + 로딩 깜빡임.
- **대체**: Server Component에서 prefetch → `HydrationBoundary`로 클라이언트에 전달.

### 2.4 Server Component에서 브라우저 fetcher 호출 금지

- **이유**: `lib/api.ts`는 `credentials: "include"`로 브라우저 쿠키를 가정함. 서버에선 쿠키가 없어 401.
- **대체**: 서버는 `lib/api-server.ts` (`import "server-only"` + `auth()` 기반 Bearer 주입). 클라이언트는 `lib/api.ts`. 이름 다른 두 파일로 물리적 분리.

---

## 3. 라우팅 / 파일 배치

### 3.1 `app/` 하위에 라우팅 파일 외 코드 배치 금지

- **금지 예**: `app/login/login-form.tsx`, `app/users/UserList.tsx`
- **이유**: Next.js App Router는 `app/` 하위 파일을 특수 규약(page/layout/route/proxy 등)으로 해석. 일반 컴포넌트가 섞이면 라우팅/테스트 경계가 흐려짐.
- **대체**:
  - 도메인 비종속 공통 컴포넌트: `apps/admin/src/components/`
  - 도메인 종속 컴포넌트: `apps/admin/src/features/<domain>/`
- **라우팅 허용 파일만**: `page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`. 상세: [folder-conventions.md](folder-conventions.md).

### 3.2 Next.js 16에서 `middleware.ts` 사용 금지

- **이유**: Next 16은 `middleware.ts` → `proxy.ts`로 컨벤션 변경. Auth.js 공식 예제 복붙하면 경고/미동작.
- **대체**: `apps/admin/src/proxy.ts` (root-level) 또는 per-segment `proxy.ts`.
- **주의**: 외부 라이브러리 가이드는 자기 버전 기준 예제를 보여주므로, 반드시 현 프로젝트 Next 버전의 deprecation 표를 먼저 확인.

### 3.3 라우트 그룹 이름 혼동 금지

- **허용 그룹명**: `(app)`, `(public)` 두 개만.
  - `(app)`: 인증 필요 콘솔. Shell 적용. `auth()` 가드 hook point 위치.
  - `(public)`: 로그인·에러·공개 페이지. Shell 미적용.
- **금지**: `(auth)`, `(protected)`, `(admin)` 등 다른 이름.
- **이유**: hook point 위치 예측 가능성·후속 슬라이스와의 규약 충돌 방지.

### 3.4 `app/**/page.tsx` / `app/**/layout.tsx` 테스트 누락 금지

- **이유**: 라우트 컴포넌트는 실제 진입점. 회귀 치명도 최고. 빈 테스트 커밋은 "완료" 표시 불가.
- **대체**: RTL(`tests/unit/app/**`) 또는 Playwright(`e2e/`) 중 한 곳에서 **반드시** 커버. 둘 다 없으면 리뷰 reject.

---

## 4. 타입/코드 품질

### 4.1 `any` 남발 / `@ts-ignore` / `@ts-expect-error` without reason 금지

- **이유**: TypeScript strict + `noUncheckedIndexedAccess`인데 의미가 증발함.
- **대체**: 정 필요하면 **한 줄 근거 주석** 필수.
  ```ts
  // @ts-expect-error: Next.js 16 PR #12345에서 타입 누락, 릴리즈 후 제거
  ```

### 4.2 파일명 casing 위반 금지

| 대상 | 규칙 |
| --- | --- |
| React 컴포넌트 `.tsx` | **PascalCase** (파일명 = 컴포넌트명) |
| 유틸·서버·타입 `.ts` | **kebab-case** |
| shadcn `components/ui/*` | **kebab-case** (shadcn CLI 기본값, 예외) |
| Next.js 라우팅 파일 | Next 규약 소문자 (`page.tsx`, `route.ts`, `proxy.ts`) |
| 테스트 | 대상 이름 그대로 + `.test.tsx`/`.test.ts` |

### 4.3 `default export` 남용 금지

- **허용**: `app/**/page.tsx`, `app/**/layout.tsx` (Next.js 강제).
- **그 외**: 모두 **named export**.
- **이유**: rename safety + grep·refactor 안정성. default는 import 시 이름 자유도가 너무 커서 리팩토링 시 누락됨.

### 4.4 Prisma client를 매 요청마다 `new` 금지

- **이유**: 커넥션 누수 + 실시간 핫리로드에서 커넥션 풀 고갈.
- **대체**: 싱글톤 패턴 (`global.prisma` 트릭)
  ```ts
  const prismaClientSingleton = () => new PrismaClient();
  declare const globalThis: { prismaGlobal: ReturnType<typeof prismaClientSingleton> } & typeof global;
  const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  export default prisma;
  if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
  ```

---

## 5. UI/UX

### 5.1 로딩/에러/빈 상태 미처리 금지

- **이유**: 3상태(loading / error / empty) 전부 UI가 있어야 함. `data?.length > 0`만 그리고 끝내면 사용자는 빈 화면을 본다.
- **대체**: `isPending`, `isError`, `data?.length === 0` 각각 전용 컴포넌트.

---

## 6. 개발·배포 프로세스

### 6.1 `commitlint` 우회·Conventional Commits 어기기 금지

- **메시지 패턴**: `type(scope): subject`
- **type**: `feat` / `fix` / `chore` / `docs` / `refactor` / `test` / `build` / `perf` / `style` / `revert` / `ci`
- **이유**: changelog 자동 생성·semver 릴리즈 자동화 의존.
- **체크**: Husky commit-msg 훅 우회 금지(`--no-verify` 금지).

### 6.2 E2E를 `CI=1` / `--headless`로 우회 실행 금지

- **이유**: 로컬 개발에서 시각 확인 없이 통과시키면 실제 UX 회귀를 놓침.
- **규칙**: `pnpm e2e` 기본 = `--headed`. `CI=1` 환경 변수가 실제 CI 러너에서만 자동 감지되어 headless 전환.
- **체크**: 로컬에서 수동으로 `CI=1` 설정 금지.

### 6.3 리뷰어가 런타임 기동 없이 PASS 판정 금지

- **이유**: 타입 체크·테스트가 그린이어도 실제 기동 시 hydration mismatch·런타임 에러 발생 가능.
- **규칙**: Reviewer는 `pnpm dev` 기동 + 해당 라우트 실제 렌더 확인 + 에러 로그 0건까지 확인. 상세: [dev-workflow.md](dev-workflow.md).

### 6.4 TDD "실패 테스트 → 구현 → 그린" 증거 없이 태스크 체크 금지

- **이유**: tasks.md 체크박스가 체크되어 있는데 실제 TDD 사이클이 없으면 spec 연동이 끊어짐.
- **규칙**: Developer 리포트에 "실패 스냅샷 → 구현 → 그린 스냅샷" 증거(커밋 해시·테스트 출력) 반드시 포함.

---

## 7. 참고

- 이 문서에 **없는** 금지 사항은 리뷰에서 지적하지 않는다(규칙 자의 확대 금지).
- 새 패턴 추가 시: 여기에 섹션 추가 + CLAUDE.md 1줄 요약 + 팀 합의 커밋.
- 근거 문서: [folder-conventions.md](folder-conventions.md), [dev-workflow.md](dev-workflow.md), [dev-flow.md](dev-flow.md).
