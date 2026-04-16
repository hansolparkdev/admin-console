# 기획서: admin-shell (개편)

> **개편 고지 (2026-04-16)** — 본 plan은 2026-04-15 버전("Executive Lens / Dashboard·Users 5메뉴")을 **in-place로 전면 교체**한다. 커밋 `fea82f6`에 admin-shell 슬라이스가 이미 구현되어 있으나, Stitch "Admin Console Layout" 프로젝트의 **'관리자 관리' 스크린**(`projects/4047049138455434101/screens/22a279f223604f1d9366dd0d6f8cdbd9`)으로 목업이 전면 교체되면서 **도메인 확정("Users" → "관리자 관리")**, **메뉴 축소(5개 → 2개)**, **사이드바/헤더 톤·구성 변경**이 발생했다. 본 plan은 "기본 레이아웃만" 범위로 Shell 재구성만 다루며, 관리자 관리 페이지 본문(테이블·페이지네이션·stats·브레드크럼·관리자 추가 버튼)은 **범위 밖(후속 별도 feature)**. Shell 파일들은 삭제하지 않고 **개편(수정)**한다.

---

## 1. 배경 및 목적

### 1.1 왜 개편하는가

커밋 `fea82f6`(2026-04-15)에서 admin-shell이 Stitch "Admin Console Layout" 프로젝트 **초기 Executive Lens 시안** 기준으로 구현됐다. 이후 프로젝트 방향이 명확해지며 동일 Stitch 프로젝트의 **관리자 관리 스크린**으로 목업이 교체됐고, 다음 세 가지 전제가 바뀌었다.

1. **도메인 확정**: admin-console의 1차 제품 영역이 **"관리자(Admin) 관리"**로 결정됨. 기존 `/users` 라우트는 "시스템의 사용자"가 아니라 "관리자 계정" 관리로 의미가 고정되어 라우트명 자체를 `/admins`로 변경해야 한다 (§4 사용자 흐름, §7 패키지 분담).
2. **메뉴 정책 변경**: Phase 0에서 Analytics/Settings/Reports는 아직 후속 슬라이스조차 계획되지 않았음에도 `menu-config`에는 5개가 선언되어 있어 **사이드바 클릭 시 404를 만나게 되는 구조적 불일치**. Stitch 새 목업은 의도적으로 **대시보드 + 관리자 관리 2개만** 둠.
3. **시각 톤 변경**: 사이드바 배경이 `#0f172a`(slate-900) → `#1e293b`(slate-800)로 한 톤 밝아지고, 활성 메뉴의 **우측 4px bar 제거** + `translate-x-1` transform 도입. 헤더에 **라이트/다크 토글 + 프로필 블록** 추가, **도움말 아이콘 제거**, 현재 구현에 남아 있던 **"The Executive Lens" 헤더 브랜드 텍스트**(CLAUDE.md §8 "헤더 내 브랜드 금지" 위반) **제거**.

본 개편은 Shell의 파일 구조·라우트 그룹(`(app)`/`(public)`)·hook point는 유지하고, **컴포넌트 내부 마크업·스타일 + menu-config + /users→/admins 리네임 + 테스트 갱신**만 수정한다. Shell 파일 자체를 삭제·신규 생성하지 않아 `/dev admin-shell` 슬라이스는 "in-place 개편"으로 흐른다.

### 1.2 해결하려는 문제

- **디자인-구현 불일치**: 현재 구현된 Shell은 새 Stitch 목업과 톤·메뉴·헤더 요소가 달라, 이대로 후속 슬라이스(관리자 관리 테이블)를 얹으면 전체 일관성이 붕괴된다.
- **Ghost 라우트**: `menu-config.ts`의 Analytics/Settings/Reports는 해당 페이지가 존재하지 않아 클릭 시 404. 메뉴를 2개로 확정해 사이드바 항목 = 실제 라우트로 일치시킨다.
- **헤더 브랜드 중복 재발 방지**: 현재 `Header.tsx`가 우측에 "The Executive Lens" 워드마크를 렌더 — 이는 기존 plan §5.2·R4에서 명시적으로 금지한 규칙을 어긴 것이라 본 개편에서 **제거 + 회귀 테스트 강화**.
- **도메인 중립성과 라우트명 정렬**: admin-console 본체는 도메인 중립이지만, "관리자 계정 관리"는 admin-console 본체가 제공하는 **유일한 내장 도메인**(RBAC가 본체에 속함 — CLAUDE.md §아키텍처 원칙 2). 따라서 `/admins` 라우트는 파생 프로젝트가 아니라 본체가 소유한다.

### 1.3 성공 지표 (측정 가능)

| 지표 | 기준값 | 측정 방법 |
| --- | --- | --- |
| Shell 라우트(`/dashboard`, `/admins`) 렌더 정상성 | 두 경로 모두 200 + 사이드바·헤더·메인 3영역 전부 가시 | Playwright SC-02 |
| 활성 메뉴 prefix 매칭 정확성 | 6 케이스(§12.1.1) 전원 통과 | RTL `is-menu-active.test.ts` |
| 헤더 브랜드 부재 | `role="banner"` 내부에 "Admin Console" / "The Executive Lens" / "The Lens" 어떤 브랜드 문자열도 0건 | Playwright SC-07 + RTL `Header.test.tsx` |
| 사이드바 워드마크 존재 | `<aside>` 내부 "ADMIN CONSOLE" 1건 + "Admin Console System" sub 1건 | RTL `Sidebar.test.tsx` |
| Ghost 라우트 제로 | `menuItems` 배열의 모든 `href`에 실제 `page.tsx`가 존재 | RTL `menu-config.test.ts`에서 fs로 존재 검증 or 주석·스펙 확인 |
| Lighthouse 성능 (`/dashboard`) | ≥ 90 | Lighthouse CI |
| Lighthouse 접근성 (`/dashboard`) | ≥ 95 | Lighthouse CI |
| Lighthouse CLS (`/dashboard`) | ≤ 0.02 | Lighthouse CI |
| 1280×800 viewport에서 가로 스크롤 | 발생하지 않음 | Playwright SC-05 |
| Tab 순회 포커스 시퀀스 | 워드마크 → 대시보드 → 관리자 관리 → 검색 → 라이트토글 → 알림 → 프로필링크 (7단계) | Playwright SC-06 |
| deprecation warning / runtime error | `pnpm --filter @admin-console/admin dev` 기동 시 0건 | dev-workflow.md §개발 에이전트 체크리스트 |

---

## 2. 사용자

### 2.1 주요 사용자

- **내부 운영자 / 시스템 관리자**: 데스크톱(1024px+) 환경에서 admin-console을 상시 사용. Stitch 원본이 "슈퍼 관리자"·"콘텐츠 매니저"·"보안 분석가" 같은 역할을 다루므로 주 페르소나는 **RBAC 체계 하의 관리자 계정 운영자**.

### 2.2 사용 맥락

- 사내 데스크톱·노트북 브라우저(Chrome/Edge/Firefox/Safari 최신 2버전).
- 다중 탭 사용 빈번, 한 세션 내 대시보드 ↔ 관리자 관리 왕복.
- 모바일/태블릿 본 슬라이스 비지원.

### 2.3 사용자 목표

- 진입 직후 **"내가 어디에 있고 어디로 갈 수 있는지"** 를 좌측 사이드바로 즉시 파악.
- 상단 헤더에서 검색·테마토글·알림·자기 프로필 진입점 발견.
- 메뉴 간 이동 시 레이아웃 흔들림 없이 메인 영역만 전환.

---

## 3. 핵심 기능

- **F1. 고정 사이드바 (256px / w-64)** — 좌측 고정, 배경 `var(--sidebar)` = **#1e293b (slate-800)**, 상단 워드마크(`ADMIN CONSOLE` / `Admin Console System` sub) + 중단 메뉴 리스트 + 하단 사용자 프로필 블록.
- **F2. 글래스 헤더 (64px / h-16)** — 상단 고정, `backdrop-filter: blur(12px)` + 반투명 배경 `var(--header-glass-bg)` = **rgb(248 250 252 / 0.8) (slate-50/80)**, 좌측 검색 인풋 + 우측 라이트토글·알림·프로필 블록. **브랜드 텍스트는 사이드바에만**.
- **F3. 메인 콘텐츠 영역** — 사이드바·헤더를 제외한 잔여 영역. padding 40px(p-10 해석 기준).
- **F4. 메뉴 2종 (대시보드 / 관리자 관리)** — `lucide-react` 아이콘(§5.1.3 결정), 현재 경로와 prefix 매칭으로 활성 상태 표시. 활성은 **accent 배경(`var(--sidebar-accent)` = `rgba(255,255,255,0.1)`)** + `translate-x-1` transform. **우측 4px bar 없음**.
- **F5. 루트 리다이렉트 `/` → `/dashboard`** — 기존 유지.
- **F6. 라우트 그룹 `(app)` 유지** — 폴더 구조·hook point 주석 유지.
- **F7. 레이아웃 구조 변수 유지** — `--sidebar-width: 16rem`, `--header-height: 4rem` 유지. `--sidebar-primary`(우측 bar 용) 토큰은 **제거**.
- **F8. 활성 메뉴 prefix 매칭 규칙** — 기존 함수·규칙 유지, 테스트 케이스만 `/users` → `/admins`로 교체.
- **F9. 라우트 리네임 `/users` → `/admins`** — 파일 이동(`app/(app)/users/page.tsx` → `app/(app)/admins/page.tsx`), 테스트 이동(`tests/unit/app/(app)/users/page.test.tsx` → `tests/unit/app/(app)/admins/page.test.tsx`), E2E selector 교체, menu-config `href` 교체. 관리자 관리 페이지 본문은 placeholder만.
- **F10. 헤더 우측 요소 개편**
  - 라이트/다크 토글 버튼(lucide `Sun`) — 본 슬라이스에서 **noop**(클릭 가능하지만 테마 전환 동작 없음, `aria-label="테마 전환"`).
  - 알림 버튼(lucide `Bell`) — 빨간 점 위치 `top:10px right:10px`에서 Stitch 원본 `top-2 right-2`(=8px) 좌표로 맞추기.
  - **도움말(HelpCircle) 버튼 제거.**
  - 수직 divider 유지 (h-8 w-[1px] `var(--header-divider)`).
  - 프로필 블록 신설: 아바타(32px 원형) + 이름 `Admin_User`. 본 슬라이스에서는 **단일 `<a href="/admins">` 링크**로 래핑(후속 드롭다운 슬라이스 진입점). `aria-label="프로필"`.
  - **"The Executive Lens" 텍스트 제거.**
- **F11. 사이드바 워드마크 + 사용자 푸터 문구 교체**
  - 워드마크: "The Lens / Admin Console" → **"ADMIN CONSOLE" (text-xl 20px font-bold tracking-tight white) + "Admin Console System" (text-xs uppercase tracking-widest slate-400)**.
  - 사용자 푸터: 이니셜 "A" → 아바타 이미지 placeholder(`<div>` 회색 원), 역할 `Administrator` → `최고 관리자` (uppercase tracking-wider + `var(--primary-fixed)`), 이름 `Admin User` → `Admin_User`, **이메일 `super-admin@system.com` 추가** (text-[10px] slate-400 truncate).
  - 위 문자열은 로그인 슬라이스 병합 전까지 **placeholder 상수**로 확정. 로그인 슬라이스가 세션 프로필로 치환하는 지점을 `SidebarUserFooter.tsx`에 주석으로 남긴다.
- **F12. Main footer 추가** — Stitch 원본 하단에 `© 2023 ADMIN CONSOLE. All rights reserved.` 형식 copyright footer가 있음. 본 개편에서는 **Shell 공통 footer**로 `(app)/layout.tsx`에 포함. `<footer role="contentinfo">`로 랜드마크화, 문구는 `© {YYYY} ADMIN CONSOLE. All rights reserved.` — 연도는 `new Date().getFullYear()`. "Architectural Monolith Design System v2.0" 꼬리말은 Stitch 테스트 문구라 **제거**(§8 원본과 달리 간 결정 표).
- **F13. 활성 아이콘 변형** — Stitch 원본은 Material Symbols `FILL 1` 애니메이션. 본 프로젝트는 lucide-react이므로 **활성 시 아이콘 색만 변경**(본체 토큰) + **`filled` variant 없음**. §8 "원본과 달리 간 결정" 항목에 명시.

---

## 4. 사용자 흐름

### 4.1 정상 흐름 — 최초 진입

1. 사용자가 `/`로 접속.
2. 서버 측 `app/page.tsx`가 `/dashboard`로 307 redirect.
3. `(app)/layout.tsx`가 Shell(Sidebar + Header + Main + Footer) 렌더.
4. `(app)/dashboard/page.tsx`가 Main 영역에 placeholder 렌더.
5. 사이드바 "대시보드" 항목에 accent 배경 + `translate-x-1` + `aria-current="page"`.

### 4.2 정상 흐름 — 메뉴 이동

1. 사용자가 사이드바 "관리자 관리" 클릭.
2. `/admins`로 이동, Shell(Sidebar/Header/Footer)은 유지, Main만 교체.
3. "관리자 관리" 항목 활성 표시 전이, "대시보드" 비활성화.
4. 본 슬라이스에서 `/admins` 본문은 "관리자 목록은 후속 슬라이스에서 추가됩니다." placeholder만 보임.

### 4.3 정상 흐름 — 키보드 조작

1. 사용자가 Tab 키를 누름.
2. 포커스 순서: **워드마크 → 대시보드 → 관리자 관리 → 검색 → 라이트토글 → 알림 → 프로필 링크 (Tab 7회)**.
3. 각 포커스 가능 요소에서 Enter/Space로 활성화 가능.
4. 워드마크 / 메뉴 / 프로필 링크는 `<Link>`, 나머지(라이트토글·알림)는 `<button type="button">`.

### 4.4 예외 흐름

- **E1. 알 수 없는 경로 (`/unknown`) 진입** → Next.js 기본 404. Shell 미렌더.
- **E2. 헤더 검색 인풋 submit** → 본 슬라이스 noop.
- **E3. 라이트/다크 토글 클릭** → 본 슬라이스 noop(aria-pressed 전환 없음). 실제 테마 전환은 후속 "theme-toggle" 슬라이스.
- **E4. 알림 버튼 클릭** → 본 슬라이스 noop.
- **E5. 프로필 링크 클릭** → `/admins`로 이동 (후속 "account-dropdown" 슬라이스에서 드롭다운 메뉴로 교체 예정). 본 슬라이스는 **링크 동작**으로 기능 공백을 메움.
- **E6. 미래 로그인 슬라이스 병합 후 미로그인 접근** → 본 슬라이스 범위 아님. `(app)/layout.tsx` hook point에서 `auth()` 가드가 `/login?callbackUrl=...`로 리다이렉트.
- **E7. prefix false positive (`/adminsettings`)** → "관리자 관리" 메뉴 비활성 유지. 단, 본 슬라이스에는 `/adminsettings` 라우트가 없어 404로 끝남.

---

## 5. 화면 구성

**공통**: 데스크톱(1024px+) 전용. 검증 viewport **1280×800 고정**. 토큰은 모두 `var(--*)` 참조(hex·rgba 리터럴 직접 기재 금지 — 예외는 §8.2에 명시한 `globals.css` 토큰 선언부만).

### 5.1 Sidebar

- **목적**: 네비게이션과 신원 표시의 좌측 anchor.
- **레이아웃**:
  - `position: fixed; top: 0; left: 0`
  - 너비 `var(--sidebar-width)` (16rem / 256px), 높이 `100vh`
  - 배경 `var(--sidebar)` = **#1e293b (slate-800)** — 현재 #0f172a보다 한 톤 밝음
  - 내부 수직 분할: 상단 워드마크 블록(`px-4 py-6` = 16/24px) / 중단 메뉴 리스트(`gap-1`) / 하단 사용자 프로필 블록(`mt-auto`). **경계선 없음 — 톤 시프트로만 구분**(프로필 블록만 `var(--sidebar-footer-bg)`로 살짝 구별).
  - z-index `40` (Stitch 원본 z-40 매치 — 기존 30에서 40으로 **상향**, §8.4 재계산).
- **요소**:
  - 상단 워드마크: `<Link href="/dashboard" aria-label="ADMIN CONSOLE 홈">` (Tab 순회 첫 요소, 홈 진입점 유지). 링크 자체가 "ADMIN CONSOLE 홈"으로 accessible name이 확정되며, 내부 자식은 `aria-hidden="true"`로 스크린리더 중복 읽기를 차단.
    - `<h2 aria-hidden="true">ADMIN CONSOLE</h2>` — 20px / 700 / tracking-tight(-0.01em) / white
    - `<p aria-hidden="true">Admin Console System</p>` — 12px / 500 / **uppercase tracking-widest(0.1em)** / slate-400 / mt-1(4px)
  - 메뉴 리스트 (§5.1.1)
  - 하단 사용자 프로필 블록 (§5.1.2)
- **인터랙션**:
  - 메뉴 hover → 배경 `var(--sidebar-hover-bg)` (= slate-700/50, rgba(51,65,85,0.5)). 기존 `--sidebar-muted` 토큰은 본 슬라이스에서 hover 용도로 사용하지 않음.
  - 메뉴 클릭 → Next.js `<Link>` 이동.
  - 활성 메뉴 → 배경 `var(--sidebar-accent)` (= `rgba(255,255,255,0.1)`), 텍스트 `var(--sidebar-accent-foreground)` (= `#ffffff`), `font-semibold`, `translate-x-1` (CSS `transform: translateX(4px)`), `shadow-sm`, `aria-current="page"`. **우측 라인·border 일체 없음**.
  - 워드마크 링크 → `/dashboard` 이동.
- **상태**: 기본 / hover / 활성 / 포커스(ring = `var(--ring)`).

#### 5.1.1 메뉴 리스트 항목

- 수직 패딩 12px, 수평 패딩 16px (`px-4 py-3`).
- 아이콘 22px(Stitch text-[22px]) + 라벨 간 gap 12px(`gap-3`).
- 터치 타겟 높이 ≥ 44px.
- 모서리 `rounded-xl` (12px) — 기존 Executive Lens `rounded-md`에서 변경.
- `<nav aria-label="사이드바 주 메뉴">`로 랜드마크화.
- transition: `all 200ms` (배경·글자색·transform 동시).

#### 5.1.2 사용자 프로필 블록

- `mt-auto p-4 rounded-2xl(16px)` + 배경 `var(--sidebar-footer-bg)` = `rgba(30,41,59,0.4)` (slate-800/40)
- 내부 `flex items-center gap-3`
- 아바타 40×40px 원형 `var(--sidebar-avatar-bg)` (slate-700) — 이미지 placeholder(회색 원), 본 슬라이스에서는 **이미지 태그 없이** 빈 원으로 렌더하거나, `<img>` 대신 이니셜 없는 중립 원을 표시. 로그인 슬라이스 병합 시 세션 사진으로 교체 (주석으로 hook point 명시).
- 우측 3줄 텍스트 (`overflow-hidden`):
  - 상단: `최고 관리자` — 12px / 700 / **uppercase tracking-wider(0.05em)** / `var(--primary-fixed)` (= `#dae2fd`, 기존 토큰 있음) / `mb-0.5`
  - 중간: `Admin_User` — 14px / 500 / white / truncate
  - 하단: `super-admin@system.com` — 10px / 400 / slate-400 / truncate
- 본 슬라이스 값은 placeholder. `SidebarUserFooter.tsx` 상단에 `// TODO(google-oidc-login): 세션 프로필로 교체` 주석 남김.

#### 5.1.3 아이콘 선택

- **대시보드**: `lucide-react/LayoutDashboard` (22px, Stitch `dashboard` 대응).
- **관리자 관리**: `lucide-react/ShieldCheck` (22px, Stitch `manage_accounts` 대응 — lucide에 동일 아이콘 없음. RBAC 관리자 성격에 맞는 `ShieldCheck` 또는 `UserCog` 중 선택. **본 plan은 `ShieldCheck` 확정** — 관리자 = "권한 가진 사용자"를 더 직접 표현).
- 활성/비활성 구분은 **색상만**(filled variant 미사용). Stitch 원본의 `FILL 1` 애니메이션은 §8 "원본과 달리 간 결정"에 근거 기록.

### 5.2 Header

- **목적**: 전역 액션(검색·테마토글·알림·프로필). **브랜드는 사이드바에만** — 규칙 유지.
- **레이아웃**:
  - `position: fixed; top: 0; left: var(--sidebar-width); right: 0`
  - 높이 `var(--header-height)` (4rem / 64px)
  - 배경 `var(--header-glass-bg)` = **rgb(248 250 252 / 0.8) (slate-50/80)** + `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter: blur(12px)`
  - `flex justify-between items-center`, 좌우 padding `32px`(Stitch `px-8`)
  - z-index `50` (Stitch 원본 매치, 기존 40에서 **상향**, §8.4)
  - **No-Line**: border 없음.
- **좌측 요소** (검색만, 현재 `gap-8`이지만 요소 1개라 실질 무관):
  - 검색 인풋 — placeholder `시스템 기능 검색...`, lucide `Search` leading 아이콘(18px) `left-3 top-1/2 -translate-y-1/2`, 너비 **320px (w-80)** — 기존 384px에서 축소, 배경 `var(--search-input-bg)` = `#f0f4f7` (surface-container-low, Stitch `bg-surface-container-low`), border 없음, 모서리 `rounded-full`, 패딩 `py-2.5 pl-10 pr-4`, font-size 14px, placeholder 색 slate-400.
  - focus: `ring-2 ring-primary/20` (`var(--search-input-ring)` = `rgb(37 99 235 / 0.2)` — 기존 토큰 유지).
- **우측 요소** (`gap-4`):
  - 라이트/다크 토글 버튼 (lucide `Sun` 20px) — 40×40 원형, `text-slate-600`, hover `var(--header-button-hover-bg)` (= `rgba(226,232,240,0.5)` = slate-200/50), hover 아이콘 `scale-110`, `aria-label="테마 전환"`, `aria-pressed` 미사용(본 슬라이스 noop).
  - 알림 버튼 (lucide `Bell` 20px) — 40×40 원형, 동일 hover 스타일, 빨간 점: 위치 `top:10px right:10px` 에서 Stitch 원본 `top-2 right-2`(=8px) + 크기 `w-2 h-2`(=8px) + 링 `ring-2 ring-white`(= box-shadow 2px `var(--notification-dot-ring)`) + 배경 `var(--destructive)` = `#9f403d` (error) — 기존은 `var(--primary)`로 파랑이었지만 Stitch는 `bg-error`로 변경. `aria-label="알림"`.
  - 수직 divider `h-8 w-[1px]` `var(--header-divider)` = `#e2e8f0` (slate-200), `mx-2`.
  - 프로필 링크 `<Link href="/admins" aria-label="프로필">` (후속 드롭다운 슬라이스 대체 대상):
    - `flex items-center gap-3 pl-2`
    - 이미지 32×32 원형 `var(--header-profile-bg)` (surface-container-highest placeholder) — `<img>` 없이 회색 원으로 대체(로그인 병합 전까지)
    - 이름 `Admin_User` — 14px / 500 / slate-800(= `var(--on-surface)`)
- **"The Executive Lens" 등 브랜드 텍스트 배치 금지** — 회귀 테스트 SC-07 + `Header.test.tsx`로 고정.
- **인터랙션**:
  - 검색 인풋: controlled. submit·live filter 모두 noop.
  - 라이트토글·알림: noop, `aria-label` 필수.
  - 프로필 링크: `/admins`로 이동.
- **상태**: 기본 / 포커스(ring `var(--ring)`) / hover.

### 5.3 Main

- **레이아웃**:
  - 부모 div로 `ml-64 min-h-screen flex flex-col` 구성(Stitch 원본 구조).
  - `<main>`: `margin-top: var(--header-height)`; padding **40px** (Stitch `p-10`); `flex-grow: 1`; 배경 `var(--background)` (= `surface` = #f7f9fb).
- **인터랙션**: 라우트 이동 시 Main만 교체, Shell 고정.

### 5.4 Main Footer (신설)

- 레이아웃: `<footer role="contentinfo">` + `p-8 text-center`.
- 텍스트: `© {YYYY} ADMIN CONSOLE. All rights reserved.` — `<p>` 단일 줄, 12px / 400 / `var(--on-surface-variant)` + opacity 0.6 또는 `rgba(0,0,0,0.4)` 대응 토큰 `--footer-muted-foreground`.
- Stitch 원본의 "Architectural Monolith Design System v2.0" 꼬리말은 **제외** — 디자인 실험 문구이자 프로젝트와 무관(§8 원본과 달리 간 결정).
- 위치: `<main>` 밖, `ml-64` 부모 div 내부(= Shell flex-col 마지막).

### 5.5 Dashboard (placeholder)

- `<h1>` "Dashboard" — 24px / 600 / `var(--on-surface)`.
- `<p>` "대시보드 콘텐츠는 후속 슬라이스에서 추가됩니다." — `var(--on-surface-variant)`.
- 변경 없음.

### 5.6 Admins (placeholder, 기존 Users 대체)

- 파일 이동: `app/(app)/users/page.tsx` → **`app/(app)/admins/page.tsx`**.
- `<h1>` **"관리자 관리"** (한국어) — 24px / 600 / `var(--on-surface)`.
- `<p>` "관리자 목록은 후속 슬라이스에서 추가됩니다." — `var(--on-surface-variant)`.
- 본문 테이블·stats·브레드크럼·"관리자 추가" 버튼은 본 슬라이스 **범위 밖**.

### 5.7 `app/page.tsx`

- `redirect("/dashboard")` 유지, 변경 없음.

---

## 6. API 요구사항

본 슬라이스 **API 호출 없음**. BFF 프록시 동작(Step 8)은 그대로, Shell은 정적 placeholder만 렌더.

- 인증·권한: 본 슬라이스 미적용. `(app)/layout.tsx` 상단 hook point 주석 유지:
  ```
  // TODO(google-oidc-login): auth() 가드 hook
  //   const session = await auth();
  //   if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(...)}`);
  ```

---

## 7. 패키지 분담

본 개편은 **apps/admin 단독**. `apps/api`, `packages/*` 변경 없음.

### 7.1 수정 파일

| 파일 | 변경 내용 |
| --- | --- |
| `apps/admin/src/components/layout/Sidebar.tsx` | 워드마크 문구 교체 (`The Lens`/`Admin Console` → `ADMIN CONSOLE`/`Admin Console System`), tracking/font weight 수정, padding `p-4 py-6`로 정렬 |
| `apps/admin/src/components/layout/SidebarNav.tsx` | 우측 4px bar `<span>` **제거**, `translate-x-1` transform 추가, rounded-xl, hover bg 토큰 재연결, 아이콘 22px |
| `apps/admin/src/components/layout/SidebarUserFooter.tsx` | 이니셜 "A" → 이미지 placeholder 원, 3줄(역할/이름/이메일) 재구성, 문구 교체, 역할 라벨 `var(--primary-fixed)` uppercase tracking-wider |
| `apps/admin/src/components/layout/Header.tsx` | "The Executive Lens" 브랜드 텍스트 **삭제**, 도움말 버튼 **삭제**, 라이트토글 버튼 **신설**, 프로필 링크 블록 **신설**, 알림 dot 좌표·색 Stitch 매치 |
| `apps/admin/src/components/layout/SearchInput.tsx` | placeholder "Search data points..." → "시스템 기능 검색...", 너비 384→320px, 배경 토큰 Stitch 매치 |
| `apps/admin/src/lib/navigation/menu-config.ts` | 메뉴 5개 → **2개** (`대시보드`/`/dashboard`/`LayoutDashboard`, `관리자 관리`/`/admins`/`ShieldCheck`) |
| `apps/admin/src/app/(app)/layout.tsx` | `<footer role="contentinfo">` 추가 (§5.4), 기존 hook point 주석 유지, `<main>` flex-grow 구성 |
| `apps/admin/src/app/globals.css` | §8.3 색 토큰 매핑 표 전체 반영:<br>  - 신규: `--sidebar-hover-bg`, `--sidebar-avatar-bg`, `--header-button-hover-bg`, `--footer-muted-foreground`<br>  - 갱신: `--sidebar`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-footer-bg`, `--header-glass-bg`, `--search-input-bg`, `--notification-dot-ring`<br>  - 재할당: `--sidebar-primary`는 값 변경 대신 활용처 없음(=활성 bar 제거)으로 표시. 후속 다크모드 슬라이스에서 재용도 결정.<br>  - 제거 없음(하위 호환 유지). |

### 7.2 이동 파일 (git mv)

※ `git mv` 는 디렉터리 단위(`apps/admin/src/app/(app)/users/` → `apps/admin/src/app/(app)/admins/`, `apps/admin/tests/unit/app/(app)/users/` → `apps/admin/tests/unit/app/(app)/admins/`)로 수행. 표는 대표 파일만 기재.

| 구 경로 | 신 경로 | 비고 |
| --- | --- | --- |
| `apps/admin/src/app/(app)/users/page.tsx` | `apps/admin/src/app/(app)/admins/page.tsx` | 내부 문구 `Users` → `관리자 관리`, placeholder 텍스트 교체 |
| `apps/admin/tests/unit/app/(app)/users/page.test.tsx` | `apps/admin/tests/unit/app/(app)/admins/page.test.tsx` | assertion 문자열·URL 교체 |

### 7.3 수정되는 테스트 파일 (위치 동일)

| 파일 | 변경 요약 |
| --- | --- |
| `apps/admin/tests/unit/components/layout/Sidebar.test.tsx` | 워드마크 문자열 "The Lens"/"Admin Console" → "ADMIN CONSOLE"/"Admin Console System" |
| `apps/admin/tests/unit/components/layout/SidebarNav.test.tsx` | 메뉴 항목 대시보드/관리자 관리 2개로, 활성 스타일 검증은 **`translate-x-1` + `aria-current` + bg 토큰** (bar `<span>` 부재 회귀) |
| `apps/admin/tests/unit/components/layout/SidebarUserFooter.test.tsx` | `최고 관리자` / `Admin_User` / `super-admin@system.com` 3 문자열 존재, 기존 "Administrator" **부재** 단언 |
| `apps/admin/tests/unit/components/layout/Header.test.tsx` | "The Executive Lens" 텍스트 **부재** 단언, 도움말(aria-label) **부재** 단언, 라이트토글(`aria-label="테마 전환"`)·알림(`aria-label="알림"`)·프로필 링크(`aria-label="프로필"`, href="/admins") 존재 단언, 헤더 내 "Admin Console" 부재 단언 유지 |
| `apps/admin/tests/unit/components/layout/SearchInput.test.tsx` | placeholder "시스템 기능 검색..." 단언 |
| `apps/admin/tests/unit/lib/navigation/is-menu-active.test.ts` | `/users` 케이스 5개를 `/admins` 케이스로 치환 (6 케이스 유지: `/dashboard`, `/dashboard/anything`, `/admins`, `/admins/123`, `/adminsettings` false, `/dashboarding` false) |
| `apps/admin/tests/unit/lib/navigation/menu-config.test.ts` | 2개 항목 검증(label/href/icon null-safety) + 5개 항목 부재 단언 |
| `apps/admin/tests/unit/app/(app)/layout.test.tsx` | `<footer role="contentinfo">` 랜드마크 추가 단언, 기존 banner/main/complementary 유지 |
| `apps/admin/e2e/admin-shell.spec.ts` | SC-03 selector `/users`→`/admins`, SC-06 `expectedSequence` 7단계로 갱신, SC-07 `"The Executive Lens"`·`"The Lens"` 전부 0건 단언, SEC-04 `/users`→`/admins` |

### 7.4 삭제 파일

- 없음. 구 `users/page.tsx`는 `git mv`로 이동 처리이므로 삭제 커밋 아님.

### 7.5 신규 파일

- **없음** (strict "개편" 원칙). Shell 구성 파일은 기존 그대로 수정만.

---

## 8. UI/UX 원칙

### 8.0 참조 소스·충실도

- **DESIGN_REF**: `stitch:projects/4047049138455434101 screens/22a279f223604f1d9366dd0d6f8cdbd9` (관리자 관리 스크린).
- **DESIGN_FIDELITY**: `strict`.
- 열람한 산출물:
  - Stitch MCP `mcp__stitch__get_project projects/4047049138455434101` — 프로젝트 design theme + namedColors + design system markdown ("The Executive Lens") 확인.
  - Stitch MCP `mcp__stitch__get_screen ...screens/22a279f223604f1d9366dd0d6f8cdbd9` — 제목 `관리자 관리 - Admin Console`, deviceType DESKTOP, 2560×2242 아트보드 확인.
  - `/tmp/admin-stitch.html` — 스크린 HTML 전체(364줄) 다운로드·파싱. Sidebar `w-64 bg-[#1e293b]`, 워드마크 `ADMIN CONSOLE`/`Admin Console System`, 활성 메뉴 `bg-white/10 translate-x-1`, 프로필 3줄(`최고 관리자`/`Admin_User`/`super-admin@system.com`), Header `bg-slate-50/80 backdrop-blur-md` + 검색 `w-80 시스템 기능 검색...` + 라이트토글 + 알림(dot `bg-error ring-white`) + 프로필 블록(32px + 이름), footer `© 2023 ADMIN CONSOLE...` 직접 확인.
- 현재 구현(fea82f6) 소스 파일 전부 Read:
  - `Sidebar.tsx`, `SidebarNav.tsx`, `SidebarUserFooter.tsx`, `SearchInput.tsx`, `Header.tsx`, `menu-config.ts`, `is-menu-active.ts`, `(app)/layout.tsx`, `(app)/dashboard/page.tsx`, `(app)/users/page.tsx`, `app/page.tsx`, `app/layout.tsx`, `globals.css`, `e2e/admin-shell.spec.ts`.

### 8.1 원본과 달리 간 결정 (strict이므로 최소화, 각 항목 근거 명시)

| 항목 | 원본 (Stitch HTML) | plan 결정 | 이유 |
| --- | --- | --- | --- |
| 아이콘 라이브러리 | Material Symbols Outlined (fill variation) | lucide-react (fill variant 없음) | CLAUDE.md "금지 패턴" 아님이지만, 프로젝트 전반 `lucide-react` 고정(Header·Search 기존 구현 일관성). Material Symbols 추가 시 번들·외부 폰트 CDN 의존 ↑ |
| 활성 메뉴 `FILL 1` 아이콘 전환 | Material Symbols `font-variation-settings: 'FILL' 1` | lucide stroke 아이콘 + **색상 전환만** | 위 결정의 연쇄. 시각 구분은 배경(`bg-white/10`) + transform(`translate-x-1`) + 색(white)으로 이미 충분히 전달됨 |
| 관리자 관리 아이콘 | Material Symbols `manage_accounts` | lucide **`ShieldCheck`** | lucide에 `manage_accounts` 정확 매치 없음. RBAC/권한 관리자 성격 표현에 `ShieldCheck`가 가장 근접 (`UserCog`는 계정 설정 뉘앙스라 오독 가능) |
| 프로필 이미지 (사이드바·헤더) | 구글 사용자 콘텐츠 CDN `lh3.googleusercontent.com/aida-public/...` 실제 이미지 | `<img>` 없이 **회색 원 placeholder** | 외부 CDN 이미지는 Next.js `next/image` remotePatterns 설정·저작권·CSP 영향 → 로그인 슬라이스에서 세션 프로필로 교체. placeholder 원이 레이아웃 점유는 동일 |
| Main footer 꼬리말 | `© 2023 ADMIN CONSOLE. All rights reserved. Architectural Monolith Design System v2.0` | `© {YYYY} ADMIN CONSOLE. All rights reserved.` | "Architectural Monolith Design System v2.0"은 Stitch 디자인 실험용 꼬리말이자 프로젝트 사양과 무관 |
| 프로필 블록(헤더) 상호작용 | Stitch 원본은 단순 `<div>` 표시 | **`<Link href="/admins">` 링크**로 래핑 | Tab 순회 도달 요소를 확정해야 하며(§4.3), 후속 "account-dropdown" 슬라이스 전까지 클릭 시 자기 계정 목록 페이지로 이동하는 임시 동작이 "죽은 요소"보다 낫다 |
| Main 하단 footer 포함 여부 | Stitch 원본에 있음 | **포함** (`(app)/layout.tsx` Shell 공통) | §5.4 — Shell 공통 요소로 취급. 관리자 관리 페이지 본문에 종속되지 않음이 본 개편에서 확정 |
| Sidebar 활성 우측 4px bar | Stitch 원본에 **없음** | 현재 구현에서 **제거** | 기존 plan에서 "bar 없음, accent 배경만"이라고 명시했는데 구현에 bar가 남아있던 실수. Stitch도 없음 — 정상화 |
| 헤더 "The Executive Lens" 브랜드 | Stitch 원본에 **없음** | 현재 구현에서 **제거** | 기존 plan §5.2 "헤더 내 브랜드 금지" 유지. 구현 일탈 정상화 |
| 메뉴 hover 배경 `hover:bg-slate-800/50` | Stitch는 slate-800/50 | slate-800 배경 위에서 slate-800/50은 시각 효과 미미 → **slate-700 half(rgba(51,65,85,0.5))로 조정** 후 토큰 `--sidebar-hover-bg` 신설 | 원본과 동일한 배경 톤에서 hover가 감지되지 않는 실효성 문제. 톤만 한 단계 밝게, 명도는 동일 가족 유지 |

### 8.2 CSS 변수 단일 진실원

- 모든 색상·치수 토큰은 `var(--*)` 참조. hex/rgba 리터럴 **직접 기재 금지**.
- 예외: `globals.css`의 `:root` / `.dark` 블록에서만 토큰 값 선언. 이 외 `.tsx`·`.ts`·`.css module`에서 hex/rgba 리터럴 검출 시 리뷰어 FAIL.

### 8.3 색 토큰 매핑 표

| 역할 | `var(--*)` 이름 | 실제 값 | 출처 (Stitch HTML / namedColors / 관찰) |
| --- | --- | --- | --- |
| Sidebar 배경 | `--sidebar` | `#1e293b` | Stitch `bg-[#1e293b]` (aside) |
| Sidebar 텍스트 기본(워드마크·활성 메뉴·이름) | `--sidebar-foreground` | `#ffffff` | Stitch `text-white` |
| Sidebar 비활성 메뉴 텍스트 | `--sidebar-muted-foreground` | `#94a3b8` (slate-400) | Stitch `text-slate-400` |
| Sidebar sub 텍스트 (워드마크 sub·이메일) | `--sidebar-subtle` | `#94a3b8` (slate-400) | Stitch `text-slate-400` (워드마크 sub / 이메일 둘 다) |
| Sidebar 활성 배경 | `--sidebar-accent` | `rgba(255,255,255,0.1)` | Stitch `bg-white/10` |
| Sidebar 활성 텍스트 | `--sidebar-accent-foreground` | `#ffffff` | Stitch `text-white` |
| Sidebar 메뉴 hover 배경 | `--sidebar-hover-bg` | `rgba(51,65,85,0.5)` (slate-700/50) | Stitch `hover:bg-slate-800/50` 조정 (§8.1) |
| Sidebar 아바타 배경 | `--sidebar-avatar-bg` | `#334155` (slate-700) | Stitch `bg-slate-700` |
| Sidebar 프로필 블록 배경 | `--sidebar-footer-bg` | `rgba(30,41,59,0.4)` (slate-800/40) | Stitch `bg-slate-800/40` |
| Sidebar 프로필 역할 라벨 색 | `--primary-fixed` | `#dae2fd` | Stitch `text-primary-fixed` (namedColors `primary_fixed`) — 이미 `globals.css`에 있음 |
| Header 글래스 배경 | `--header-glass-bg` | `rgb(248 250 252 / 0.8)` (slate-50/80) | Stitch `bg-slate-50/80` — **현재 `rgb(255 255 255 / 0.8)`에서 교체** |
| Header 프로필 이름 색 | `--on-surface` | `#2a3439` | Stitch `text-slate-800`은 프로젝트 `on-surface`(#2a3439)와 거의 동색 — 프로젝트 토큰으로 흡수 |
| Header divider | `--header-divider` | `#e2e8f0` (slate-200) | Stitch `bg-slate-200` (이미 존재) |
| Header 버튼 hover 배경 | `--header-button-hover-bg` | `rgba(226,232,240,0.5)` (slate-200/50) | Stitch `hover:bg-slate-200/50` — 신규 토큰 |
| 알림 dot 색 | `--destructive` | `#9f403d` | Stitch `bg-error` (namedColors `error`) — 기존 토큰 재사용 |
| 알림 dot 링 | `--notification-dot-ring` | `#ffffff` | Stitch `ring-white` (이미 존재) |
| 검색 인풋 배경 | `--search-input-bg` | `#f0f4f7` (surface-container-low) | Stitch `bg-surface-container-low` — **현재 `#f8fafc`에서 교체** |
| 검색 인풋 아이콘 | `--search-input-icon` | `#94a3b8` | Stitch `text-slate-400` (기존) |
| 검색 인풋 focus ring | `--search-input-ring` | `rgb(37 99 235 / 0.2)` | Stitch `focus:ring-primary/20` — 기존 |
| Footer muted foreground | `--footer-muted-foreground` | `rgba(86,97,102,0.6)` (on-surface-variant 60%) | Stitch `text-on-surface-variant/60` — 신규 토큰 |
| Main 배경 | `--background` | `#f7f9fb` | namedColors `background` — 기존 |

**주의**: Stitch HTML의 `tailwind.config.extend.colors`가 design system markdown과 일부 불일치(예: `primary: #565e74`). 본 plan은 **스크린 실측(bg-[#1e293b], bg-white/10 등)을 최종 산출물로 우선**하고, design system markdown의 "The Executive Lens" 토큰 구조는 페이지 배경·surface 계층에만 적용. `--primary`(#0053db)는 Executive Lens namedColors 기준 유지(기존 토큰), 스크린에 `text-primary`가 나타나는 곳은 Stitch CSS 상 `#565e74`지만 프로젝트 `--primary`(#0053db)와 의미가 충돌하지 않음(본 Shell에 `text-primary` 직접 사용처 없음).

### 8.4 폰트 로딩

- 원본 `bodyFont` = Inter, `headlineFont` = Manrope (프로젝트 theme도 동일).
- `app/layout.tsx`에서 `next/font/google`로 Inter→`--font-sans`, Manrope→`--font-heading` 연결 (이미 설정됨, 변경 없음).
- Stitch HTML은 Inter만 로드하고 `fontFamily.headline: ["Inter"]`로 Manrope를 사용하지 않는 상태 — 그러나 **Stitch project designTheme.headlineFont=MANROPE가 우선**이며, 프로젝트 기존 font 로딩 계획을 유지한다. §8.1에 별도 기록 불필요(프로젝트 원칙과 일치).
- 워드마크 "ADMIN CONSOLE"은 Inter font-bold tracking-tight — font-family는 `var(--font-sans)` 사용(Manrope가 아닌 Inter) — Stitch HTML 그대로.

### 8.5 토큰 오버라이드

- Stitch design system namedColors `primary` = `#0053db`를 프로젝트 `--primary`로 유지. 단, Stitch HTML의 `extend.colors.primary` = `#565e74`(neutral 계열)는 design system와 충돌 — 프로젝트는 **namedColors 우선** 정책. 스크린에 `text-primary` 사용처는 브레드크럼("관리자 관리" 활성)·stats 카드 숫자 정도로 본 Shell 슬라이스 범위 밖 — 본 개편에 직접 영향 없음.
- `--sidebar-primary`(기존 우측 bar용 `#2563eb`) 토큰은 **삭제** — 우측 bar 제거로 용처 소멸. shadcn sidebar slot 토큰 네임스페이스를 침범하지 않도록 `@theme inline`의 `--color-sidebar-primary`도 함께 제거 검토(shadcn sidebar 컴포넌트 미사용 시). 결정: **시설 토큰 선언은 유지**(shadcn 원본 유지, 우리는 참조 안 함)하되 값만 `var(--sidebar-accent)`로 재할당해 기존 컴포넌트가 참조해도 무해 처리.
- 헤더 `--header-glass-bg` 값 변경 (`rgb(255 255 255 / 0.8)` → `rgb(248 250 252 / 0.8)`). `.dark`의 값도 Stitch 다크 시안 미정의로 **변경하지 않음**(현재 `rgb(19 27 46 / 0.7)` 유지, M1에 다크 검증 잔재).

### 8.6 No-Line 원칙 (엄격 유지)

- `border`, `border-t/b/l/r`, `divide-*`, vertical divider 클래스 금지. 예외: **헤더 수직 divider `<span>`** 은 `<span>` 요소에 `width:1px; height:32px; background-color: var(--header-divider)`로 구현 — tailwind `border` 클래스 미사용. `<span>` 자체는 `border` 0.
- 본 Shell 슬라이스 범위(`components/layout/**` + `app/(app)/**` + `lib/navigation/**`)에서 `border(-t|-b|-l|-r)?` / `divide-*` 클래스 사용 **0건**(shadcn `components/ui/*` 제외).
- 동일 범위에서 hex literal(`#[0-9a-fA-F]{3,6}`), `rgb(` / `rgba(` 리터럴 직접 기재 **0건**. `globals.css`만 예외.

### 8.7 z-index 계층

**물리적 비중첩 유지**: Sidebar(`left:0 width:var(--sidebar-width)`) vs Header(`left:var(--sidebar-width) right:0`)은 좌우 인접, Main은 `margin-left: var(--sidebar-width); margin-top: var(--header-height)`.

| 요소 | z-index | 근거 |
| --- | --- | --- |
| Main / Footer | 0 | Base |
| Sidebar | **40** (기존 30에서 상향) | Stitch 원본 z-40 매치 |
| Header | **50** (기존 40에서 상향) | Stitch 원본 z-50 매치 — 향후 dropdown(1000+)이 Header를 덮지 않게 여유 유지 |

**규칙**: Shell 고정 레이어 `z < 100`. dropdown/sticky/overlay 대역(`1000+`) 침범 금지.

### 8.8 접근성

- `<aside>` + `<nav aria-label="사이드바 주 메뉴">` — 사이드바 랜드마크.
- `<header>` (`role="banner"` 암묵) — 헤더 랜드마크.
- `<main>` — 본문 랜드마크.
- `<footer role="contentinfo">` — 본 개편 신설.
- 활성 메뉴 `aria-current="page"`.
- 워드마크 Link `aria-label="ADMIN CONSOLE 홈"` 필수 — 내부 `<h2>`/`<p>`는 `aria-hidden="true"`로 accessible name 단일화.
- 모든 아이콘 버튼 `aria-label` 필수: `테마 전환`, `알림`, `프로필`.
- 포커스 링: `var(--ring)`. outline 제거 금지.
- 프로필 링크는 `<Link aria-label="프로필">` — 이름 `Admin_User`가 `<span>`으로 가시되지만 screen reader는 aria-label 우선.

### 8.9 SSR / hydration 경계

- `SidebarNav.tsx`만 `"use client"` (usePathname). `SearchInput.tsx`도 기존 `"use client"` 유지.
- 라이트토글·알림 버튼은 상태 없는 `<button>`로 서버 컴포넌트 가능하지만, 이후 실제 토글 연결을 위해 **`Header.tsx` 내부에 client 경계 분리**는 하지 않고, 버튼 자체는 서버 렌더 + onClick noop. 토글 실연결 시점에 client 경계 재조정 (§11 M4).
- 초기 서버 렌더에서 활성 강조 없음 → hydration 후 확정. CLS ≤ 0.02 회귀 고정.

### 8.10 Safari 이슈 대응

- `-webkit-backdrop-filter` 병기(§R1).
- Sidebar/Header 형제 관계 배치 유지.

### 8.11 로그인 슬라이스 통합 지점

- `(app)/layout.tsx` hook point 주석 유지 (§6).
- `SidebarUserFooter.tsx` 상단에 `// TODO(google-oidc-login): 세션 프로필로 교체 — 역할/이름/이메일 + 아바타 이미지` 주석 신설.
- 헤더 프로필 블록의 `Admin_User` 텍스트와 `<img>` placeholder도 동일 hook point. `Header.tsx` 내 프로필 블록 상단에 동일 TODO 주석.

### 8.12 규약 예외 요청

**없음.** 본 개편은 CLAUDE.md / `docs/rules/**` / `docs/concepts/**` 규약과 충돌하는 결정 없음. 다음 규약을 모두 준수:

- `folder-conventions.md` §라우트 그룹: `(app)` 유지, `(public)` 없음(미해당).
- `folder-conventions.md` §apps/admin: `components/layout/` PascalCase, `lib/navigation/` kebab-case, `app/` 하위 라우팅 파일만.
- CLAUDE.md §코드 컨벤션: default export = page/layout만, 나머지 named.
- CLAUDE.md §금지 패턴: 전부 준수 (문자열 리터럴 query key — 본 슬라이스 query 없음, hex 리터럴 금지 — §8.2 예외 외 0건, legacy 폴더 미수정, proxy.ts 사용 — 본 슬라이스 middleware 무관).
- `dev-workflow.md` §개발 에이전트: deprecation 0, test 커버(§12), TDD 증거는 개발자 리포트에 남김.

---

## 9. 제약 조건

### 9.1 범위

- 데스크톱 전용 (1024px+), 검증 viewport 1280×800.
- 로그인/RBAC 없음.
- 실제 API 호출 없음.
- 테마 토글 실동작 없음 (buttons는 noop).
- 다크모드 시각 검증 없음 (`.dark` 토큰 값 일부만 유지).
- 관리자 관리 페이지 **본문 UI(테이블·stats·브레드크럼·관리자 추가 버튼·페이지네이션·검색 인풋·역할 chips) 전부 범위 밖** — 별도 `admins-list` feature로 후속 `/planning` 요청 예정.

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

- **단일 슬라이스 / 단일 PR**. 기존 admin-shell 구현을 in-place 개편. `/spec admin-shell` → `/dev admin-shell`로 진행.
- google-oidc-login plan은 이미 drop됨(2026-04-16 커밋 `904a497`) — 후속 별도 feature로 재-planning 필요. 본 개편은 google-oidc-login과 **독립 병합 가능**.
- 작업 순서 (개발자 참조):
  1. `menu-config.ts` 2개 축소 + `ShieldCheck` import 교체 (TDD: 축소 단언 → 녹색).
  2. `is-menu-active.test.ts` 케이스 `/users`→`/admins`로 교체.
  3. `git mv apps/admin/src/app/(app)/users apps/admin/src/app/(app)/admins` + `git mv tests/unit/app/(app)/users tests/unit/app/(app)/admins`.
  4. `admins/page.tsx` 내부 문구 교체 (`Users` → `관리자 관리` / placeholder).
  5. `Sidebar.tsx` 워드마크 교체.
  6. `SidebarNav.tsx` bar 제거 + translate-x-1 추가 + rounded-xl + 아이콘 22px.
  7. `SidebarUserFooter.tsx` 3줄 구성 + `최고 관리자` uppercase + 이메일 추가.
  8. `Header.tsx`: "The Executive Lens" 제거, 도움말 제거, 라이트토글 + 프로필 링크 추가, 알림 dot 색/좌표 조정.
  9. `SearchInput.tsx` placeholder 한국어 + 너비 320px.
  10. `globals.css` 토큰 값 업데이트 (§8.3 표 그대로).
  11. `(app)/layout.tsx` footer 추가.
  12. RTL 테스트 전부 갱신(§12.1) — 실패 확인 → 구현 반영 → 그린.
  13. E2E `admin-shell.spec.ts` SC-03/06/07/SEC-04 갱신 — headed 실행.
  14. `pnpm --filter @admin-console/admin dev` 수동 기동 + 스크린샷 육안 확인(§dev-workflow.md §리뷰어).

---

## 11. 완료 기준

### 기능·구조
- [ ] `/` → `/dashboard` 307 redirect (변경 없음 유지).
- [ ] `/dashboard`, `/admins`에서 Shell 4영역(사이드바·헤더·메인·푸터) 전부 가시.
- [ ] 사이드바 폭 256px, 헤더 높이 64px (`var(--sidebar-width)`, `var(--header-height)`).
- [ ] 사이드바 배경 computed `rgb(30, 41, 59)` (= `var(--sidebar)` = #1e293b).
- [ ] 사이드바 워드마크 "ADMIN CONSOLE" + sub "Admin Console System" 둘 다 가시, sub는 uppercase.
- [ ] 사이드바 메뉴 2개 — "대시보드"·"관리자 관리", 다른 라벨(Analytics/Settings/Reports/Users) 전부 부재.
- [ ] 활성 메뉴: `aria-current="page"` + 배경 `rgba(255,255,255,0.1)` + `translate-x-1` transform, **우측 bar `<span>` 부재**.
- [ ] 사이드바 프로필 3줄: `최고 관리자`(uppercase), `Admin_User`, `super-admin@system.com` 전부 렌더, 기존 `Admin User`·`Administrator` 문구 **부재**.
- [ ] 헤더 배경 `var(--header-glass-bg)` + `backdrop-filter: blur(12px)` + `-webkit-backdrop-filter` 병기. computed `backdropFilter` 또는 `webkitBackdropFilter`에 `blur(12px)` 포함.
- [ ] 헤더 좌측 검색 placeholder "시스템 기능 검색...", 너비 320px.
- [ ] 헤더 우측 순서: 라이트토글(aria-label 테마 전환) → 알림(aria-label 알림, red dot) → divider → 프로필 링크(aria-label 프로필, href `/admins`, 이름 `Admin_User`).
- [ ] 헤더 "The Executive Lens" / "The Lens" / "Admin Console" 브랜드 텍스트 **전부 부재**.
- [ ] 헤더 도움말 버튼(aria-label 도움말) **부재**.
- [ ] Main footer `role="contentinfo"` + 텍스트 `© {YYYY} ADMIN CONSOLE. All rights reserved.`.
- [ ] `menu-config.ts` `menuItems.length === 2`, href 값 `["/dashboard","/admins"]`.
- [ ] `is-menu-active` 6 케이스(§12.1.1) 통과.
- [ ] `(app)/layout.tsx` `TODO(google-oidc-login)` hook point 주석 유지.
- [ ] `SidebarUserFooter.tsx`·`Header.tsx`에 `TODO(google-oidc-login)` 세션 교체 주석 존재.
- [ ] `src/app/(app)/users/` 폴더 **부재**, `src/app/(app)/admins/page.tsx` 존재.
- [ ] 사이드바 워드마크 `<Link>`에 `aria-label="ADMIN CONSOLE 홈"` 부여 — 내부 `<h2>`/`<p>`는 `aria-hidden="true"`.

### 회귀 (본 슬라이스 신규 단언)
- [ ] 알림 dot 배경 computed color가 `var(--destructive)` 해석값(= `rgb(159, 64, 61)`)과 일치 (SC-08·SC-09와 별도 회귀).
- [ ] 헤더 라이트/다크 토글 버튼에 `aria-pressed` 속성 **부재** (본 슬라이스 noop 명세 유지).
- [ ] `apps/admin/src/components/layout/Header.tsx`에서 `HelpCircle`·`The Executive Lens` 리터럴 grep **0건**.

### No-Line grep 검증
- [ ] `apps/admin/src/components/layout/**`, `apps/admin/src/app/(app)/**`, `apps/admin/src/lib/navigation/**` 범위에서 `border(-t|-b|-l|-r)?`, `divide-*` 클래스 **0건** (shadcn 제외).
- [ ] 동일 범위에서 `#[0-9a-fA-F]{3,6}`, `rgb\(`, `rgba\(` 리터럴 직접 기재 **0건** (`globals.css` 예외).

### 접근성·랜드마크
- [ ] `<aside>` + `<nav aria-label="사이드바 주 메뉴">`, `<header role="banner">`, `<main>`, `<footer role="contentinfo">` 각 1개.
- [ ] 라이트토글/알림 `aria-label` 부여.
- [ ] 프로필 링크 `aria-label="프로필"`, `href="/admins"`.
- [ ] 헤더 내 브랜드 문자열 부재.
- [ ] Tab 순서 §4.3 일치.

### export·casing
- [ ] `app/**/page.tsx`·`layout.tsx` default export.
- [ ] `Sidebar.tsx`·`Header.tsx`·`SidebarNav.tsx`·`SidebarUserFooter.tsx`·`SearchInput.tsx` named export.
- [ ] `menu-config.ts`·`is-menu-active.ts` named export (kebab-case 파일명).
- [ ] `app/(app)/admins/page.tsx` default export.

### 런타임·성능
- [ ] 1280×800 viewport `/dashboard` 가로 스크롤 없음 (`documentElement.scrollWidth ≤ 1280`).
- [ ] `pnpm --filter @admin-console/admin dev` 기동 시 deprecation warning 0건, runtime error 0건.
- [ ] Lighthouse: 성능 ≥ 90, 접근성 ≥ 95, CLS ≤ 0.02.

---

## 12. 테스트 시나리오

### 12.1 RTL 단위 테스트 (Vitest + Testing Library)

파일명 규칙은 CLAUDE.md §코드 컨벤션 유지: `.test.tsx`는 대상 PascalCase, `.test.ts`는 대상 kebab-case, 라우팅은 `page.test.tsx`/`layout.test.tsx`. 위치는 `apps/admin/tests/unit/**`.

#### 12.1.1 `is-menu-active.test.ts` (6 케이스)
- `/dashboard` → 대시보드 활성
- `/dashboard/anything` → 대시보드 활성
- `/admins` → 관리자 관리 활성
- `/admins/123` → 관리자 관리 활성
- `/adminsettings` → 관리자 관리 **비활성** (false positive 방지)
- `/dashboarding` → 대시보드 **비활성**

#### 12.1.2 `menu-config.test.ts`
- `menuItems.length === 2`.
- 항목 0: `label === "대시보드"`, `href === "/dashboard"`, `icon === LayoutDashboard`.
- 항목 1: `label === "관리자 관리"`, `href === "/admins"`, `icon === ShieldCheck`.
- `menuItems.some(i => ["/users","/analytics","/settings","/reports"].includes(i.href))` **false**.

#### 12.1.3 `SidebarNav.test.tsx`
- `/dashboard`에서 "대시보드" `aria-current="page"`, "관리자 관리" 없음.
- `/admins`에서 "관리자 관리" `aria-current="page"`, "대시보드" 없음.
- 메뉴 항목이 `role="link"`(Next.js `<Link>`) + Tab 포커스 가능.
- 활성 항목의 `transform` 또는 클래스에 `translate-x-1` 흔적 존재 (`getComputedStyle(el).transform` ≠ `none`, 또는 className `translate-x-1` 매치 — jsdom에서 transform 계산 불가하면 후자 허용).
- **활성 항목 자식으로 `<span>` (우측 4px bar) 없음** — DOM 스냅샷 또는 `within(activeLink).queryByRole("presentation")` null.

#### 12.1.4 `Sidebar.test.tsx`
- `<nav aria-label="사이드바 주 메뉴">` 존재.
- 워드마크 `ADMIN CONSOLE` + sub `Admin Console System` 둘 다 존재.
- 워드마크 `<Link role="link" href="/dashboard">` 포커스 가능.
- 워드마크 링크가 `aria-label="ADMIN CONSOLE 홈"`을 가진다(`getByRole("link", { name: "ADMIN CONSOLE 홈" })` 일치).
- 기존 문자열 `The Lens` 부재.

#### 12.1.5 `SidebarUserFooter.test.tsx`
- `최고 관리자`, `Admin_User`, `super-admin@system.com` 세 문자열 전부 존재.
- 기존 `Admin User`, `Administrator` 문자열 **부재**.
- 역할 라벨 요소의 className 또는 styled 속성에 `uppercase` + `tracking-wider` 근거 (test-id로 node 획득 후 `textTransform === "uppercase"`).
- `TODO(google-oidc-login)` 주석은 소스 grep로 별도 검증(테스트 외).

#### 12.1.6 `Header.test.tsx`
- 검색 인풋 placeholder `시스템 기능 검색...` 렌더.
- 라이트토글 버튼: `toHaveAttribute("aria-label", "테마 전환")` + `not.toHaveAttribute("aria-pressed")` (본 슬라이스 noop — aria-pressed 부재 고정).
- 알림 버튼: `aria-label="알림"`.
- 프로필 링크: `aria-label="프로필"`, `href="/admins"`, 텍스트 `Admin_User` 존재.
- 헤더 내부 텍스트에 `"The Executive Lens"`, `"Admin Console"`, `"HelpCircle"` 리터럴 전부 부재 (within header scope).
- `"The Lens"` 문자열 부재.
- 도움말(`aria-label="도움말"`) 버튼 **부재**.
- `HelpCircle` 아이콘 lucide import 제거 (소스 grep — §11 회귀 체크 항목과 동일 범위).

#### 12.1.7 `SearchInput.test.tsx`
- placeholder `시스템 기능 검색...` 단언.
- 너비 320px — inline `style.width` 또는 className `w-80` 매치.

#### 12.1.8 `layout.test.tsx` ((app) 그룹)
- `<aside>`, `<header>` (role banner), `<main>`, `<footer>` (role contentinfo) 랜드마크 각 1개.
- children이 `<main>` 내부 렌더.
- footer 내부에 `© {현재연도} ADMIN CONSOLE. All rights reserved.` 패턴 매치(`getFullYear()` 동적).

#### 12.1.9 `admins/page.test.tsx`
- `<h1>` `관리자 관리` 렌더.
- placeholder 문구 `관리자 목록은 후속 슬라이스에서 추가됩니다.` 렌더.
- 기존 `Users` 문자열 부재.

#### 12.1.10 `dashboard/page.test.tsx`
- 변경 없음 (기존 유지).

#### 12.1.11 `app/page.test.tsx`
- `redirect("/dashboard")` 호출 검증, 기존 유지.

### 12.2 Playwright E2E (`e2e/admin-shell.spec.ts`)

**운영 경로**:
- 로컬 개발: `pnpm e2e` = `--headed` 기본.
- CI: `CI=1` 자동 감지 시 `--headless`.
- viewport **1280×800 고정**.

**시나리오**:

1. **SC-01 루트 리다이렉트**: `/` → URL `/dashboard` (기존 유지).
2. **SC-02 Shell 랜드마크 가시**: `/dashboard`에서 `role="complementary"(or aside)`, `role="banner"`, `role="main"`, `role="contentinfo"` 모두 visible.
3. **SC-03 메뉴 이동**: `nav[aria-label="사이드바 주 메뉴"]` 내 `a[href="/dashboard"]` 활성 확인 → `a[href="/admins"]` 클릭 → URL `/admins`, `a[href="/admins"]` `aria-current="page"`, `a[href="/dashboard"]` 비활성. aside/banner 그대로 visible.
4. **SC-04 prefix 매칭 런타임**: `/admins/abc` 접근 → 동적 라우트 미정의로 404, Shell 미렌더 (기존 해석 유지).
5. **SC-05 viewport 1280×800 가로 스크롤 없음**: `scrollWidth <= 1280`.
6. **SC-06 키보드 Tab 순회**: body 시작 → Tab 반복 → 각 focused 요소의 accessible name을 수집해 `expectedSequence`와 **완전일치** 비교(7단계).

   매칭 함수(E2E 재구현 필수):
   ```
   name = element.getAttribute("aria-label")
       ?? (element as HTMLInputElement).placeholder
       ?? element.textContent?.replace(/\s+/g, " ").trim()
       ?? ""
   ```

   expectedSequence (7단계, 완전일치):
   1. `"ADMIN CONSOLE 홈"`       // 워드마크 Link aria-label
   2. `"대시보드"`                 // 사이드바 메뉴 1
   3. `"관리자 관리"`              // 사이드바 메뉴 2
   4. `"시스템 기능 검색..."`       // 검색 input placeholder
   5. `"테마 전환"`                // 라이트/다크 토글 aria-label
   6. `"알림"`                     // 알림 버튼 aria-label
   7. `"프로필"`                   // 프로필 링크 aria-label

   match 로직: `name`이 `expectedSequence`의 다음 대기 항목과 정확히 일치하면 `collected`에 push (순서 보존). 기존 구현의 `includes` 검사는 폐기 — 완전일치로 교체.
7. **SC-07 헤더 브랜드 부재**: `role="banner"` textContent에 `Admin Console`, `The Executive Lens`, `The Lens` **3개 전부 0건**.
8. **SC-08 glass 효과 실측**: `getComputedStyle(header).backdropFilter`/`webkitBackdropFilter`에 `blur(12px)` 포함.
9. **SC-09 No-Line 런타임 (범위)**: `aside`, `header[role="banner"]`, `footer[role="contentinfo"]` 및 각 직접 자식 요소의 `border*Width` 전부 `0px`. (header 내부의 divider `<span>`은 border가 아닌 `background-color`로 구현하므로 통과.)
10. **SEC-01 Set-Cookie**: `/dashboard` 응답 헤더 — 세션 관련 쿠키가 있다면 `HttpOnly` 필수. 본 슬라이스 인증 없으므로 세션 쿠키 자체 0건 기대.
11. **SEC-02 storage 토큰 부재**: `localStorage`/`sessionStorage` 키에 `session-token`/`access_token`/`id_token`/`refresh_token`/`oidc`/`auth`/`jwt`/`bearer` 부분문자열 0건.
12. **SEC-04 인증 가드 미적용**: `/dashboard`, `/admins` 모두 200. TODO hook point 스펙 일치.

### 12.3 테스트 ↔ 완료기준 매핑 (개발자 체크리스트)

| 완료기준 항목 | 담당 테스트 |
| --- | --- |
| 사이드바 배경 #1e293b | E2E SC-09 간접 / RTL `Sidebar.test.tsx`에서 `getComputedStyle` |
| 메뉴 2개 | `menu-config.test.ts` + E2E SC-03 |
| 활성 translate-x-1 + bar 부재 | `SidebarNav.test.tsx` |
| 프로필 3줄 + 이메일 | `SidebarUserFooter.test.tsx` |
| 헤더 브랜드 부재 | `Header.test.tsx` + E2E SC-07 |
| 도움말 버튼 부재 | `Header.test.tsx` |
| 라이트토글 + 알림 + 프로필 링크 | `Header.test.tsx` + E2E SC-06 |
| Main footer contentinfo | `layout.test.tsx` + E2E SC-02 |
| /users 부재 /admins 존재 | `admins/page.test.tsx` + E2E SC-03/SEC-04 |
| Tab 순회 7단계 | E2E SC-06 |
| glass blur(12px) | E2E SC-08 |
| No-Line | E2E SC-09 + grep in §11 |
| SSR/hydration CLS ≤ 0.02 | Lighthouse CI |

---

## 13. 미결 사항

- **M1.** 다크모드 시각 검증 — `.dark` `--header-glass-bg` / 사이드바 어떻게 반전할지. 현재 `.dark` 값 유지하되 다크 슬라이스에서 전면 재설계.
- **M2.** 테마 토글 실동작 시점 — next-themes 도입 or 자체 context. 별도 "theme-toggle" 슬라이스로 분리.
- **M3.** 알림 드롭다운 실구현 — 별도 "notification-panel" 슬라이스.
- **M4.** 프로필 드롭다운 실구현 — 별도 "account-dropdown" 슬라이스. 본 슬라이스 `<Link href="/admins">`는 임시 동작이며, 드롭다운 도입 시 `<button>`으로 교체 + Tab 순서 동일 유지.
- **M5.** 관리자 관리 페이지 본문(테이블·stats·브레드크럼·관리자 추가 버튼) — 별도 "admins-list" feature. `/planning admins-list` 필요.
- **M6.** 사이드바 메뉴 3개 이상 확장 시 섹션 그룹화 규칙 — 실제 확장 시 재기획.
- **M7.** 사이드바 접기/펼치기 토글(§기존 M5 유지).
- **M8.** `menu-config` 타입에 `permission?` 선제 도입 여부 — RBAC 슬라이스에서 결정.
- **M9.** `<nav>` `aria-label="사이드바 주 메뉴"` 한국어 확정 — i18n 슬라이스에서 재검토.
- **M10.** Stitch HTML의 `tailwind.config` `primary:#565e74`와 design system `primary:#0053db` 불일치 — 본 개편은 namedColors 우선으로 해결했으나, 향후 stats/chip 컴포넌트 도입 시 **재확인 필요**. 특히 Stitch 관리자 관리 스크린의 "관리자 추가" 버튼 gradient `from-primary to-primary-dim`이 #0053db→#0048c1(Executive Lens)인지 #565e74→#4a5268(HTML extend)인지 결정해야 함 — admins-list feature에서 확정.
- **M11.** 활성 메뉴 아이콘 filled variant — lucide에서는 생략했지만, 장기적으로 `lucide-react/icons` 중 `Users`/`UsersRound` 처럼 쌍이 있는 경우 대응 여부 — icon-pairs 규칙이 정해지면 재검토.
- **M12.** 사이드바 배경 톤 선택의 다크모드 연속성 — `#1e293b`을 라이트 모드 사이드바로 고정했으나, 본체 배경 `#f7f9fb`이 밝아 대비 과다 우려. 디자이너 승인 전제로 유지.

---

## 14. 다음 단계

1. 본 개편 plan을 `/spec admin-shell`에 투입 → `docs/specs/changes/admin-shell/` 산출물 갱신 (기존 산출물이 있다면 덮어쓰기 또는 새 change로 생성, spec skill이 판단).
2. `/dev admin-shell` → 단일 슬라이스 in-place 개편, 리뷰어 런타임 기동, 테스터 E2E headed.
3. 완료 후 `/planning admins-list` (관리자 관리 페이지 본문).
4. 병렬로 `/planning google-oidc-login` 재시도 (기존 plan drop됨, 새 목업 "로그인 - Admin Console" 스크린 `projects/4047049138455434101/screens/167ac7805e104cb7908accbb4c71497b` 기준으로 재-planning).
5. 로그인 병합 후 `(app)/layout.tsx` hook point 실제 `auth()` 가드 교체 micro-PR + `SidebarUserFooter.tsx`/`Header.tsx` 프로필 블록 세션 연결 micro-PR.

---

## 15. Risk

| ID | Risk | Mitigation | Trigger | Fallback |
| --- | --- | --- | --- | --- |
| R1 | Safari `backdrop-filter` + `position: fixed` 조합에서 stacking context 재생성으로 z-index 뒤집힘 | Sidebar/Header 물리적 비중첩(§8.7) + 형제 배치 + `-webkit-backdrop-filter` 병기 + Playwright WebKit 프로젝트로 SC-08 실행 | Safari 버전 업 또는 WebKit 픽스 | `backdrop-filter` 제거 + `var(--card)` 불투명 배경으로 degrade |
| R2 | 레이아웃 상수 중복으로 사이드바 폭·헤더 높이 변경 시 한쪽만 바뀜 | `--sidebar-width`, `--header-height` 단일 변수(§8) + §11 hex/상수 grep | 폭·높이 변경 요청 | 변수 1개만 수정 |
| R3 | SSR 활성 메뉴 미표기 → hydration flash | 활성 판정을 `SidebarNav.tsx`(`"use client"`)에 격리, CLS 회귀 | Next/React 버전 업 | `headers()` 기반 Server Component 활성 판정 (복잡도↑, 최후) |
| R4 | 워드마크 중복(사이드바+헤더) 스크린리더 이중 읽기 | 헤더 브랜드 제거 유지(§5.2), SC-07 + `Header.test.tsx`로 회귀 고정 | 추후 헤더 브랜드 추가 PR | RTL/E2E fail로 차단 |
| R5 | `features/navigation/` 오배치 유혹 | `lib/navigation/` 유지, folder-conventions 재확인 | 후속 PR에서 파일 이동 제안 시 | 리뷰어 차단 |
| R6 | Next.js 16 `redirect()` in `page.tsx` 동작 변경 | changelog 모니터 | Next.js 16 minor 업 | `proxy.ts`로 이관 |
| R7 | `/users` → `/admins` 라우트 변경으로 외부 링크·북마크 끊김 | **현재 배포 환경 없음(로컬 전용)** → 영향 범위 사내 개발자 링크만. 변경 안내는 PR 메시지·setup.md로 충분 | 외부 공개 배포 후 동일 변경 시 | `app/(app)/users/page.tsx`에 `redirect("/admins")` 추가 (본 슬라이스에서는 미적용 — 불필요 파일 유발) |
| R8 | `--sidebar-primary` 토큰 제거로 shadcn sidebar 컴포넌트 기본값 깨짐 | shadcn sidebar 컴포넌트 **현재 미사용**. 토큰 선언 자체는 `globals.css`에 유지(값만 `var(--sidebar-accent)` 재할당) | shadcn sidebar 도입 시 | 실제 도입 시점에 토큰 재설계 |
| R9 | Stitch HTML `tailwind.config` primary(#565e74)와 design system namedColors primary(#0053db) 불일치 → 후속 admins-list에서 stats 색 혼란 | 본 개편은 namedColors 우선 고정, M10에 기록 | admins-list 슬라이스 진입 시 | 디자이너 확인 + namedColors 유지 또는 tailwind extend 반영 |
| R10 | 프로필 링크(`<Link href="/admins">`)가 후속 드롭다운 슬라이스에서 `<button>`으로 교체될 때 Tab 순서·aria-label 일관성 깨짐 | §4.3 Tab 순서 회귀 테스트 SC-06 유지, 드롭다운 도입 PR에서 동일 시퀀스 단언 | 드롭다운 슬라이스 착수 | 드롭다운 PR 리뷰에서 SC-06 갱신 강제 |
| R11 | Stitch 원본 프로필 이미지 외부 CDN (`lh3.googleusercontent.com/aida-public/...`) 사용 시 CSP/`next/image` remotePatterns 미설정으로 실패 | 본 슬라이스 이미지 **미로드**, 회색 원 placeholder만 | 로그인 슬라이스 병합 시 실사 사진 연결 | `next/image` 대신 `<img>` + remotePatterns 추가 또는 Google People API 프록시 |
| R12 | 헤더 "The Executive Lens" 재혼입 | SC-07 + `Header.test.tsx` 브랜드 부재 단언 3종("Admin Console"/"The Executive Lens"/"The Lens") | 디자인 리뷰에서 브랜드 요청 재발 | 리뷰어 차단 |
