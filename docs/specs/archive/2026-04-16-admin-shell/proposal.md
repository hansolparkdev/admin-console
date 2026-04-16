## Why

Stitch "Admin Console Layout" 프로젝트의 "관리자 관리" 스크린(`screens/22a279f223604f1d9366dd0d6f8cdbd9`)으로 목업이 전면 교체됨에 따라 사이드바 배경·워드마크·활성 스타일·헤더 구성이 현재 구현(`fea82f6`)과 불일치한다. 또한 도메인이 "관리자 계정 관리"로 확정되면서 `/users` 라우트를 `/admins`로 리네임하고 메뉴를 5개에서 2개로 줄여 Ghost 라우트 문제를 해소해야 한다.

## What Changes

### capability: app-entry (MODIFIED)
- `(app)/users/` 디렉터리를 `(app)/admins/`로 git mv
- admins placeholder 페이지 타이틀 `Users` → `관리자 관리` (한국어)
- 테스트 경로 `tests/unit/app/(app)/users/` → `admins/` git mv, assertion 교체
- 루트 redirect(`/` → `/dashboard`) 및 auth() hook point 주석은 변경 없음

### capability: shell-layout (MODIFIED)
- Sidebar 배경 `#0f172a`(slate-900) → `#1e293b`(slate-800), z-index 30 → 40
- Sidebar 워드마크 "The Lens / Admin Console" → "ADMIN CONSOLE / Admin Console System"
  - 워드마크 `<Link aria-label="ADMIN CONSOLE 홈">`, 내부 `<h2>`/`<p>`는 `aria-hidden="true"`
- Sidebar 하단 사용자 프로필 블록 재구성: 3줄(`최고 관리자`/`Admin_User`/`super-admin@system.com`), 아바타 40px 회색 원 placeholder
- Header 배경 `rgb(255 255 255 / 0.8)` → `rgb(248 250 252 / 0.8)`, z-index 40 → 50
- Header 검색 너비 384px → 320px, placeholder 한국어 "시스템 기능 검색..."
- Header 우측 재구성: 도움말 버튼 제거, 라이트/다크 토글 신설(noop, aria-label="테마 전환"), 알림 dot 색 `var(--primary)` → `var(--destructive)`, 프로필 링크 신설(`<Link href="/admins" aria-label="프로필">`, 이름 `Admin_User`)
- "The Executive Lens" 브랜드 텍스트 제거
- `(app)/layout.tsx`에 `<footer role="contentinfo">` 신설(연도 동적, 텍스트 `© {YYYY} ADMIN CONSOLE. All rights reserved.`)
- CSS 토큰 신규 4종(`--sidebar-hover-bg`, `--sidebar-avatar-bg`, `--header-button-hover-bg`, `--footer-muted-foreground`) + 갱신 7종

### capability: sidebar-navigation (MODIFIED)
- 메뉴 5개 → 2개: `대시보드`(`/dashboard`/`LayoutDashboard`) + `관리자 관리`(`/admins`/`ShieldCheck`)
- 활성 스타일: 우측 4px bar `<span>` 제거 + `translate-x-1` transform 추가, `rounded-xl`
- 비활성 텍스트 `var(--sidebar-muted-foreground)`(slate-400), 활성 텍스트 `var(--sidebar-accent-foreground)`(white)
- `is-menu-active` 함수 계약 동일, 테스트 케이스를 `/admins` 기준으로 재작성 (false positive `/adminsettings` 포함)
- `--sidebar-primary` 토큰 재할당: 우측 bar 제거로 용처 소멸, 값 `var(--sidebar-accent)`으로 재할당(shadcn 호환 유지)

## Capabilities

### New Capabilities
- (없음 — 기존 3개 capability 모두 MODIFIED)

### Modified Capabilities
- `app-entry`: `/users` → `/admins` 라우트 리네임, 한국어 placeholder
- `shell-layout`: 사이드바·헤더·footer 전면 개편, CSS 토큰 추가/갱신
- `sidebar-navigation`: 메뉴 2개 축소, 활성 스타일 변경(bar 제거 + translate-x-1), `/admins` href

## Impact

### 깨지는 기존 테스트 (개편 시 즉시 수정 필요)
- `tests/unit/app/(app)/users/page.test.tsx` — git mv + assertion 교체 필요
- `tests/unit/components/layout/Sidebar.test.tsx` — 워드마크 문자열 변경
- `tests/unit/components/layout/SidebarNav.test.tsx` — bar span 부재 단언, translate-x-1, 메뉴 2개
- `tests/unit/components/layout/SidebarUserFooter.test.tsx` — 3줄 + 이메일 구성 변경
- `tests/unit/components/layout/Header.test.tsx` — 도움말 부재, 라이트토글·프로필 링크 신설 단언
- `tests/unit/components/layout/SearchInput.test.tsx` — placeholder 한국어
- `tests/unit/lib/navigation/is-menu-active.test.ts` — `/users` → `/admins` 케이스 교체
- `tests/unit/lib/navigation/menu-config.test.ts` — 2개 항목 검증
- `tests/unit/app/(app)/layout.test.tsx` — footer 랜드마크 단언 추가
- `e2e/admin-shell.spec.ts` — SC-03/06/07/SEC-04 갱신

### 마이그레이션 경로
- `git mv apps/admin/src/app/(app)/users apps/admin/src/app/(app)/admins`
- `git mv apps/admin/tests/unit/app/(app)/users apps/admin/tests/unit/app/(app)/admins`
- `apps/admin/src/app/globals.css` 토큰 선언부 갱신 (신규 4종 + 값 갱신 7종)

### 영향 파일
```
apps/admin/src/app/globals.css
apps/admin/src/app/(app)/layout.tsx
apps/admin/src/app/(app)/admins/page.tsx          (git mv from users/)
apps/admin/src/components/layout/Sidebar.tsx
apps/admin/src/components/layout/SidebarNav.tsx
apps/admin/src/components/layout/SidebarUserFooter.tsx
apps/admin/src/components/layout/Header.tsx
apps/admin/src/components/layout/SearchInput.tsx
apps/admin/src/lib/navigation/menu-config.ts
apps/admin/src/lib/navigation/is-menu-active.ts   (함수 계약 불변, 테스트만 변경)
apps/admin/tests/unit/app/(app)/admins/page.test.tsx  (git mv + 내용 교체)
apps/admin/tests/unit/app/(app)/layout.test.tsx
apps/admin/tests/unit/components/layout/Sidebar.test.tsx
apps/admin/tests/unit/components/layout/SidebarNav.test.tsx
apps/admin/tests/unit/components/layout/SidebarUserFooter.test.tsx
apps/admin/tests/unit/components/layout/Header.test.tsx
apps/admin/tests/unit/components/layout/SearchInput.test.tsx
apps/admin/tests/unit/lib/navigation/is-menu-active.test.ts
apps/admin/tests/unit/lib/navigation/menu-config.test.ts
apps/admin/e2e/admin-shell.spec.ts
```

## Out of Scope

- 관리자 관리 페이지 본문(테이블·stats·브레드크럼·"관리자 추가" 버튼·페이지네이션) — 별도 `admins-list` feature
- 다크모드 실제 시각 검증 및 토글 동작 구현 — 별도 `theme-toggle` feature
- 로그인/인증 OIDC 실구현 — 별도 `google-oidc-login` feature (hook point 주석만 유지)
- 알림 드롭다운·프로필 드롭다운 — 별도 feature
- 사이드바 접기/펼치기
- RBAC 권한 체크

## Meta
- feature: admin-shell
- type: frontend
- package: apps/admin
