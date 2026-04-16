## 0. 사전 제약 (전 태스크 공통)

- `app/` 하위에는 라우팅 파일만(`page.tsx`/`layout.tsx`/`route.ts`/`proxy.ts`). 컴포넌트는 `components/layout/`, 유틸은 `lib/navigation/`.
- 파일명 casing: 컴포넌트 `.tsx` → PascalCase, 유틸 `.ts` → kebab-case, 라우팅 파일 → 소문자 고정.
- default export: `page.tsx`·`layout.tsx`만. 나머지는 named export 강제.
- hex·rgba 리터럴 직접 기재 금지 — 모든 색상·치수는 `var(--*)` 참조.
- `border`·`border-t/b/l/r`·`divide-*` 클래스 사용 금지(No-Line 원칙, `apps/admin/src/components/layout/**` + `apps/admin/src/app/(app)/**` 범위).
- `middleware.ts` 사용 금지(Next.js 16).

---

## 1. CSS 변수 추가 (globals.css)

- [x] 1.1 `:root` 블록에 `--sidebar-width: 16rem`, `--header-height: 4rem` 추가
  - 수정 파일: `apps/admin/src/app/globals.css`
- [x] 1.2 `:root` 블록에 `--header-glass-bg: rgb(255 255 255 / 0.8)` 추가, `.dark` 블록에 `--header-glass-bg: rgb(19 27 46 / 0.7)` 추가
  - 수정 파일: `apps/admin/src/app/globals.css`

---

## 2. 네비게이션 유틸

- [x] 2.1 `menu-config.ts` — `{ label, href, icon }` 배열, Dashboard / Users 2항목
  - 수정 파일: `apps/admin/src/lib/navigation/menu-config.ts`
- [x] 2.2 `is-menu-active.ts` — segment 단위 prefix 매칭 순수 함수 (false positive 방지)
  - 수정 파일: `apps/admin/src/lib/navigation/is-menu-active.ts`

spec 근거: `sidebar-navigation`의 "메뉴 prefix 매칭 활성 판정" Requirement 5개 시나리오.

---

## 3. 레이아웃 컴포넌트

- [x] 3.1 `SidebarUserFooter.tsx` — named export, Server Component, 아바타 이니셜 "A" + "Admin User" + "Administrator"
  - 수정 파일: `apps/admin/src/components/layout/SidebarUserFooter.tsx`
- [x] 3.2 `SidebarNav.tsx` — `"use client"`, `usePathname()`, `is-menu-active` 사용, 활성 항목 `aria-current="page"`, named export
  - 수정 파일: `apps/admin/src/components/layout/SidebarNav.tsx`
- [x] 3.3 `Sidebar.tsx` — named export, Server Component, `<aside>` 랜드마크, `<nav aria-label="사이드바 주 메뉴">`, 워드마크 `<Link href="/dashboard">` "Admin Console", `SidebarNav` + `SidebarUserFooter` 조립
  - 수정 파일: `apps/admin/src/components/layout/Sidebar.tsx`
- [x] 3.4 `Header.tsx` — named export, Server Component, `<header>` 랜드마크, 글래스 배경 `var(--header-glass-bg)` + `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter` 병기, 검색 인풋(placeholder "검색...") + 알림(Bell, `aria-label="알림"`) + 도움말(HelpCircle, `aria-label="도움말"`). "Admin Console" 텍스트 배치 금지
  - 수정 파일: `apps/admin/src/components/layout/Header.tsx`

---

## 4. 라우트 그룹 및 페이지

- [x] 4.1 `(app)/layout.tsx` — default export, Sidebar + Header + Main 조합. 상단에 auth() hook point 주석:
  ```
  // TODO(google-oidc-login): auth() 가드 hook
  //   const session = await auth();
  //   if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(...)}`);
  ```
  - 수정 파일: `apps/admin/src/app/(app)/layout.tsx`
- [x] 4.2 `(app)/dashboard/page.tsx` — default export, Headline-SM "Dashboard" + placeholder 설명 문구
  - 수정 파일: `apps/admin/src/app/(app)/dashboard/page.tsx`
- [x] 4.3 `(app)/users/page.tsx` — default export, Headline-SM "Users" + placeholder 설명 문구
  - 수정 파일: `apps/admin/src/app/(app)/users/page.tsx`
- [x] 4.4 root `page.tsx` — `redirect("/dashboard")` 서버 리다이렉트로 교체
  - 수정 파일: `apps/admin/src/app/page.tsx`
