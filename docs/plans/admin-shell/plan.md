# 기획서: admin-shell

## 1. 배경 및 목적

### 1.1 왜 이 기능이 필요한가

현재 `apps/admin`은 Step 8(BFF 프록시 + TanStack Query 레일)까지 구축되어 있으나, 로그인 wipe(커밋 `c92803f`) 이후 **진입 시 표시할 공통 UI 셸이 없다**. `app/page.tsx`는 placeholder 수준이고, 사이드바·헤더·메인 콘텐츠 영역이 없으므로 이후 기능 슬라이스(Dashboard, Users, 병행 작성 중인 Google OIDC 로그인)들이 공통으로 얹힐 틀이 부재하다.

Admin Shell은 "Executive Lens" 디자인 시스템을 구조화해 **데스크톱 전용 운영 콘솔의 공통 프레임**을 정립한다. Google OIDC 로그인 플랜(`docs/plans/google-oidc-login/plan.md`)과는 **독립적으로 병합 가능하되, Shell layout이 로그인 슬라이스의 `auth()` 가드가 꽂힐 hook point를 미리 준비**하는 것이 본 슬라이스의 역할이다.

### 1.2 해결하려는 문제

- 공통 UI 셸 부재로 이후 기능 페이지들이 각자의 레이아웃을 만들게 되어 일관성 붕괴 위험.
- 현재 `apps/admin/src/app/page.tsx`가 Next.js 기본 placeholder 상태 → 루트 진입 시 아무 정보도 전달하지 못함.
- 디자인 시스템(Executive Lens)의 No-Line 원칙·톤 레이어링을 검증할 실제 레퍼런스 화면이 없음.
- 로그인 슬라이스가 병합될 때 "어디에 auth 가드를 꽂을지"가 명확하지 않음 → Shell이 먼저 구조를 정의해야 함.

### 1.3 성공 지표 (측정 가능)

| 지표 | 기준값 | 측정 방법 |
| --- | --- | --- |
| Shell 라우트(`/dashboard`, `/users`) 렌더 정상성 | 두 경로 모두 200 + 사이드바·헤더·메인 3영역 전부 가시 | Playwright 스모크 |
| 활성 메뉴 prefix 매칭 정확성 | 설계된 7개 케이스(§12.1.1) 전원 통과 | RTL 단위 테스트 |
| Lighthouse 성능 (`/dashboard`) | ≥ 90 | Lighthouse CI |
| Lighthouse 접근성 (`/dashboard`) | ≥ 95 | Lighthouse CI |
| Lighthouse CLS (`/dashboard`) | ≤ 0.02 | Lighthouse CI |
| 1280×800 viewport에서 가로 스크롤 | 발생하지 않음 | Playwright |
| 사이드바 네비게이션 키보드 순회 | 메뉴 항목 전부 Tab으로 도달 + `aria-current="page"` 노출 | Playwright + RTL |

---

## 2. 사용자

### 2.1 주요 사용자

- **내부 운영자**: 데스크톱(1024px+) 환경에서 admin-console을 업무 도구로 상시 사용하는 조직 구성원.

### 2.2 사용 맥락

- 사내 데스크톱·노트북 브라우저(Chrome/Edge/Firefox/Safari 최신 2버전).
- 다중 탭 사용이 빈번하며, 한 세션 내 여러 메뉴를 오가는 빈도가 높음.
- 모바일/태블릿은 본 슬라이스 비지원(디자인은 후속 슬라이스에서).

### 2.3 사용자 목표

- 진입 직후 **"내가 어디에 있고 어디로 갈 수 있는지"** 를 좌측 사이드바로 즉시 파악.
- 상단 헤더에서 검색·알림·도움말 진입점을 발견 가능.
- 메뉴 간 이동 시 레이아웃 흔들림 없이 메인 영역만 전환.

---

## 3. 핵심 기능

- **F1. 고정 사이드바 (256px)** — 좌측 고정, `var(--sidebar)` 배경(= `surface_dim`), 상단 워드마크 + 메뉴 리스트 + 하단 사용자 푸터.
- **F2. 글래스 헤더 (64px)** — 상단 고정, `backdrop-filter: blur(12px)` + 반투명 배경, 좌측 검색 인풋 + 우측 알림·도움말 아이콘 버튼. **브랜드는 사이드바에만**.
- **F3. 메인 콘텐츠 영역** — 사이드바·헤더를 제외한 잔여 영역. 페이지 margin 40px.
- **F4. 메뉴 2종 (Dashboard / Users)** — `lucide-react` 아이콘, 현재 경로와 prefix 매칭으로 활성 상태 표시. 활성은 **accent 배경**(`var(--sidebar-accent)`)으로만 강조.
- **F5. 루트 리다이렉트 `/` → `/dashboard`** — root `page.tsx`에서 `redirect("/dashboard")` 호출.
- **F6. 라우트 그룹 `(app)` 신설** — `(auth)`가 아닌 중립 이름. 본 슬라이스에는 세션 가드 없음. 로그인 슬라이스에서 `layout.tsx`에 `auth()` 가드를 꽂을 단일 hook point를 제공.
- **F7. 레이아웃 구조 변수 도입** — `--sidebar-width: 16rem`, `--header-height: 4rem`, `--header-glass-bg`을 `globals.css`에 추가.
- **F8. 활성 메뉴 prefix 매칭 규칙** — segment 단위 비교. `/usersettings`는 `/users` 활성 매치하지 않음.

---

## 4. 사용자 흐름

### 4.1 정상 흐름 — 최초 진입

1. 사용자가 `/`로 접속.
2. 서버 측 `app/page.tsx`가 `/dashboard`로 307 redirect.
3. `(app)/layout.tsx`가 Shell(Sidebar + Header + Main) 렌더.
4. `(app)/dashboard/page.tsx`가 Main 영역에 placeholder 렌더.
5. 사이드바 "Dashboard" 항목에 accent 배경 + `aria-current="page"` 부여.

### 4.2 정상 흐름 — 메뉴 이동

1. 사용자가 사이드바 "Users" 클릭.
2. `/users`로 이동, Shell(Sidebar/Header)은 유지, Main만 교체.
3. "Users" 항목 활성 표시 전이, "Dashboard" 항목 비활성화.

### 4.3 정상 흐름 — 키보드 조작

1. 사용자가 Tab 키를 누름.
2. 포커스 순서(§5.1 워드마크 시맨틱 결정에 따라 확정):
   - **워드마크가 `<Link href="/dashboard">`인 경우 (본 슬라이스 확정)**: 워드마크 → Dashboard → Users → 검색 → 알림 → 도움말 (Tab 6회)
3. 각 포커스 가능 요소에서 Enter/Space로 활성화 가능.

### 4.4 예외 흐름

- **E1. 알 수 없는 경로 (`/unknown`) 진입** → Next.js 기본 404 노출. Shell은 그리지 않음.
- **E2. 헤더 검색 인풋 submit** → 본 슬라이스에서는 noop. 실제 검색은 Out of Scope.
- **E3. 헤더 알림/도움말 아이콘 클릭** → noop (후속에 연결).
- **E4. 미래 로그인 슬라이스 병합 후 미로그인 접근** → 본 슬라이스 범위 아님. hook point에 `auth()` 가드 추가 시 `/login?callbackUrl=...`로 리다이렉트.
- **E5. prefix false positive (`/usersettings`)** → Users 메뉴 비활성 상태 유지.

---

## 5. 화면 구성

**공통**: 데스크톱(1024px+) 전용. 검증 viewport는 **1280×800 고정**. 토큰은 모두 `var(--*)` CSS 변수 참조(hex·rgba 리터럴 직접 기재 금지).

### 5.1 Sidebar

- **목적**: 네비게이션과 신원 표시의 좌측 anchor.
- **레이아웃**:
  - `position: fixed; top: 0; left: 0`
  - 너비 `var(--sidebar-width)` (16rem / 256px), 높이 `100vh`
  - 배경 `var(--sidebar)` (= `surface_dim`)
  - 내부 수직 분할: 상단 워드마크(높이 `var(--header-height)`) / 중단 메뉴 리스트 / 하단 사용자 푸터
  - **No-Line 원칙 준수**: 각 섹션 경계 border 없음, 톤 시프트만 허용. 본 슬라이스는 단일 톤.
- **요소**:
  - 상단: "Admin Console" 워드마크 — **시맨틱 `<Link href="/dashboard">`로 확정** (Tab 순회 첫 요소, 홈 이동 진입점). Manrope 600 / 16px / `var(--on-surface)`.
  - 메뉴 리스트(§5.1.1):
    - Dashboard — `lucide-react/LayoutDashboard`, href `/dashboard`
    - Users — `lucide-react/Users`, href `/users`
  - 하단 사용자 푸터(§5.1.2): 아바타(이니셜 "A") + 이름 "Admin User" + 역할 "Administrator"
- **인터랙션**:
  - 메뉴 hover → 배경 `var(--surface-container-high)`.
  - 메뉴 클릭 → Next.js `<Link>` 이동.
  - 활성 메뉴 → 배경 `var(--sidebar-accent)`, 텍스트 `var(--sidebar-accent-foreground)`, `aria-current="page"`. **좌측 라인·border 일체 없음**.
- **상태**: 기본 / hover / 활성 / 포커스(ring = `var(--ring)`).

#### 5.1.1 메뉴 리스트 항목

- 수직 패딩 12px, 수평 패딩 16px(8px 스케일).
- 아이콘 20px + 라벨 간 gap 12px.
- 터치 타겟 높이 ≥ 44px.
- `<nav aria-label="사이드바 주 메뉴">`로 랜드마크화.

#### 5.1.2 사용자 푸터

- 수직·수평 패딩 16px.
- 아바타 원형 32px, 배경 `var(--surface-container-high)`, 이니셜 텍스트.
- 이름 Body-SM 500, 역할 Body-SM 400 + `var(--on-surface-variant)`.
- placeholder 고정값: "Admin User" / "Administrator". 로그인 슬라이스 병합 시 세션 프로필로 교체.

### 5.2 Header

- **목적**: 전역 액션(검색·알림·도움말). 브랜드는 사이드바에만.
- **레이아웃**:
  - `position: fixed; top: 0; left: var(--sidebar-width); right: 0`
  - 높이 `var(--header-height)` (4rem / 64px)
  - 배경 `var(--header-glass-bg)` + `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter: blur(12px)`
  - **No-Line**: 헤더 하단 border 없음. 본문과의 경계는 톤 전환으로만.
- **요소**:
  - 좌측: 검색 인풋 — placeholder "검색...", lucide `Search` leading 아이콘, 너비 320px, 배경 `var(--surface-container-highest)`, `var(--radius-md)`(6px), border 없음.
  - 우측: 아이콘 버튼 2개(알림 `Bell`, 도움말 `HelpCircle`). 각 44×44px 터치 타겟, 원형 hover 배경 `var(--surface-container-high)`.
  - **헤더 우측에 "Admin Console" 워드마크·브랜드 배치 금지** (사이드바 중복 방지).
- **인터랙션**:
  - 검색 인풋: controlled. submit·live filter 모두 noop.
  - 알림/도움말 버튼: noop, `aria-label` 부여("알림", "도움말").
- **상태**: 기본 / 포커스 / hover.

### 5.3 Main

- **레이아웃**:
  - `margin-left: var(--sidebar-width); margin-top: var(--header-height)`
  - 너비 `calc(100vw - var(--sidebar-width))`
  - padding 40px, 배경 `var(--background)` (= `surface`)
- **인터랙션**: 라우트 이동 시 Main만 교체, Shell 고정.

### 5.4 Dashboard (placeholder)

- Headline-SM(24px/600) 타이틀 "Dashboard" + 한 줄 설명 "대시보드 콘텐츠는 후속 슬라이스에서 추가됩니다."

### 5.5 Users (placeholder)

- Headline-SM 타이틀 "Users" + "사용자 목록은 후속 슬라이스에서 추가됩니다."

### 5.6 `app/page.tsx` 변경 전/후

- **변경 전 (현재)**: Next.js 기본 스타터 placeholder 문구 렌더.
- **변경 후**: `import { redirect } from "next/navigation"; export default function RootPage() { redirect("/dashboard"); }` — 즉시 `/dashboard`로 서버 리다이렉트.

---

## 6. API 요구사항

본 슬라이스는 **API 호출 없음**. BFF 프록시 동작(Step 8)은 기존 그대로, Shell은 정적 placeholder만 렌더.

- 인증·권한: 본 슬라이스 미적용. `(app)/layout.tsx` 상단에 hook point 주석만 남김:
  ```
  // TODO(google-oidc-login): auth() 가드 hook
  //   const session = await auth();
  //   if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(...)}`);
  ```

---

## 7. 패키지 분담

- **apps/admin** — 본 슬라이스 전담.
  - `src/app/page.tsx` (redirect로 대체)
  - `src/app/(app)/layout.tsx` (신규)
  - `src/app/(app)/dashboard/page.tsx` (신규)
  - `src/app/(app)/users/page.tsx` (신규)
  - `src/components/layout/Sidebar.tsx` (신규)
  - `src/components/layout/Header.tsx` (신규)
  - `src/components/layout/SidebarNav.tsx` (신규, `"use client"`)
  - `src/components/layout/SidebarUserFooter.tsx` (신규)
  - `src/lib/navigation/menu-config.ts` (신규)
  - `src/lib/navigation/is-menu-active.ts` (신규, 순수 함수)
  - `src/app/globals.css` (수정, 레이아웃 변수 추가)
- **apps/api / packages/ui / packages/types** — 변경 없음.

`features/` 하위에는 네비게이션 파일 없음(도메인 아님). `lib/navigation/`로 확정.

---

## 8. UI/UX 원칙 (Executive Lens 준수)

### 8.1 No-Line 원칙 (엄격)

- `border`, `border-t`, `border-b`, `border-l`, `border-r`, `divide-*`, vertical divider 전부 금지.
- 섹션 구분은 배경 톤 전환으로만.
- **예외 없음** — 활성 메뉴 좌측 라인도 금지. accent 배경 강조만.

### 8.2 CSS 변수 단일 진실원

- 모든 색상·치수 토큰은 `var(--*)`로만 참조. **hex·rgba 리터럴 직접 기재 금지** (다크모드 대응 시 한 곳만 수정 가능해야 함).
- 헤더 반투명 배경도 `var(--header-glass-bg)`로 추상화 (§8.3).

### 8.3 레이아웃·글래스 CSS 변수

```css
:root {
  --sidebar-width: 16rem;          /* 256px */
  --header-height: 4rem;           /* 64px */
  --header-glass-bg: rgb(255 255 255 / 0.8);
}

.dark {
  --header-glass-bg: rgb(19 27 46 / 0.7); /* card 톤 기반, 다크모드 확장 지점 */
}
```

- `@theme inline` 밖 `:root`/`.dark`에 선언(색상 토큰과 구분되는 레이아웃·글래스 확장 슬롯).
- 재사용: 사이드바 너비·헤더 높이·Main offset·헤더 배경 모두 동일 변수 참조.

### 8.4 z-index 계층

**물리적 비중첩 전제**: Sidebar(`left:0 width:var(--sidebar-width)`) vs Header(`left:var(--sidebar-width) right:0`) — 두 영역은 좌우 인접만 하고 겹치지 않음. Main은 `margin-left: var(--sidebar-width); margin-top: var(--header-height)`로 두 고정 영역을 피함.

| 요소 | z-index | 근거 |
| --- | --- | --- |
| Main | 0 | Base |
| Sidebar | 30 | 고정 네비게이션 |
| Header | 40 | Sidebar와 동일 계층 이상. 미래 Main 콘텐츠 내 sticky/dropdown(1000)이 Header를 덮지 않도록 여유 계층 확보 |

**규칙**: 본 슬라이스 내 고정 레이어는 `z < 100`. DESIGN.md의 dropdown/sticky/overlay 대역(`1000+`)을 침범하지 않는다.

### 8.5 접근성

- `<aside>` + `<nav aria-label="사이드바 주 메뉴">` — 사이드바 랜드마크.
- `<header>` — 헤더 랜드마크.
- `<main>` — 본문 랜드마크.
- 활성 메뉴에 `aria-current="page"`.
- 모든 아이콘 버튼에 `aria-label` 필수.
- 포커스 링: `var(--ring)`. outline 제거 금지.
- 워드마크는 `<Link>`로 포커스 가능 (§5.1, §4.3 Tab 6회 계산 근거).

### 8.6 SSR / hydration 경계

- `SidebarNav.tsx`만 `"use client"` — `usePathname()` 사용.
- 초기 서버 렌더에서 활성 강조 없음 → hydration 후 확정.
- **회귀 고정**: Lighthouse CI CLS ≤ 0.02 (§1.3 성공 지표).

### 8.7 Safari 이슈 대응

- §15 R1 참조. `backdrop-filter`는 `-webkit-backdrop-filter`와 병기.
- Sidebar/Header는 **형제 관계**로 배치(부모 공유). 물리적 비중첩(§8.4)이라 stacking 충돌 가능성 최소.

### 8.8 로그인 슬라이스 통합 지점

- `(app)/layout.tsx` 상단 hook point 주석으로 `auth()` 가드 자리 명시(§6).

---

## 9. 제약 조건

### 9.1 범위

- 데스크톱 전용 (1024px+), 검증 viewport 1280×800.
- 로그인/RBAC 없음.
- 실제 API 호출 없음.
- 다크모드 검증 없음 (변수는 준비됨).

### 9.2 기술

- Next.js 16 App Router + React 19.
- Tailwind 4 + shadcn/ui (기존 `components/ui/*`).
- `lucide-react` 아이콘.
- CLAUDE.md "금지 패턴" 전부 준수.

### 9.3 브라우저

- Chrome/Edge/Firefox/Safari 최신 2버전.
- Safari `backdrop-filter` 벤더 prefix 병기 필수.

---

## 10. 슬라이스 구성

단일 PR. 로그인 슬라이스와 순서 무관하게 독립 병합 가능. 두 슬라이스 모두 병합된 뒤 `(app)/layout.tsx`에 `auth()` 가드 한 줄을 추가하는 micro-PR이 후속.

---

## 11. 완료 기준

### 기능·구조
- [ ] `/` → `/dashboard` 307 redirect.
- [ ] `/dashboard`, `/users`에서 Shell 3영역(사이드바·헤더·메인) 모두 가시.
- [ ] 사이드바 폭 256px, 헤더 높이 64px (CSS 변수 기반).
- [ ] 사이드바 배경 = `var(--sidebar)`, 본문 배경 = `var(--background)`.
- [ ] 헤더 배경이 `var(--header-glass-bg)` 참조 + `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter` 병기.
- [ ] 활성 메뉴가 `var(--sidebar-accent)` 배경 + `aria-current="page"`.
- [ ] `globals.css`에 `--sidebar-width`, `--header-height`, `--header-glass-bg` 선언.
- [ ] 워드마크는 `<Link href="/dashboard">`로 포커스 가능.
- [ ] `src/lib/navigation/menu-config.ts`, `is-menu-active.ts` 존재, `features/` 하위에 네비게이션 관련 파일 없음.
- [ ] hook point 주석(`TODO(google-oidc-login)`) 존재.

### No-Line grep 검증 (범위 명시)
- [ ] **`apps/admin/src/components/layout/**` + `apps/admin/src/app/(app)/**` 범위에서** `border(-t|-b|-l|-r)?`, `divide-*` 클래스 사용 0건 (shadcn `components/ui/*` 제외).
- [ ] 동일 범위에서 hex literal(`#[0-9a-fA-F]{3,6}`), rgb/rgba 리터럴 직접 기재 0건.

### 접근성·랜드마크
- [ ] `<aside>` + `<nav aria-label="사이드바 주 메뉴">`, `<header>`, `<main>` 랜드마크 각 1개.
- [ ] 알림·도움말 `aria-label` 부여.
- [ ] 헤더 내 "Admin Console" 텍스트 **없음**.
- [ ] 푸터 "Admin User" + "Administrator" 분리 표기.

### export·casing
- [ ] `app/**/page.tsx`·`layout.tsx`는 default export.
- [ ] `Sidebar.tsx`·`Header.tsx`·`SidebarNav.tsx`·`SidebarUserFooter.tsx` named export.
- [ ] `menu-config.ts`·`is-menu-active.ts` named export (kebab-case).

### 런타임·성능
- [ ] 1280×800 viewport에서 `/dashboard` 가로 스크롤 없음.
- [ ] Tab 순서: 워드마크 → Dashboard → Users → 검색 → 알림 → 도움말 (6회).
- [ ] Lighthouse: 성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02.

---

## 12. 테스트 시나리오

### 12.1 RTL 단위 테스트 (Vitest + Testing Library)

파일명: `.test.tsx`는 대상 PascalCase 그대로, `.test.ts`는 대상 kebab-case 그대로. 라우팅 파일은 `page.test.tsx` / `layout.test.tsx`.

#### 12.1.1 `is-menu-active.test.ts` (7 케이스)
- `/dashboard` → Dashboard 활성
- `/dashboard/anything` → Dashboard 활성
- `/users` → Users 활성
- `/users/123` → Users 활성
- `/users/123/edit` → Users 활성
- `/usersettings` → Users **비활성** (false positive 방지)
- `/dashboarding` → Dashboard **비활성**

#### 12.1.2 `SidebarNav.test.tsx`
- `/dashboard`에서 Dashboard 항목 `aria-current="page"`, Users에는 없음.
- `/users`에서 Users `aria-current="page"`, Dashboard에는 없음.
- 메뉴 항목이 링크(`role="link"`)이며 키보드 포커스 가능.

#### 12.1.3 `Sidebar.test.tsx`
- `<nav aria-label="사이드바 주 메뉴">` 존재.
- 워드마크 "Admin Console" + `<Link>`(role="link") 렌더.
- 푸터 "Admin User" + "Administrator" 분리 렌더.

#### 12.1.4 `Header.test.tsx`
- 검색 인풋 placeholder "검색..." 렌더.
- 알림 버튼 `aria-label="알림"`, 도움말 버튼 `aria-label="도움말"`.
- "Admin Console" 텍스트가 헤더 내에 **존재하지 않음**.

#### 12.1.5 `layout.test.tsx` ((app) 그룹)
- `<header>`, `<main>`, `<aside>` 랜드마크 각 1개.
- children이 `<main>` 내부 렌더.

#### 12.1.6 `page.test.tsx` (root)
- `redirect("/dashboard")` 호출 검증.

### 12.2 Playwright E2E

**운영 경로**:
- 로컬 개발: `pnpm e2e` = `--headed` 기본 (CLAUDE.md 준수).
- CI: `CI=1` 자동 감지 시 `--headless` 전환.
- **viewport 1280×800 고정** (`playwright.config.ts` `use.viewport`).

**시나리오**:

1. **루트 리다이렉트**: `/` → URL이 `/dashboard`로 변경.
2. **Shell 랜드마크 가시**: `/dashboard`에서 `role="navigation"` + `role="banner"` + `role="main"` 모두 visible.
3. **메뉴 이동**: "Users" 클릭 → URL `/users`, Users `aria-current="page"`, Dashboard는 없음.
4. **prefix 매칭 런타임**: `/users/abc`에서 Users 활성. (`/usersettings`는 라우트 없음 → 404, Shell 미렌더.)
5. **viewport 고정**: `document.documentElement.scrollWidth <= 1280`.
6. **키보드 순회**: Tab 6회 → [워드마크, Dashboard, Users, 검색, 알림, 도움말] 순서로 accessible name 일치. (§4.3, §5.1 워드마크 `<Link>` 결정에 의존.)
7. **헤더 브랜드 부재**: `role="banner"` 내부에서 "Admin Console" 텍스트 검색 0건.
8. **glass 효과 실측**: `getComputedStyle(header).backdropFilter` 또는 `webkitBackdropFilter`에 `blur(12px)` 포함. **클래스 이름 검사로 대체하지 않음**.
9. **No-Line 런타임 검증 (범위 한정)**: `[data-layout-root]` 속성이 있는 루트(사이드바/헤더 layout 루트)와 그 **직접 자식** 요소에 대해 `getComputedStyle(el).borderTopWidth/RightWidth/BottomWidth/LeftWidth` 전부 `"0px"` 검증. shadcn `components/ui/*` 하위는 범위 제외.

---

## 13. 미결 사항

- **M1.** Dashboard/Users placeholder 본문 문구 최종 확정.
- **M2.** 아바타 fallback 이니셜 규칙을 로그인 슬라이스와 맞추는 시점.
- **M3.** 메뉴 3개 이상 확장 시 섹션 그룹화 규칙.
- **M4.** 다크모드 검증 슬라이스 타이밍.
- **M5.** 사이드바 접기/펼치기 토글 도입 시점(접근성).
- **M7.** 본 슬라이스는 root `page.tsx`에서 `redirect()` 확정. 후속에서 proxy.ts 이관 필요성 재검토 여지.
- **M8.** 헤더 검색 submit vs live filter — 검색 슬라이스에서 결정.
- **M9.** `menu-config` 타입에 `permission?` 선제 도입 여부 — RBAC 슬라이스에서 결정. 본 슬라이스는 `{ label, href, icon }`만.
- **M10.** `<nav>` `aria-label` "사이드바 주 메뉴"(한국어) 확정 — i18n 슬라이스에서 재검토.

> M6(그룹명 `(app)`)은 **본 기획에서 확정**(§3 F6, §9). 미결 목록에서 제거.

---

## 14. 다음 단계

1. 본 기획서를 `/spec admin-shell`에 투입 → SDD 산출물 생성.
2. `/dev admin-shell` → 단일 슬라이스 개발·리뷰·테스트.
3. 로그인 슬라이스 병합 후 `(app)/layout.tsx` hook point를 실제 `auth()` 가드로 교체하는 micro-PR.
4. `/dashboard`에 첫 메트릭 카드 슬라이스 착수.

---

## 15. Risk

| ID | Risk | Mitigation | Trigger | Fallback |
| --- | --- | --- | --- | --- |
| R1 | Safari `backdrop-filter` + `position: fixed` 조합에서 stacking context 재생성으로 z-index 뒤집힘 | Sidebar/Header 물리적 비중첩(§8.4) + 형제 배치 + `-webkit-backdrop-filter` 병기 + Playwright WebKit 프로젝트로도 §12.2-8 실행 | Safari 버전 업 또는 WebKit 픽스 변경 시 | `backdrop-filter` 제거 후 `var(--card)` 불투명 배경으로 degrade |
| R2 | 레이아웃 상수(`ml-64`, `calc(100% - 256px)`) 중복으로 한쪽만 바꾸면 깨짐 | `--sidebar-width`, `--header-height` 단일화(§8.3). 완료 기준 §11 hex/상수 grep | 사이드바 폭·헤더 높이 변경 요청 시 | 변경 PR에서 변수 1개만 수정 |
| R3 | SSR 활성 메뉴 미표기 → hydration flash | 활성 판정을 `SidebarNav.tsx`(`"use client"`)에 격리. CLS ≤ 0.02 회귀 고정 | Next.js/React 버전 업 | `headers()` 기반 Server Component 활성 판정(복잡도↑, 최후 대안) |
| R4 | 워드마크 중복(사이드바+헤더) 시 스크린리더 이중 읽기 | 헤더 브랜드 제거 확정(§5.2), §12.1.4/§12.2-7로 회귀 고정 | 추후 헤더 브랜드 추가 PR | RTL/E2E fail로 차단 |
| R5 | `features/navigation/` 오배치 | `lib/navigation/` 확정(§7, §11) + grep 검증 | 후속 PR에서 네비게이션 파일 이동 | 리뷰어 차단 |
| R6 | Next.js 16 `redirect()` in `page.tsx` 동작 변경 | changelog 모니터 | Next.js 16 minor 업 | `proxy.ts`로 이관 (M7 재검토) |
| R7 | `(app)` 그룹명 충돌(로그인 슬라이스가 `(auth)` 선점 등) | 중립명 유지, 로그인 슬라이스 명세도 그룹명 비의존 | 로그인 슬라이스 PR 리뷰 시 | micro-PR로 그룹명 정렬 (라우트 그룹 폴더명 변경은 import 무영향) |
| R8 | 헤더 rgba 리터럴을 `var(--header-glass-bg)`로 추상화 후 값 변경 시 `:root`/`.dark` 두 군데 동기화 누락 | `globals.css` 한 파일 내 인접 배치 + 다크 변수 정의(§8.3) | 다크모드 슬라이스 진행 시 | 기본값(`:root`)만 변경 시 fallback으로 라이트 톤 유지 |
