## Context

apps/admin은 Step 8(BFF 프록시 + TanStack Query 레일)까지 구축되어 있으나, 로그인 wipe 이후 `app/page.tsx`는 Next.js 기본 placeholder 상태다. 사이드바·헤더·메인 영역이 없어 이후 기능 슬라이스들이 얹힐 공통 프레임이 없다. Tailwind 4 + shadcn/ui + CSS 변수 기반 "Executive Lens" 디자인 시스템 토큰은 이미 globals.css에 부분 정의되어 있다.

## Goals / Non-Goals

**Goals:**
- 사이드바(256px) + 글래스 헤더(64px) + 메인 영역으로 구성된 데스크톱 전용 Shell 프레임 구축
- CSS 변수(`--sidebar-width`, `--header-height`, `--header-glass-bg`) 단일 진실원 확립
- 로그인 슬라이스가 꽂힐 auth() hook point를 `(app)/layout.tsx`에 명시
- No-Line 원칙·접근성 랜드마크·키보드 탐색·Lighthouse 기준(성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02) 충족

**Non-Goals:**
- 인증·RBAC 적용 (로그인 슬라이스 담당)
- 실제 API 데이터 렌더 (Dashboard/Users는 placeholder)
- 모바일·태블릿 반응형 (후속 슬라이스)
- 다크모드 검증 (변수는 준비하되 검증은 후속)
- 사이드바 접기/펼치기 토글 (M5, 후속)

## Decisions

### 1. 라우트 그룹 이름 `(app)` 확정

`(auth)`, `(dashboard)`, `(protected)` 등 의미 선점 이름을 피하고 중립명 `(app)`을 사용한다.

**이유**: 로그인 슬라이스가 `(auth)` 그룹을 별도로 가질 수 있으며, Shell 그룹명이 특정 보안 의미를 내포하면 후속 슬라이스 병합 시 혼란이 생긴다. `(app)` 그룹은 "이 앱의 공통 Shell 아래에 있는 페이지"를 나타내는 구조적 의미만 가지며, auth() 가드는 layout.tsx hook point에 후속 micro-PR로 추가된다.

### 2. No-Line 원칙 예외 없음

Sidebar·Header·Main 경계 및 활성 메뉴 강조에 border 계열 클래스(`border`, `border-t/b/l/r`, `divide-*`)를 일체 사용하지 않는다.

**이유**: Executive Lens 디자인 시스템은 "톤 레이어링"으로 영역을 구분한다. border 라인은 시각적 무게를 높여 운영 콘솔의 집중도를 해친다. 활성 메뉴도 좌측 accent 라인이 아니라 `var(--sidebar-accent)` 배경 전체 강조로 통일한다. grep 자동 검증(`apps/admin/src/components/layout/**` + `apps/admin/src/app/(app)/**` 범위)으로 회귀를 방지한다.

### 3. CSS 변수 신설 (`--sidebar-width`, `--header-height`, `--header-glass-bg`)

레이아웃 구조 치수와 글래스 배경을 CSS 변수로 추상화하여 globals.css `:root`/`.dark` 블록에 선언한다.

**이유**: 사이드바 폭·헤더 높이·Main offset이 세 곳(`margin-left`, `margin-top`, `position: fixed left/top`)에 반복된다. 변수 없이 리터럴로 쓰면 폭 변경 시 한 곳이 빠지는 R2 리스크가 현실화된다. 글래스 배경(`--header-glass-bg`)을 변수화하면 다크모드 슬라이스에서 `.dark` 블록만 수정하면 된다.

### 4. `lib/navigation/` 배치 확정

메뉴 설정(`menu-config.ts`)과 활성 판정 로직(`is-menu-active.ts`)을 `features/` 하위가 아닌 `lib/navigation/`에 배치한다.

**이유**: 네비게이션은 특정 비즈니스 도메인(users, dashboard 등)에 종속되지 않는 인프라성 코드다. `features/<domain>/`은 특정 도메인의 UI·로직 집합이므로 Shell 전체에 걸쳐있는 메뉴 설정을 담기에 부적절하다. `lib/`는 앱 전역에서 공유되는 순수 유틸의 위치다.

### 5. 워드마크를 `<Link href="/dashboard">`로 선택

사이드바 상단 "Admin Console" 워드마크를 `<span>` 또는 `<h1>`이 아닌 `<Link href="/dashboard">`로 구현한다.

**이유**: Tab 순회의 첫 번째 포커스 가능 요소가 되어야 한다(§4.3). `<span>`/`<h1>`은 포커스 불가라 키보드 사용자가 홈으로 이동할 진입점을 잃는다. `<Link>`는 포커스 가능하며 홈 이동 시맨틱을 동시에 충족한다. 이로 인해 Tab 6회 순서(워드마크 → Dashboard → Users → 검색 → 알림 → 도움말)가 확정된다.

### 6. `SidebarNav`만 `"use client"` 격리

활성 메뉴 판정을 위한 `usePathname()` 호출을 `SidebarNav.tsx` 하나에만 격리하고, `Sidebar.tsx`·`SidebarUserFooter.tsx`·`Header.tsx`는 Server Component로 유지한다.

**이유**: SSR 시 pathname을 알 수 없어 활성 강조가 없다가 hydration 후 표시되는 flash가 발생한다. 이 범위를 `SidebarNav`만으로 최소화해 CLS를 줄인다. 클라이언트 번들도 최소화된다.

### 7. Sidebar/Header 물리적 비중첩 배치

Sidebar는 `left: 0; width: var(--sidebar-width)`, Header는 `left: var(--sidebar-width); right: 0`으로 배치해 두 고정 요소가 좌우 인접만 하고 겹치지 않게 한다. z-index는 Sidebar 30, Header 40 부여.

**이유**: Safari에서 `backdrop-filter` + `position: fixed` 조합이 stacking context를 재생성해 z-index가 뒤집힐 수 있다(R1). 물리적으로 겹치지 않으면 stacking 충돌이 발생하지 않는다. Header에 더 높은 z-index를 부여하는 이유는 미래에 추가될 Main 콘텐츠의 sticky/dropdown(1000+) 레이어가 Header를 덮지 않도록 여유 계층을 확보하기 위함이다.

## Risks / Trade-offs

- [R1 Safari backdrop-filter stacking]: `-webkit-backdrop-filter` 병기 + Sidebar/Header 물리적 비중첩으로 완화. 단, Safari 버전 업 시 재검증 필요 → fallback: `backdrop-filter` 제거 후 불투명 배경으로 degrade
- [R2 레이아웃 상수 중복]: `--sidebar-width`/`--header-height` CSS 변수 단일화 + globals.css grep 검증으로 완화
- [R3 SSR hydration flash on 활성 메뉴]: `SidebarNav` 클라이언트 격리 + Lighthouse CI CLS ≤ 0.02 회귀 고정으로 완화
- [R4 워드마크 이중 렌더]: 헤더 브랜드 배치 금지 확정 + RTL/E2E 회귀 테스트로 차단
- [R5 features/navigation 오배치]: `lib/navigation/` 확정 + 완료 기준 grep 검증으로 차단
- [R6 redirect() 동작 변경]: Next.js 16 changelog 모니터, 필요시 proxy.ts로 이관(M7)
- [R7 (app) 그룹명 충돌]: 중립명 유지, 로그인 슬라이스 명세도 그룹명 비의존으로 설계
- [R8 globals.css 라이트/다크 변수 동기화 누락]: `:root`/`.dark` 인접 배치로 완화, 다크모드 슬라이스에서 양측 동시 수정 강제
