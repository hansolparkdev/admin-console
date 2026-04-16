## 1. globals.css CSS 토큰 정리

- [x] 1.1 신규 토큰 4종 추가 및 기존 토큰 7종 값 갱신
  - 수정 파일: `apps/admin/src/app/globals.css`
  - 신규: `--sidebar-hover-bg: rgba(51,65,85,0.5)`, `--sidebar-avatar-bg: #334155`, `--header-button-hover-bg: rgba(226,232,240,0.5)`, `--footer-muted-foreground: rgba(86,97,102,0.6)`
  - 갱신: `--sidebar: #1e293b`, `--sidebar-accent: rgba(255,255,255,0.1)`, `--sidebar-accent-foreground: #ffffff`, `--sidebar-footer-bg: rgba(30,41,59,0.4)`, `--header-glass-bg: rgb(248 250 252 / 0.8)`, `--search-input-bg: #f0f4f7`, `--notification-dot-ring: #ffffff`
  - 재할당: `--sidebar-primary` 값 → `var(--sidebar-accent)` (우측 bar 제거로 용처 소멸, shadcn 호환 유지)

## 2. 메뉴 구성 파일 수정

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 2.1 `menu-config.ts` 메뉴 5개 → 2개 축소, `/admins` 라우트·`ShieldCheck` 아이콘 교체
  - 수정 파일: `apps/admin/src/lib/navigation/menu-config.ts`
  - 항목: `대시보드`/`/dashboard`/`LayoutDashboard`, `관리자 관리`/`/admins`/`ShieldCheck`
- [x] 2.2 `menu-config.test.ts` 갱신 (2개 항목 단언, 기존 5개 href 부재 단언)
  - 수정 파일: `apps/admin/tests/unit/lib/navigation/menu-config.test.ts`
- [x] 2.3 `is-menu-active.test.ts` 케이스 갱신 (`/users` → `/admins`, `/adminsettings` false positive 케이스 포함)
  - 수정 파일: `apps/admin/tests/unit/lib/navigation/is-menu-active.test.ts`
  - 6 케이스: `/admins` true, `/admins/123` true, `/adminsettings` false, `/dashboard` true, `/dashboard/anything` true, `/dashboarding` false

## 3. 라우트 리네임 git mv

- [x] 3.1 `users/` 디렉터리 → `admins/` git mv
  - 수정 파일: `apps/admin/src/app/(app)/admins/page.tsx` (git mv from `users/page.tsx`)
- [x] 3.2 테스트 디렉터리 git mv
  - 수정 파일: `apps/admin/tests/unit/app/(app)/admins/page.test.tsx` (git mv from `users/page.test.tsx`)
- [x] 3.3 `admins/page.tsx` 내부 타이틀 `Users` → `관리자 관리`, placeholder 텍스트 교체
  - 수정 파일: `apps/admin/src/app/(app)/admins/page.tsx`
- [x] 3.4 `admins/page.test.tsx` assertion 교체 (`관리자 관리` 타이틀, `관리자 목록은 후속 슬라이스에서 추가됩니다.`, `Users` 부재)
  - 수정 파일: `apps/admin/tests/unit/app/(app)/admins/page.test.tsx`

## 4. SidebarNav 수정

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 4.1 `SidebarNav.test.tsx` 갱신 (메뉴 2개, bar span 부재 단언, translate-x-1, aria-current, rounded-xl)
  - 수정 파일: `apps/admin/tests/unit/components/layout/SidebarNav.test.tsx`
- [x] 4.2 `SidebarNav.tsx` 수정: 우측 4px bar `<span>` 제거, `translate-x-1` transform 추가, `rounded-xl`, hover `var(--sidebar-hover-bg)`, 아이콘 22px, 비활성 텍스트 `var(--sidebar-muted-foreground)`
  - 수정 파일: `apps/admin/src/components/layout/SidebarNav.tsx`

## 5. Sidebar 수정

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 5.1 `Sidebar.test.tsx` 갱신 (워드마크 `ADMIN CONSOLE`/`Admin Console System` 단언, `aria-label="ADMIN CONSOLE 홈"`, `The Lens` 부재)
  - 수정 파일: `apps/admin/tests/unit/components/layout/Sidebar.test.tsx`
- [x] 5.2 `Sidebar.tsx` 수정: 워드마크 "The Lens"/"Admin Console" → "ADMIN CONSOLE"/"Admin Console System", `<Link aria-label="ADMIN CONSOLE 홈">`, 내부 `<h2 aria-hidden="true">`/`<p aria-hidden="true">`, tracking·font weight·배경 색 토큰 갱신
  - 수정 파일: `apps/admin/src/components/layout/Sidebar.tsx`

## 6. SidebarUserFooter 수정

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 6.1 `SidebarUserFooter.test.tsx` 갱신 (`최고 관리자`/`Admin_User`/`super-admin@system.com` 3줄 단언, `Administrator`·`Admin User` 부재, `data-testid="user-email"` 존재)
  - 수정 파일: `apps/admin/tests/unit/components/layout/SidebarUserFooter.test.tsx`
- [x] 6.2 `SidebarUserFooter.tsx` 수정: 아바타 40px 회색 원 placeholder(`var(--sidebar-avatar-bg)`, `<img>` 없음), 3줄 텍스트(`최고 관리자` uppercase tracking-wider `var(--primary-fixed)` / `Admin_User` white / `super-admin@system.com` 10px slate-400 `data-testid="user-email"`), `// TODO(google-oidc-login)` 주석
  - 수정 파일: `apps/admin/src/components/layout/SidebarUserFooter.tsx`

## 7. Header + SearchInput 수정

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 7.1 `Header.test.tsx` 갱신 (`The Executive Lens` 부재, 도움말 부재, 라이트토글/알림/프로필 링크 단언, `aria-pressed` 부재)
  - 수정 파일: `apps/admin/tests/unit/components/layout/Header.test.tsx`
- [x] 7.2 `SearchInput.test.tsx` 갱신 (placeholder `시스템 기능 검색...`, 너비 320px/`w-80`)
  - 수정 파일: `apps/admin/tests/unit/components/layout/SearchInput.test.tsx`
- [x] 7.3 `Header.tsx` 수정: "The Executive Lens" 텍스트 제거, `HelpCircle` import 및 버튼 제거, 라이트토글 버튼 신설(`<button type="button" aria-label="테마 전환">`, lucide `Sun` 20px, noop onClick), 알림 dot 색 `var(--destructive)` + 좌표 `top-2 right-2`, 프로필 링크 신설(`<Link href="/admins" aria-label="프로필">`, 32px 회색 원 + `Admin_User`), `// TODO(google-oidc-login)` 주석, z-index 50
  - 수정 파일: `apps/admin/src/components/layout/Header.tsx`
- [x] 7.4 `SearchInput.tsx` 수정: placeholder "시스템 기능 검색...", 너비 `w-80`(320px), 배경 `var(--search-input-bg)`
  - 수정 파일: `apps/admin/src/components/layout/SearchInput.tsx`

## 8. (app)/layout.tsx footer 추가

TDD: 실패 테스트 작성 → 구현 → 그린

- [x] 8.1 `layout.test.tsx` 갱신 (`<footer role="contentinfo">` 랜드마크 단언, copyright 패턴 매치, 기존 3종 랜드마크 유지)
  - 수정 파일: `apps/admin/tests/unit/app/(app)/layout.test.tsx`
- [x] 8.2 `(app)/layout.tsx` 수정: `<footer role="contentinfo" className="p-8 text-center">` 추가, `© {new Date().getFullYear()} ADMIN CONSOLE. All rights reserved.` 텍스트, `var(--footer-muted-foreground)` 색, hook point 주석 유지
  - 수정 파일: `apps/admin/src/app/(app)/layout.tsx`

## 9. E2E 갱신

- [x] 9.1 `admin-shell.spec.ts` 갱신
  - SC-02: `role="contentinfo"` footer visible 단언 추가
  - SC-03: selector `/users` → `/admins`
  - SC-06: `expectedSequence` 7단계 완전일치 매칭 함수 재구현 (aria-label → placeholder → textContent 순서)
  - SC-07: `"The Executive Lens"`, `"The Lens"`, `"Admin Console"` 3개 전부 0건 단언
  - SEC-04: `/admins` 200 응답 확인 (기존 `/users` 교체)
  - 수정 파일: `apps/admin/e2e/admin-shell.spec.ts`

## 10. 런타임 검증

- [ ] 10.1 `pnpm --filter @admin-console/admin dev` 기동, deprecation warning 0건, runtime error 0건
  - 수정 파일: (없음 — 검증 단계)
- [ ] 10.2 `/dashboard`, `/admins` 브라우저 육안 확인 (1280×800 viewport, Shell 4영역 가시)
  - 수정 파일: (없음 — 검증 단계)
- [ ] 10.3 Lighthouse CI 실행: 성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02
  - 수정 파일: (없음 — 검증 단계)
