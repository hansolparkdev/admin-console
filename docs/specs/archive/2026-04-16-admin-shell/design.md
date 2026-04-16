## Context

커밋 `fea82f6`(2026-04-15)에서 admin-shell이 Stitch "Admin Console Layout" 프로젝트의 Executive Lens 초기 시안 기준으로 구현됐다. 이후 동일 Stitch 프로젝트의 "관리자 관리" 스크린(`screens/22a279f223604f1d9366dd0d6f8cdbd9`)으로 목업이 교체되어 사이드바 배경·워드마크·활성 메뉴 스타일·헤더 구성이 모두 변경됐다. Shell 파일 구조(`(app)` 라우트 그룹, hook point, `(public)` 미적용)와 No-Line 원칙은 그대로 유지하며, 내부 마크업·스타일·메뉴 구성·라우트명만 in-place 개편한다.

## Goals / Non-Goals

**Goals:**
- Stitch "관리자 관리" 스크린 strict 충실도 반영 (허용 편차는 아래 Decisions에 명시)
- `/users` → `/admins` 라우트 리네임으로 도메인 확정 및 Ghost 라우트 제거
- Main footer(`role="contentinfo"`) 신설로 Shell 4영역 완성
- CSS 토큰 단일 진실원 유지 (`globals.css` `:root`만 hex/rgba 허용)
- 접근성 랜드마크·Tab 순서 7단계 일치 유지

**Non-Goals:**
- 다크모드 시각 검증 — `.dark` 블록 일부 값 유지에 그침
- 라이트/다크 토글 실동작
- 관리자 관리 페이지 본문 UI
- 인증 가드 실구현

## Decisions

### 1. 라이트토글 noop + aria-pressed 부재

라이트/다크 토글 버튼은 본 슬라이스에서 클릭해도 테마 전환이 없으므로 toggle pressed 상태가 없다. `aria-pressed`를 `false`로 고정하면 스크린리더가 "버튼, 토글되지 않음"을 읽어 실제 noop과 불일치 메시지를 발신한다. `aria-pressed` 속성 자체를 생략해 일반 버튼으로 노출하고, 실제 토글 슬라이스 도입 시 속성을 추가하는 방식이 더 정직한 접근이다.

**이유**: ARIA 1.2 기준 `aria-pressed` 없는 `role="button"`은 상태 없는 버튼을 의미함. 실제 동작 없이 `aria-pressed="false"` 선언은 접근성 거짓 정보.

### 2. 프로필 이미지: 회색 원 placeholder (`<img>` 미사용)

Stitch HTML 원본은 Google CDN(`lh3.googleusercontent.com/aida-public/...`) 실제 이미지를 사용한다. 그러나 외부 CDN 이미지는 Next.js `next/image` remotePatterns 설정·저작권·CSP 영향이 있고, 로그인 슬라이스 병합 전에는 실제 세션 프로필이 없다. `<img>` 없이 빈 회색 원(`<div>`)으로 동일 크기를 점유하며 레이아웃 일관성을 유지한다.

**이유**: 외부 이미지 CDN 의존 없이 레이아웃 점유는 동일. 로그인 병합 시 hook point 주석(`// TODO(google-oidc-login)`)에서 교체.

### 3. 관리자 관리 아이콘: lucide `ShieldCheck` (Material Symbols 미사용)

Stitch HTML은 Material Symbols `manage_accounts`를 사용한다. 프로젝트는 `lucide-react` 전체 통일 정책이며 Material Symbols 추가는 외부 폰트 CDN 의존과 번들 증가를 유발한다. lucide에 `manage_accounts` 정확 매치가 없어 RBAC 관리자 성격을 직접 표현하는 `ShieldCheck`를 선택한다(`UserCog`는 계정 설정 뉘앙스로 오독 가능).

**이유**: lucide 단일 라이브러리 유지. `ShieldCheck`이 "권한 가진 관리자" 의미를 가장 근접하게 전달.

### 4. 라우트 리네임 /users → /admins (git mv)

`git mv`로 디렉터리 단위 이동해 파일 히스토리를 보존한다. 삭제·재생성이 아닌 이동이므로 git blame·리뷰가 연속성을 유지한다.

**이유**: 히스토리 보존이 코드 리뷰 맥락 유지에 중요. 삭제 커밋이면 이전 기획 결정 추적이 어려워짐.

### 5. 워드마크 aria-label + 자식 aria-hidden

워드마크 `<Link>`에 `aria-label="ADMIN CONSOLE 홈"`을 선언하고 내부 `<h2>`·`<p>`는 `aria-hidden="true"`로 처리한다. 링크의 accessible name이 aria-label로 단일화되어 스크린리더가 "ADMIN CONSOLE / Admin Console System / ADMIN CONSOLE 홈" 중복 읽기를 하지 않는다.

**이유**: ARIA 1.2 accessible name 연산 규칙에서 aria-label이 자식 텍스트보다 우선함. 자식 aria-hidden은 중복 읽기 방지를 명시적으로 보장.

### 6. Main footer 포함 — Shell 공통 요소로

Stitch "관리자 관리" 스크린 하단에 copyright footer가 있다. 페이지별 삽입이 아닌 `(app)/layout.tsx`의 Shell 공통 마지막 요소로 포함해 모든 인증 필요 페이지에서 일관성을 유지한다.

**이유**: footer는 특정 페이지 콘텐츠가 아닌 Shell 구조물. `(app)/layout.tsx` 포함이 유지보수 단일 진실원.

### 7. Sidebar z-index 40, Header z-index 50 (기존 대비 상향)

Stitch 원본이 `z-40`(sidebar)·`z-50`(header)을 사용한다. 기존 구현은 30/40이었다. 후속 dropdown/overlay(`1000+`) 슬라이스가 헤더를 넘어서지 않으려면 Shell 고정 레이어가 `< 100` 범위에 있어야 한다. 40/50은 이 조건을 충족한다.

**이유**: Stitch 원본 일치 + dropdown 대역과 충돌 없는 여유 확보.

### 8. --sidebar-primary 토큰 유지 (재할당)

우측 4px bar 제거로 `--sidebar-primary`의 용도가 소멸됐다. shadcn sidebar 컴포넌트 네임스페이스와 겹칠 수 있으므로 토큰 선언은 유지하되 값을 `var(--sidebar-accent)`으로 재할당한다. 이 토큰을 참조하는 코드가 있어도 의도치 않은 파란색(기존 `#2563eb`)이 나타나지 않는다. 후속 다크모드 슬라이스에서 용도를 재결정한다.

**이유**: 토큰 삭제 시 shadcn 내부 참조 오류 가능성 + 하위 호환 유지.

## Risks / Trade-offs

- **R1 Safari backdrop-filter + position:fixed stacking context**: Sidebar/Header 물리적 비중첩(좌우 인접) + `-webkit-backdrop-filter` 병기로 완화. fallback: `backdrop-filter` 제거 + 불투명 배경.
- **R2 레이아웃 상수 중복**: `--sidebar-width`/`--header-height` 단일 변수 참조. hex 상수 중복 grep으로 회귀 방지.
- **R3 prefix 매칭 false positive (/adminsettings)**: `is-menu-active` 함수 계약은 변경 없이 "다음 문자가 `/` 또는 문자열 끝" 조건 유지. 테스트에 `/adminsettings` 케이스 추가로 회귀 방지.
- **R4 Tab 순서 깨짐**: 라이트토글 신설·프로필 링크 신설로 Tab 순서가 7단계로 변경됨. E2E SC-06 `expectedSequence` 완전일치로 회귀 방지.
- **R5 메뉴 아이콘 크기 변경(20px → 22px)**: SidebarNav에서 터치 타겟 `≥ 44px` 유지 확인. 레이아웃 영향 없음.
- **R6 CLS hydration**: SidebarNav `"use client"`(usePathname), SearchInput `"use client"`. 서버 렌더 시 활성 강조 없다가 hydration 후 확정. Lighthouse CLS ≤ 0.02 회귀 고정.
- **R7 --header-glass-bg 값 변경 → .dark 블록 누락**: `.dark` 블록의 `--header-glass-bg`는 다크 시안 미정의로 기존 `rgb(19 27 46 / 0.7)` 유지. 다크모드 슬라이스에서 재결정.
- **R8 No-Line grep 회귀**: 개편 중 실수로 border 클래스나 hex 리터럴이 진입할 수 있음. 완료 기준 grep 검증(`§11 No-Line`)으로 차단.
- **R9 git mv + 테스트 파일 누락**: `users/` → `admins/` 이동 시 테스트 파일도 동시에 mv. 누락 시 CI 실패로 즉시 발견.
- **R10 aria-pressed 부재로 인한 Lighthouse 접근성 점수 영향**: 검토 결과 `aria-pressed` 없는 일반 `<button>`은 접근성 위반이 아님. 오히려 noop 버튼에 `aria-pressed`를 선언하는 것이 거짓 상태 정보.
- **R11 --sidebar-primary 재할당 후 shadcn 컴포넌트 색상 변화**: 본 슬라이스에서 shadcn sidebar 컴포넌트를 직접 사용하지 않으므로 영향 없음. 도입 시점에 재검토.
- **R12 워드마크 폰트 Inter vs Manrope**: Stitch HTML은 `ADMIN CONSOLE`에 Inter를 사용함. 프로젝트 headlineFont=Manrope와 다르지만 Stitch strict 충실도 우선. `var(--font-sans)`(Inter)로 워드마크 렌더.
