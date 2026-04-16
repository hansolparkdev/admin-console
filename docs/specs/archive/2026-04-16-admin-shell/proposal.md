## Why

로그인 wipe(커밋 c92803f) 이후 apps/admin에는 공통 UI 셸이 없다. 이후 기능 슬라이스(Dashboard, Users, Google OIDC 로그인)가 각자의 레이아웃을 만들면 일관성이 붕괴되므로, "Executive Lens" 디자인 시스템 기반의 고정 사이드바·글래스 헤더·메인 영역으로 구성된 공통 프레임을 먼저 확립해야 한다.

## What Changes

- `app/page.tsx`를 `/dashboard`로 서버 리다이렉트하도록 교체
- `app/(app)/` 라우트 그룹 신설 — Shell layout + dashboard/users placeholder 페이지
- `components/layout/` 하위에 Sidebar, Header, SidebarNav, SidebarUserFooter 컴포넌트 신규 작성
- `lib/navigation/` 하위에 menu-config.ts, is-menu-active.ts 순수 유틸 신규 작성
- `app/globals.css`에 `--sidebar-width`, `--header-height`, `--header-glass-bg` CSS 변수 추가
- No-Line 원칙(border·divide 클래스 전면 금지) 및 CSS 변수 단일 진실원(hex·rgba 리터럴 금지) 엄격 적용

## Capabilities

### New Capabilities

- `shell-layout`: 사이드바(256px) + 글래스 헤더(64px) + 메인 영역으로 구성된 데스크톱 전용 Shell 프레임. CSS 변수·z-index 계층·No-Line 원칙·접근성 랜드마크를 포함.
- `sidebar-navigation`: 사이드바 내 메뉴 리스트(Dashboard/Users), prefix 매칭 활성 판정, 사용자 푸터. SidebarNav는 `"use client"`.
- `app-entry`: 루트 리다이렉트(`/` → `/dashboard`), `(app)` 라우트 그룹 구조, 로그인 슬라이스용 auth() hook point.

### Modified Capabilities

(없음 — 본 슬라이스는 전량 신규)

## Impact

- `apps/admin/src/app/page.tsx` — redirect 교체
- `apps/admin/src/app/(app)/layout.tsx` — 신규 (Shell 렌더 + auth hook point 주석)
- `apps/admin/src/app/(app)/dashboard/page.tsx` — 신규 placeholder
- `apps/admin/src/app/(app)/users/page.tsx` — 신규 placeholder
- `apps/admin/src/components/layout/Sidebar.tsx` — 신규
- `apps/admin/src/components/layout/Header.tsx` — 신규
- `apps/admin/src/components/layout/SidebarNav.tsx` — 신규 (`"use client"`)
- `apps/admin/src/components/layout/SidebarUserFooter.tsx` — 신규
- `apps/admin/src/lib/navigation/menu-config.ts` — 신규
- `apps/admin/src/lib/navigation/is-menu-active.ts` — 신규
- `apps/admin/src/app/globals.css` — CSS 변수 추가

## Meta

- feature: admin-shell
- type: frontend
- package: apps/admin
