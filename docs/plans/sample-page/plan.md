# 기획서: sample-page

## 1. 배경 및 목적

- **왜 필요한가**: admin-console은 base platform으로서 Shell(사이드바+헤더+메인), `(app)` 라우트 그룹, BFF 프록시, shadcn/ui 디자인 시스템, TanStack Query 3상태 처리 등 공통 인프라를 이미 갖추고 있다. 하지만 이 인프라를 "한 페이지에 모두 써본 최소 레퍼런스"가 없으면 파생 프로젝트(admin-mes 등) 개발자나 신규 합류자가 매번 `(app)/dashboard` 같은 기존 화면을 역공학해야 한다.
- **해결하려는 문제**: "새 라우트 추가 시 파일을 어디에 두고, 어떤 컨벤션(파일명 casing, export, 3상태 UI, Query Key Factory)을 따르고, 테스트를 어디에 쓰는지"를 한 라우트로 시연한다.
- **성공 지표 (측정 가능)**:
  - `/sample-page` 라우트가 Shell 안에서 200 응답으로 렌더된다.
  - 로딩·에러·빈 상태 3상태 각각 수동 트리거(쿼리 파라미터 또는 지연 mock)로 육안 확인 가능하다.
  - RTL 단위 테스트 1개 + Playwright E2E 1개가 그린.
  - 리뷰어가 "새 라우트 추가 절차를 이 파일만 보고 따라할 수 있다"고 판단.

## 2. 사용자

- **주요 사용자**: admin-console 및 파생 프로젝트 개발자 (내부).
- **사용 맥락**: 새 라우트/기능을 추가하기 전, 현행 컨벤션을 확인하고 복붙 시작점을 찾을 때.
- **사용자 목표**: Shell 내 라우트가 어떻게 배치되는지, 3상태 UI가 어떤 모양인지, 테스트가 어디에 들어가는지를 5분 안에 파악.

## 3. 핵심 기능

- `(app)` 그룹 안에서 Shell이 얹힌 단일 라우트 `/sample-page` 제공.
- 읽기 전용 샘플 데이터(정적 배열 또는 지연 Promise)를 TanStack Query로 불러와 테이블/카드로 표시.
- 로딩·에러·빈 상태 각각을 명시적으로 렌더.
- shadcn/ui 컴포넌트(`Card`, `Table`, `Button`, `Skeleton`, `Alert` 등)만 사용한 도메인 중립 UI.
- 쿼리 파라미터(`?state=loading|error|empty|ok`)로 3상태 + 정상 상태를 수동 전환 (데모용).

## 4. 사용자 흐름

**정상 흐름:**
1. 로그인 상태에서 사이드바의 "Sample Page" 메뉴 또는 직접 `/sample-page`로 진입.
2. Shell(헤더·사이드바)이 유지된 채 메인 영역에 페이지 타이틀·설명이 먼저 렌더.
3. 샘플 데이터가 로딩되는 동안 Skeleton이 노출.
4. 데이터 도착 후 Table/Card에 3~5개 샘플 행이 표시.
5. 쿼리 파라미터로 `error`/`empty`를 주면 각각 Alert · EmptyState 컴포넌트로 전환.

**예외 흐름:**
- 미로그인 상태 진입 → `(app)/layout.tsx`의 auth hook point에서 `(public)/login`으로 리다이렉트 (기존 admin-shell 동작에 위임, 본 plan에서 새로 구현하지 않음).
- 샘플 데이터 fetch 실패 → 에러 상태 UI (Alert + "다시 시도" 버튼으로 `refetch`).
- 샘플 데이터 빈 배열 → 빈 상태 UI ("표시할 항목이 없습니다" + 설명).

## 5. 화면 구성

### 화면 1: `/sample-page`

- **목적**: Shell 내 새 라우트의 최소 레퍼런스. 3상태 UI 시연.
- **레이아웃**:
  - Shell 적용 (사이드바 + 헤더는 `(app)/layout.tsx`에서 제공).
  - 메인 영역 상단: `PageHeader`(타이틀 "Sample Page" + 설명 한 줄).
  - 메인 영역 본문: `Card`로 감싼 샘플 테이블/리스트.
  - 보조: 상태 전환 데모용 링크/버튼(`?state=loading|error|empty|ok`) — 개발 확인용.
- **요소**:
  - shadcn `Card`, `CardHeader`, `CardContent`, `CardTitle`.
  - shadcn `Table` (Header/Row/Cell) 또는 `Card` 그리드 중 하나.
  - shadcn `Skeleton` (로딩).
  - shadcn `Alert` + `AlertTitle` + `AlertDescription` (에러).
  - 빈 상태 컴포넌트(텍스트 + 안내).
  - shadcn `Button` (재시도, 데모 상태 전환).
- **인터랙션**:
  - 에러 상태에서 "다시 시도" 클릭 → `queryClient.invalidateQueries(sampleKeys.all)`.
  - 쿼리 파라미터로 3상태 강제 전환 (데모 목적, 후속 과제에서 제거 가능).
- **상태 (3상태 필수)**:
  - 로딩: Skeleton 3~5개 행.
  - 에러: Alert(variant=destructive) + 재시도 버튼.
  - 빈 상태: EmptyState 메시지.
  - 성공: 샘플 데이터 테이블/카드.

## 6. API 요구사항

- **이 슬라이스는 실제 백엔드 호출을 하지 않는다.** apps/api 변경 없음.
- 샘플 데이터는 `apps/admin/src/features/sample-page/` 내부의 정적 배열 + `setTimeout`으로 감싼 Promise로 공급(실제 네트워크 대기를 흉내).
- 후속에서 진짜 API 연동을 하게 되면 그 시점에 `/api/samples` 같은 BFF 엔드포인트를 architect가 설계. 본 plan에서는 비범위.
- 인증·권한: `(app)` 그룹에 소속되므로 기존 Shell의 `auth()` 가드 hook point를 그대로 이용. 별도 permission 체크는 본 plan 범위 밖(후속 과제).

## 7. 패키지 분담

- **apps/admin**: 이 plan의 유일한 변경 대상.
  - 라우트 추가: `src/app/(app)/sample-page/page.tsx`.
  - 기능 슬라이스: `src/features/sample-page/` (fetcher, queries, 컴포넌트, 타입).
  - 선택적 사이드바 메뉴 등록 (있으면 이 slice에 포함, 규약에 따라 `lib/navigation/` 쪽 menu-config에 항목 1개 추가).
- **apps/api**: 변경 없음.
- **packages/**: 변경 없음. (공용 승격 대상 아님 — 이 slice는 레퍼런스 샘플이므로 admin에 머무름.)

## 8. UI/UX 원칙 (frontend 계열)

### 참조 소스·충실도

- `DESIGN_REF = none`, `DESIGN_FIDELITY = none`. 디자인 원본 대조 조항은 적용하지 않음.
- 시각 기조는 기존 `admin-shell` 슬라이스(`(app)/dashboard` 등)의 shadcn/ui 스타일을 그대로 따른다 — 별도 토큰 오버라이드 없음.

### 색 토큰 매핑 표

- 본 slice는 신규 토큰을 정의하지 않는다. 기존 `components/ui/*`가 쓰는 Tailwind/CVA 토큰(카드 배경·텍스트·border 등)을 **그대로** 사용.
- 만약 구현 중 기존 토큰으로 커버되지 않는 색이 필요하면 그 시점에 spec으로 승격(본 plan 범위 밖).

### 폰트 로딩

- 루트 `layout.tsx`에서 이미 로딩 중인 기본 sans/heading 폰트를 그대로 상속. 신규 폰트 도입 없음.

### 토큰 오버라이드

- 없음.

### 규약 예외 요청

- 없음.

### 프리로드 문서 열람 증거

- `CLAUDE.md` — 시스템 자동 주입(루트 컨텍스트). 별도 Read 생략(규약).
- `docs/rules/forbidden-patterns.md` — Read 완료. 특히 §2.1(Query Key Factory), §2.3(fetch-on-render 금지), §3.1(app/ 하위 배치), §3.3(그룹명 `(app)`/`(public)`만), §4.2(파일명 casing), §4.3(default export 한정), §5.1(3상태 UI) 준수.
- `docs/rules/folder-conventions.md` — Read 완료. `apps/admin/src/app/(app)/<segment>/page.tsx`, `features/<domain>/{api,queries,components,types}.ts(x)` 배치 준수.
- `docs/rules/dev-flow.md` — Read 완료. 본 작업은 "새 사용자 행위(레퍼런스 라우트)"로서 SDD 루프 진입 — plan.md → /spec → /dev.

## 9. 제약 조건

- **도메인 중립성 (CLAUDE.md 아키텍처 원칙 2)**: 이름 그대로 "sample". MES/VDI 등 비즈니스 단어 금지. feature 폴더명도 `sample-page` 중립.
- **라우트 그룹 고정 (CLAUDE.md 원칙 5)**: `(app)` 사용. 다른 그룹명 금지.
- **app/ 배치 규칙 (forbidden §3.1)**: `app/(app)/sample-page/` 안에는 `page.tsx`만. 컴포넌트·fetcher·query·타입은 전부 `features/sample-page/` 아래.
- **파일명 casing (forbidden §4.2)**: `.tsx` 컴포넌트 = PascalCase, `.ts` 유틸/타입 = kebab-case. 라우팅 파일은 Next 규약.
- **Export (forbidden §4.3)**: `page.tsx`만 default, 나머지 named.
- **Query Key Factory (forbidden §2.1)**: 문자열 리터럴 key 금지. `features/sample-page/queries.ts`에서 `sampleKeys` factory 정의.
- **3상태 UI (forbidden §5.1)**: loading/error/empty 모두 전용 컴포넌트로.
- **Server vs Client fetcher (forbidden §2.4)**: 본 slice는 실제 네트워크 호출이 없으므로 `lib/api.ts`/`lib/api-server.ts` 양쪽 모두 import하지 않는다. 내부 mock 모듈만 사용.
- **테스트 누락 금지 (forbidden §3.4)**: `page.tsx` 대상 RTL 또는 E2E 둘 중 하나 이상 필수. 본 plan은 **둘 다** 요구.
- **비즈니스 로직 금지 (forbidden §1.4)**: 샘플 데이터는 중립적인 항목(예: `{ id, name, status }` 수준). 실제 도메인 용어 사용 금지.
- **백엔드 URL 노출 금지 (forbidden §1.2)**: 본 slice는 서버 호출이 없으므로 자연히 충족.
- **localStorage/sessionStorage 사용 금지 (forbidden §1.1)**: 상태 전환 데모도 URL 쿼리 파라미터만 사용.

## 10. 완료 기준

- [ ] `apps/admin/src/app/(app)/sample-page/page.tsx` 생성 — default export, Shell 내부 렌더 확인.
- [ ] `apps/admin/src/features/sample-page/` 슬라이스 생성:
  - [ ] `api.ts` — 샘플 mock fetcher (정적 데이터 + 지연 Promise).
  - [ ] `queries.ts` — `sampleKeys` Query Key Factory + `useSampleList` 훅.
  - [ ] `types.ts` — 샘플 아이템 타입.
  - [ ] `components/SamplePageView.tsx` — 3상태 분기 렌더링 본체.
  - [ ] `components/SampleTable.tsx` — 성공 상태용.
  - [ ] `components/SampleEmpty.tsx` — 빈 상태.
  - [ ] `components/SampleError.tsx` — 에러 상태 (재시도 포함).
  - [ ] `components/SampleSkeleton.tsx` — 로딩 상태.
- [ ] 3상태가 각각 수동 트리거(`?state=loading|error|empty|ok`)로 확인 가능.
- [ ] Query Key Factory 사용 (문자열 리터럴 key 0건 — grep으로 검증).
- [ ] RTL 단위 테스트: `tests/unit/app/(app)/sample-page/page.test.tsx` — 최소 3상태 중 "정상" 1개 렌더 검증 (MSW 또는 mock fetcher 교체로).
- [ ] Playwright E2E: `e2e/sample-page.spec.ts` — 로그인된 세션으로 `/sample-page` 진입 → 타이틀 가시성 + 테이블 행 ≥ 1 확인.
- [ ] 사이드바 메뉴에 "Sample Page" 항목 노출 (있는 경우 `lib/navigation/` menu-config 업데이트, 없으면 직접 진입으로 검증).
- [ ] Reviewer가 `pnpm dev` 기동 후 `/sample-page` 실제 렌더 + 콘솔 에러 0건 확인.
- [ ] 린트/타입체크/테스트 전부 그린.
- [ ] Conventional Commits 준수 (`feat(admin): sample-page reference slice` 등).

## 11. 미결 사항

- 사이드바 menu-config에 "Sample Page"를 넣을지 / 문서에서만 링크로 안내할지 — `/spec` 단계에서 menu-config 현황 확인 후 결정. (기본값: menu-config에 추가.)
- 데모용 `?state=...` 쿼리 파라미터를 **정식 기능으로 유지**할지 / 구현 확인 후 제거할지 — 기본값: 유지 (레퍼런스 목적). Reviewer 판단으로 제거될 수 있음.
- 후속 과제:
  - 실제 백엔드 `/api/samples` 엔드포인트 연동(architect 설계 필요).
  - `permissions` 기반 UI 토글 예시 추가(현재는 `(app)` 가드만).
  - i18n 적용(현재는 하드코딩 문구).
- 디자인 참조 없음 — 실제 시각 디자인이 추가되는 시점에 별도 슬라이스로 재기획.
