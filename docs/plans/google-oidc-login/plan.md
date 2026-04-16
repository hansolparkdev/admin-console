# 기획서: Google OIDC 로그인 & 세션 관리

> ⚠️ 경고: 비평 3회 후 미해결 문제 있음. 검토 후 진행하세요.
> 미해결: 3회차 비평이 "기획서 본문 누락"으로 자동 FAIL 처리됨 (critic 전달 오류, 내용 자체 문제 아님). 1·2회차 P0 지적(로그아웃 AlertDialog 복원, F2 허용도메인 비목표 복귀)은 반영 완료. 사용자 검토 후 /spec 진입 여부 결정 권장.

## 1. 배경 및 목적

### 1.1 왜 이 기능이 필요한가

admin-console은 운영자 대상 어드민 콘솔이다. 현재 `apps/admin`에는 BFF 프록시 레일과 TanStack Query 구조는 구축되어 있으나 실제 인증 주체가 없어 누구나 보호 라우트에 접근 가능한 상태다. Auth.js v5 + Google OIDC를 연결해 "조직 계정으로 로그인한 사용자만 콘솔에 진입" 규칙을 실제로 강제해야 한다.

### 1.2 해결하려는 문제

- 보호 라우트가 세션 없이 열려있음 → 비인가 접근 가능
- BFF 프록시가 사용자 신원 없이 upstream을 호출 → 감사 로그·RBAC 기반 미비
- 운영자 신원 확인 수단 부재 → 감사 추적 불가

### 1.3 성공 지표 (측정 가능)

| 지표 | 기준값 | 측정 방법 |
| --- | --- | --- |
| 로그인 성공률 | ≥ 99% (Google OIDC 정상 응답 중) | BFF 로그 `auth.callback.success / total` |
| 로그인 소요 시간 (리다이렉트 포함) | p95 ≤ 3초 | 클라이언트 timing 측정 |
| 세션 만료 후 자동 재인증(refresh) 성공률 | ≥ 98% | JWT callback refresh 성공/시도 비율 |
| 보호 라우트 미로그인 접근 차단율 | 100% | E2E 회귀 테스트 |

---

## 2. 사용자

### 2.1 주요 사용자

- **내부 운영자**: admin-console에 로그인해 공지/사용자/대시보드를 다루는 조직 구성원.

### 2.2 사용 맥락

- 업무 시간 중 사내망 또는 VPN 환경에서 브라우저로 접속.
- 개인 Google 계정이 아닌, 조직에서 발급한 Google Workspace 계정 사용을 기대. 단, 도메인 제한은 이번 슬라이스 범위가 아니며 RBAC 슬라이스에서 도입.
- 동일 사용자가 하루에도 여러 번 탭 전환·새 창 오픈 → 세션 상태 일관성이 중요.

### 2.3 사용자 목표

- 한 번 로그인하면 합리적인 기간 동안 재입력 없이 업무 수행.
- 자신이 누구로 로그인되어 있는지 상단에서 즉시 확인.
- 로그아웃 의도는 실수 방지를 위해 한 번 더 확인받은 뒤 즉시 실행.

---

## 3. 핵심 기능

- **F1. Google OIDC 로그인** — `/login`의 "Google로 로그인" 버튼 → Google 동의 화면 → 콜백 복귀 → 보호 라우트 진입.
- **F2. 세션 유지** — 로그인 성공 시 httpOnly 쿠키 기반 세션 발급, 새로고침/탭 이동 후에도 유지.
- **F3. 토큰 자동 갱신 (refresh)** — Google access token 만료 시 refresh token으로 서버측에서 자동 갱신. 사용자 조작 불필요.
- **F4. 보호 라우트 접근 제어** — 미로그인 상태로 보호 라우트 진입 시 `/login`으로 리다이렉트. 로그인 후 원래 목적 URL로 복귀.
- **F5. 이미 로그인된 상태에서 `/login` 접근 시 보호 홈으로 리다이렉트.**
- **F6. BFF 프록시의 Bearer 주입** — 브라우저는 `/api/*`만 호출, BFF가 세션의 access token을 `Authorization: Bearer`로 변환해 `apps/api`로 전달.
- **F7. 로그아웃 확인 다이얼로그** — 상단 아바타 메뉴의 "로그아웃" 항목 → shadcn AlertDialog 확인 → 세션 파기 후 `/login` 복귀. 취소 시 세션 유지.
- **F8. 사용자 프로필 표시** — 상단 헤더 아바타(+이니셜 fallback), 드롭다운 내 이름·이메일 표시.

---

## 4. 사용자 흐름

### 4.1 정상 흐름 — 최초 로그인

1. 사용자가 `/` 또는 `/dashboard` 등 보호 라우트로 진입.
2. 세션 없음 → `/login?callbackUrl=<원래경로>`로 리다이렉트.
3. "Google로 로그인" 버튼 클릭.
4. Google 동의 화면에서 계정 선택·동의.
5. 콜백 처리 완료 → `callbackUrl`로 리다이렉트 (same-origin 검증 통과 후).
6. 상단 우측 아바타에 Google 프로필 이미지(또는 이니셜) 표시.

### 4.2 정상 흐름 — 재방문

1. 유효한 세션 쿠키를 가진 사용자가 `/login`으로 직접 진입.
2. 이미 로그인 상태 감지 → 보호 홈(`/`)으로 307 리다이렉트.

### 4.3 정상 흐름 — 자동 refresh

1. 사용자가 보호 라우트에서 `/api/*` 호출.
2. BFF가 세션의 access token 만료 감지.
3. 서버측에서 refresh token으로 Google 토큰 엔드포인트 호출 → 새 access token 수령.
4. 세션 갱신 후 upstream 요청 진행 → 사용자는 체감 불가.

### 4.4 정상 흐름 — 로그아웃 (AlertDialog 포함)

1. 상단 우측 아바타 클릭 → DropdownMenu 오픈 (이름·이메일·구분선·"로그아웃" 항목 표시).
2. "로그아웃" 항목 클릭.
3. shadcn AlertDialog 오픈
   - 제목: `"로그아웃 하시겠습니까?"`
   - 본문: `"다시 로그인하려면 Google 인증을 다시 거쳐야 합니다."`
   - 버튼: `[취소]` `[로그아웃]` (destructive variant)
4. `[로그아웃]` 클릭 → `signOut({ callbackUrl: "/login" })` 호출 → 세션 쿠키 파기.
5. `/login`으로 리다이렉트, 우측 하단 Sonner 토스트 "로그아웃되었습니다" 노출.

### 4.5 예외 흐름

- **E1. Google 로그인 중 사용자가 취소** → Google이 `/login`으로 에러 쿼리와 함께 복귀 → "로그인이 취소되었습니다" 안내 배너.
- **E2. Google 쪽 장애(5xx/타임아웃)** → `/login`에 "일시적으로 로그인할 수 없습니다. 잠시 후 다시 시도해주세요" 배너, 재시도 버튼 노출.
- **E3. 콜백 단계에서 Auth.js 내부 에러** → `/login?error=<code>`로 복귀, 코드별 사용자 친화 메시지 매핑.
- **E4. 세션 만료 후 보호 라우트 접근** → `/login?callbackUrl=<현재경로>`로 리다이렉트.
- **E5. refresh 성공 (백그라운드)** → 사용자는 체감하지 못하고 요청 진행.
- **E6. refresh 실패 (refresh token 무효/회수)** → 세션 쿠키 파기 후 `/login?error=SessionExpired`로 리다이렉트.
- **E7. 로그아웃 확인 다이얼로그에서 [취소] 클릭** → AlertDialog 닫힘, 세션 유지, 현재 화면 그대로.
- **E8. 로그아웃 확인 다이얼로그에서 [로그아웃] 클릭** → 세션 파기 → `/login` 복귀.
- **E9. 동일 브라우저의 다른 탭에서 로그아웃** → 현재 탭에서 다음 `/api/*` 요청 시 401 감지 → `/login`으로 이동.
- **E10. callbackUrl에 외부 호스트 / `//` / `javascript:` 주입** → same-origin 검증 실패 → `/`로 fallback.

---

## 5. 화면 구성

### 5.1 화면: `/login`

- **목적**: 비로그인 사용자가 Google 계정으로 로그인을 시도하는 단일 진입 화면.
- **레이아웃**: 중앙 정렬 Card (width 400px 기준). 상단 로고·서비스명, 중앙 설명 문구, 하단 Google 로그인 버튼, 그 아래 에러/안내 배너 영역.
- **요소**:
  - 서비스 로고, 타이틀 "Admin Console"
  - 설명 "조직 Google 계정으로 로그인하세요"
  - 기본 버튼: "Google로 로그인" (Google 브랜드 가이드 준수 아이콘+텍스트)
  - 에러/안내 배너 (쿼리 `?error=`, `?callbackUrl=` 기반)
- **인터랙션**:
  - 버튼 클릭 → `signIn("google", { callbackUrl })` → Google로 리다이렉트.
  - 이미 로그인 상태로 진입 → 보호 홈으로 리다이렉트 (화면 렌더 전, middleware 담당).
- **상태**:
  - 기본 상태
  - 로딩 상태 (버튼 spinner, disabled)
  - 에러 상태 (배너 표시, 버튼 재활성)
  - 안내 상태 (`SessionExpired`, 로그인 취소 등)

### 5.2 화면: 헤더 — 사용자 메뉴 (아바타 + 드롭다운 + 로그아웃 AlertDialog)

- **목적**: 로그인 사용자 신원 확인 및 로그아웃 경로 제공 (실수 방지를 위한 확인 단계 포함).
- **레이아웃**: 최상단 헤더 우측. 아바타 원형 32px. 드롭다운은 우측 정렬.
- **요소**:
  - 아바타: Google picture → 없거나 로드 실패 시 이니셜 fallback.
    - fallback 우선순위: `name → email local-part → "?"`
  - DropdownMenu (아바타 클릭 시 오픈):
    - 상단: 이름 (굵게) + 이메일 (보조 색)
    - 구분선
    - 메뉴 항목: "로그아웃"
  - **AlertDialog (로그아웃 항목 클릭 시 오픈)**:
    - 제목: `"로그아웃 하시겠습니까?"`
    - 본문: `"다시 로그인하려면 Google 인증을 다시 거쳐야 합니다."`
    - 버튼: `[취소]` `[로그아웃]` (destructive variant)
- **인터랙션**:
  - 아바타 클릭 → DropdownMenu 오픈.
  - 드롭다운 "로그아웃" 클릭 → DropdownMenu 닫히고 **AlertDialog 오픈**.
  - AlertDialog `[취소]` 또는 배경 클릭/Esc → 다이얼로그 닫힘, 세션 유지.
  - AlertDialog `[로그아웃]` 클릭 → `signOut({ callbackUrl: "/login" })` 호출 → `/login`으로 이동, 토스트 "로그아웃되었습니다" 표시.
- **상태**:
  - 비로그인 시: 헤더 영역 자체가 보호 라우트에만 존재하므로 해당 없음.
  - 로그인 시 기본 / 드롭다운 오픈 / AlertDialog 오픈 / 로그아웃 진행 중 (버튼 로딩·disabled).

### 5.3 화면: 보호 라우트 — 미로그인 리다이렉트

- **목적**: 직접 URL 진입을 로그인으로 유도하되, 원래 목적 URL을 보존.
- **레이아웃**: 렌더링 전 서버에서 판단 → `/login?callbackUrl=<현재경로>`로 302/307.
- **요소**: 해당 화면은 노출되지 않음 (리다이렉트 전용).
- **인터랙션**: 로그인 완료 후 `callbackUrl`로 자동 복귀 (same-origin 검증 후).

### 5.4 화면: 전역 — 로그아웃 토스트

- **목적**: 로그아웃 완료 및 세션 만료 안내.
- **레이아웃**: 화면 우측 하단 toast (shadcn Sonner 기반).
- **요소**: "로그아웃되었습니다" / "세션이 만료되어 다시 로그인해주세요".
- **인터랙션**: 3초 후 자동 dismiss, 수동 닫기 가능.

---

## 6. API 요구사항

### 6.1 Auth.js 내장 엔드포인트 (BFF, `apps/admin`)

- **Intent**: Google OIDC provider와의 로그인/콜백/로그아웃/세션 조회를 Auth.js v5가 표준으로 제공.
- **엔드포인트 (개념)**:
  - `GET /api/auth/signin/google` — Google 동의 화면으로 리다이렉트.
  - `GET /api/auth/callback/google` — Google 콜백 수신, 세션 쿠키 발급.
  - `POST /api/auth/signout` — 세션 쿠키 파기.
  - `GET /api/auth/session` — 현재 세션 JSON 응답 (클라이언트 사용자 메뉴용).
- **인증·권한**: 본 엔드포인트는 공개. 세션 쿠키는 httpOnly, Secure(prod), SameSite=Lax.

### 6.2 BFF 프록시 (`apps/admin/src/app/api/[...proxy]/route.ts`)

- **Intent**: 브라우저가 호출한 `/api/*`를 세션에서 Bearer로 변환해 `apps/api`로 전달.
- **엔드포인트 (개념)**: `ALL /api/*` (Auth.js 경로 제외).
- **동작 규칙**:

| 상황 | 처리 |
| --- | --- |
| 세션 없음 | 401 반환 (`{"error":"UNAUTHENTICATED"}`). 클라이언트 fetcher가 redirect 처리 |
| 세션 있음 + access token 유효 | `Authorization: Bearer`로 upstream 호출 |
| 세션 있음 + access token 만료, refresh 성공 | 새 토큰으로 호출 + 세션 쿠키 갱신 |
| 세션 있음 + refresh 실패 | 세션 쿠키 파기 + 401 반환 (`{"error":"SESSION_EXPIRED"}`) |

### 6.3 역할 분리 매트릭스 — 세션 유효성 판정

| 레이어 | 책임 | 판정 기준 | 실효 시 반응 |
| --- | --- | --- | --- |
| Next.js middleware | **세션 존재/부재** 판정 | 쿠키 유무 + Auth.js JWE 복호화 가능 여부 | 부재 시 `/login?callbackUrl=…`로 307. 존재 시 통과 |
| BFF proxy (`/api/[...proxy]`) | **세션 실효** 판정 | access token 만료 감지 → refresh 시도 → 실패 시 `RefreshAccessTokenError` | 쿠키 파기 + 401 반환 |
| 클라이언트 fetcher (`lib/api.ts`) | **401 수신 후 UX 전이** | 응답 상태 401 | 토스트 1회 + `window.location.replace('/login?callbackUrl=<current>')` |

**원칙**: middleware는 "세션이 있느냐"만, fetcher는 "세션이 살아있느냐"만 본다. 두 레이어가 같은 결정을 중복하지 않는다.

### 6.4 인증·권한 기준

- **인증**: Google OIDC + Auth.js v5 JWT(JWE) 세션 전략.
- **인가**: slice는 "로그인 = 모든 어드민 접근 가능". 세분 권한은 RBAC 슬라이스에서.
- **쿠키**: `httpOnly`, `Secure`(prod only), `SameSite=Lax`, `Path=/`.
- **upstream 전파**: BFF proxy만 Bearer를 붙인다. 브라우저는 토큰을 절대 보지 않는다.

---

## 7. 패키지 분담

- **apps/admin**
  - `/login` 화면, 헤더 사용자 메뉴(DropdownMenu + AlertDialog), 토스트.
  - Auth.js v5 설정(Google provider, JWT/session callback, refresh 로직).
  - BFF 프록시에 세션→Bearer 주입, 401·refresh 실패 처리.
  - 보호 라우트 판별 미들웨어.
  - `apps/admin/src/lib/callback-url.ts` (신규) — `resolveCallbackUrl` 유틸.
- **apps/api**
  - 본 슬라이스에서는 **인증 필수 강제 없음 (anonymous accept)**. Bearer 수신 시 감사 로그 목적으로만 기록. 실제 토큰 검증 Guard는 RBAC 슬라이스에서 도입.

---

## 8. UI/UX 원칙 및 설계 결정

### 8.1 일관성

- 모든 텍스트는 한국어. 시스템 에러 코드(Auth.js `error` 쿼리)는 사용자 친화 문구로 매핑.
- 색상·간격·타이포는 shadcn 토큰 사용 (`components/ui/*` 기반).

### 8.2 실수 방지

- 로그아웃은 의도 확인을 위해 **AlertDialog 1단계 거침** (§5.2). destructive 버튼 variant로 위험도 시각화.

### 8.3 접근성

- 로그인 버튼은 키보드 포커스 명확, Enter/Space로 활성화.
- 아바타 버튼은 `aria-label`("사용자 메뉴") 부여.
- AlertDialog는 포커스 트랩, Esc 닫기, 초기 포커스는 `[취소]` 버튼에 위치.

### 8.4 보호 라우트 판정 — middleware matcher 매트릭스

| 경로 패턴 | 처리 | 이유 |
| --- | --- | --- |
| `/login` | 공개. 로그인 상태면 `/`로 307 redirect (F5, E9) | 로그인 진입점. 이미 로그인된 사용자가 다시 접근할 이유 없음 |
| `/api/auth/**` | 공개 (middleware 통과) | Auth.js 내장 라우트. 콜백 / signin / signout 전부 비인증 단계에서 호출됨 |
| `/api/**` (auth 제외) | **BFF proxy에서 세션 판정** — middleware는 통과 | 401 반환은 proxy 책임(§6.3). middleware가 선제 차단하면 proxy 로직과 충돌 |
| `/_next/**` | 공개 | Next.js 내부 정적 자산 |
| `/favicon.ico`, `/robots.txt`, `/sitemap.xml` | 공개 | 브라우저/크롤러 기본 경로 |
| `/images/**`, `/fonts/**`, `/assets/**` | 공개 | 정적 자산 |
| `(public)/**` | 공개 | 공개 라우트 그룹. 현재는 `/login` 외 없음 |
| `(auth)/**` | **인증 필수** — 세션 없으면 `/login?callbackUrl=<현재 경로>`로 307 | 모든 어드민 보호 영역 |
| 그 외 모든 경로 | 인증 필수 (기본값) | safe-by-default. 명시적으로 공개 선언한 것만 통과 |

### 8.5 에러 메시지 원칙

- **원인 + 사용자 행동 1개**로 구성. 기술 용어(OAuth, token) 노출 금지.

### 8.6 개념 문서 동시 작성 (`docs/concepts/`)

메모리 `feedback_concept_docs.md`의 **6섹션 포맷**(한 줄 정의 → 왜 필요한가 → 표준 근거 → 우리 구조에서 어디에 → 대안과 trade-off → 참고 자료)을 따른다.

| 파일 | 상태 | 내용 |
| --- | --- | --- |
| `docs/concepts/oidc-authjs.md` | **신규** | Google OIDC 선택 이유, Auth.js v5 JWT 전략, profile 훅, JWE 쿠키 |
| `docs/concepts/refresh-token-rotation.md` | **신규** | access 만료 판정, refresh 호출 경로, 실패 시 401 책임 경계 |
| `docs/concepts/bff.md` | **갱신** | "auth bridge" 섹션 추가: 세션 → Bearer 주입, §6.3 역할 분리 매트릭스 반영 |
| `docs/concepts/httponly-session.md` | **갱신** | Auth.js JWE 세션 쿠키 항목 추가, §8.8 TTL 기본값 반영 |

### 8.7 토큰 만료 시나리오 테스트 전략

| 대안 | 장점 | 단점 |
| --- | --- | --- |
| A. 단위 테스트로 jwt callback mocking | 빠름 | 실제 쿠키·리다이렉트 흐름 미검증 |
| B. Playwright `page.clock` + Google 토큰 엔드포인트 MSW | 실제 세션 갱신 경로 검증 | 셋업 비용 |
| C. 실서버 시간 대기 | 현실적 | 테스트 실행 시간 과다 |

**채택: E5(refresh 성공)와 E6(refresh 실패) 모두 Playwright `page.clock.install()` 기반 통합 테스트로 검증. Google token 엔드포인트는 MSW로 가로채 성공/실패/지연 응답 제어.**

### 8.8 세션 TTL 정책

- JWE 세션 쿠키 `maxAge`: **14일**.
- Google access token: 약 1시간 (Google 기본값, 변경 불가).
- Google refresh token: **실제 만료 시각은 없으나 장기 미사용 시 자동 회수 정책(약 6개월) 존재. 운영상 안전값 30일 가정**.
- 관계: JWE 쿠키가 먼저 만료되면 refresh 여부와 무관하게 재로그인 필요. refresh 실패가 먼저 발생하면 JWE 쿠키도 파기(세션 실효 경로)하여 다음 요청부터 `/login` 유도.

---

## 9. 제약 조건

### 9.1 보안

- 모든 토큰은 httpOnly 쿠키. localStorage/sessionStorage 금지.
- `NEXT_PUBLIC_*`로 Google client secret·API URL 노출 금지.
- CSRF: Auth.js v5 기본 CSRF 토큰 사용.
- Pino logger에 token 필드 redact 규칙 등록.

### 9.2 운영

- Google OAuth client 설정은 운영/스테이징/로컬 리다이렉트 URI 각각 등록 필요.

### 9.3 호환성

- 모든 최신 모던 브라우저(Chrome, Edge, Firefox, Safari 최신 2버전).
- 쿠키 3자 차단 환경을 고려해 same-origin(`/api/*`) 유지.

### 9.4 callbackUrl same-origin 검증

- **유틸**: `apps/admin/src/lib/callback-url.ts` (신규)
- **시그니처**:

```ts
export function resolveCallbackUrl(
  raw: string | null | undefined,
  origin: string,
): string;
```

- **규칙**:
  1. `undefined` / 빈 문자열 → `"/"` 반환
  2. `/`로 시작하지 않거나 `//`로 시작 → `"/"` 반환 (프로토콜 주입 방지)
  3. `new URL(raw, origin)` 해석 결과의 origin이 인자 `origin`과 다름 → `"/"` 반환
  4. 통과 시 `pathname + search + hash`만 반환
- **사용처**: middleware의 redirect 생성, 로그인 후 이동, 401 → `/login` redirect 생성 (총 3곳).

### 9.5 Auth.js v5 beta 리스크

| ID | 리스크 | Mitigation | Trigger | Fallback |
| --- | --- | --- | --- | --- |
| R1 | v5 beta API 시그니처 파괴적 변경 | 버전 pin (정확 버전 고정, `^` 미사용), 업그레이드 전 changelog 리뷰 | v5 rc/stable 승격 시, minor beta 업 시 | 이전 beta 버전으로 rollback, 최악의 경우 Auth.js v4로 다운그레이드 |
| R2 | Next.js 16 특정 기능과의 비호환(RSC, 미들웨어) | 미들웨어·RSC 경로에서 `auth()` 호출은 공식 예제 패턴만 사용 | Next.js 16 패치 업데이트 시 | Next.js 이전 patch 핀, 관련 라우트는 Route Handler로 우회 |
| R3 | JWT callback 내 refresh 구현 버그 | E5/E6을 Playwright `page.clock` 기반으로 회귀 고정 | refresh 로직 수정 PR, Auth.js 업데이트 시 | 문제 재현 시 즉시 이전 커밋으로 revert, refresh 비활성화(강제 재로그인) |
| R4 | Google OIDC endpoint 응답 스키마 변경 | ID token/userinfo 파싱은 Zod로 방어적 스키마 | Google Identity 릴리즈 노트 경보 | 방어 스키마 통과 실패 시 로그인 차단 + 관측 경보 |
| R5 | 세션 쿠키 JWE 라이브러리(Jose) 버전 충돌 | Auth.js가 고정한 peer 버전 준수, `pnpm why jose`로 중복 확인 | Auth.js 버전 업, Jose 직접 업그레이드 시 | 문제 버전 overrides로 pin, 최악의 경우 Auth.js 버전 revert |

---

## 10. 슬라이스 구성

### 10.1 단계 10.1 — 로그인/로그아웃 최소 동작

- `/login` 화면 + Google 버튼 + 콜백 복귀.
- 세션 쿠키 발급.
- 헤더 아바타 + DropdownMenu + **AlertDialog** 기반 로그아웃 흐름.
- 보호 라우트 미로그인 리다이렉트 + `callbackUrl` 복귀 (same-origin 검증).

### 10.2 단계 10.2 — BFF 세션→Bearer 주입

- BFF 프록시가 세션 access token을 `Authorization: Bearer`로 주입.
- 세션 없으면 401 즉시 반환.
- upstream 호출 로그에 사용자 식별자 기록.

### 10.3 단계 10.3 — 자동 refresh & 세션 실효

- JWT callback에서 만료 감지 시 서버측 refresh.
- refresh 실패 시 세션 쿠키 파기 + `/login?error=SessionExpired` 유도.
- 다중 탭 동기화: 401 감지 시 자동 리다이렉트.

---

## 11. 토큰 흐름 다이어그램 (개념)

```
[Browser]
   │
   │ 1) /login 클릭
   ▼
[apps/admin BFF: /api/auth/signin/google]
   │
   │ 2) Google 동의
   ▼
[Google OIDC]
   │
   │ 3) /api/auth/callback/google
   ▼
[apps/admin BFF: JWT callback]
   │  - access_token, refresh_token, expires_at 저장 (JWE 쿠키 14일)
   ▼
[Browser: 세션 쿠키 보유] ──→ /api/* 호출 (same-origin)
                                   │
                                   ▼
                       [BFF 프록시: [...proxy]/route.ts]
                         - 세션 읽기 (auth())
                         - access_token 만료? → refresh (단계 10.3)
                         - Authorization: Bearer <token> 주입
                                   │
                                   ▼
                              [apps/api] (Bearer 수신, anonymous accept)
```

---

## 12. 완료 기준

### 12.1 기능 완료 기준

- [ ] `/login`에서 Google 버튼 클릭 시 Google 동의 화면으로 이동.
- [ ] 콜백 복귀 후 세션 쿠키 발급되고 보호 라우트 진입 가능.
- [ ] 보호 라우트 미로그인 진입 시 `/login?callbackUrl=<원래경로>`로 리다이렉트.
- [ ] 로그인 후 `callbackUrl`로 정확히 복귀 (same-origin 검증 통과 시).
- [ ] 이미 로그인 상태로 `/login` 접근 시 보호 홈으로 307 리다이렉트.
- [ ] 헤더 아바타에 Google 이름·이메일·picture(또는 이니셜 fallback) 표시.
- [ ] **아바타 클릭 시 DropdownMenu가 열리고 "로그아웃" 항목 클릭 시 shadcn AlertDialog가 열린다.**
- [ ] **AlertDialog 제목은 "로그아웃 하시겠습니까?", 본문은 "다시 로그인하려면 Google 인증을 다시 거쳐야 합니다.", 버튼은 [취소]/[로그아웃].**
- [ ] **AlertDialog에서 [취소] 클릭 시 다이얼로그가 닫히고 세션이 유지된다.**
- [ ] **AlertDialog에서 [로그아웃] 클릭 시 세션 파기 후 `/login`으로 리다이렉트되고 "로그아웃되었습니다" 토스트가 표시된다.**
- [ ] **외부 호스트 callbackUrl(예: `https://evil.com`, `//evil.com`, `javascript:…`) 주입 시 `/`로 fallback한다.**

### 12.2 세션/토큰 완료 기준

- [ ] 세션 쿠키가 `httpOnly`, `SameSite=Lax`, prod는 `Secure` 플래그를 가진다.
- [ ] JWT callback에서 access token 만료 시 refresh 자동 수행.
- [ ] refresh 실패 시 세션 쿠키 파기 + `/login?error=SessionExpired` 리다이렉트.
- [ ] JWE 쿠키 `maxAge` 14일로 설정.
- [ ] 토큰 문자열이 브라우저 DevTools(Storage/Network 응답 body)에 노출되지 않는다.

### 12.3 BFF 완료 기준

- [ ] `/api/*` 호출 시 BFF가 세션에서 Bearer를 주입해 upstream 호출.
- [ ] 세션 없이 `/api/*` 호출 시 BFF가 401 반환.
- [ ] `apps/admin/src/lib/callback-url.ts`가 신설되고 middleware/login/fetcher 3곳에서 사용된다.

### 12.4 품질/테스트 완료 기준

- [ ] Playwright E2E: 최초 로그인 / 재방문 / 보호 라우트 리다이렉트 / `callbackUrl` 복귀 / 로그아웃 확인·취소 / refresh 성공 / refresh 실패.
- [ ] `page.clock.install()` + MSW 조합으로 refresh 시나리오가 결정적으로 재현된다.
- [ ] Vitest 단위 테스트: 에러 코드 매핑, `resolveCallbackUrl`, picture fallback 렌더.
- [ ] **E10 검증: `/api/*` 호출 시 upstream 요청 헤더에 `Authorization: Bearer <token>`이 존재한다. Playwright `page.route()`로 upstream 요청을 가로채 헤더 존재 여부를 assert. `apps/api` 응답 코드는 판정 대상 아님 (현재 anonymous accept 상태).**
- [ ] **`next-auth` 버전이 `^` 없이 정확한 beta 버전으로 고정되어 있다** (`package.json` 확인).
- [ ] 개념 문서 **신규 2건** (`oidc-authjs.md`, `refresh-token-rotation.md`) **갱신 2건** (`bff.md`, `httponly-session.md`) 머지. 네 문서 모두 `feedback_concept_docs.md`의 6섹션 포맷 준수.
- [ ] 모든 TanStack Query 키는 Query Key Factory 경유 (기존 규약 유지).
- [ ] Lighthouse: `/login` 성능 ≥ 90.

---

## 13. 범위 외 (Out of Scope)

- **이메일 도메인 제한 (허용 도메인 화이트리스트)** — RBAC 슬라이스로 이월.
- RBAC 역할 분기(Role/Permission/Menu) — 별도 슬라이스.
- 2FA / 비밀번호 로그인 / 매직 링크.
- Keycloak 연동 (on-prem 대체 시나리오용으로 docker-compose 주석 보존).
- 사용자 프로필 편집(이름/사진 변경).
- 감사 로그 UI.
- 다중 Provider(Microsoft, GitHub 등).
- `apps/api` 쪽 JWT 검증 Guard.
- DB User 테이블 매핑 및 최초 로그인 시 onboarding.

### F9 picture fallback 트리거 조건 (명시)

- Google picture가 `null`/`undefined` → 즉시 이니셜 렌더.
- picture URL이 존재하지만 로드 실패(`img onError` 이벤트) → 이니셜 렌더로 fallback.
- 이니셜 산출 우선순위: `name → email local-part → "?"`.

---

## 14. 미결 사항

- **O1. JWE 쿠키 `maxAge`를 14일로 잠정 확정** — 운영 정책 리뷰 필요.
- **O2. 로그인 취소 / 세션 만료 안내 문구 최종안** — 디자인 리뷰 후 확정.
- **O3. refresh 실패 시 토스트 문구 vs `/login` 배너 — 어느 쪽 우선 노출할지** 결정 필요.
- **O4. 로그아웃 토스트 노출 위치(헤더 상단 vs 우측 하단 Sonner)** — 현재 우측 하단 Sonner로 가정. shadcn 토스트 컨벤션 재확인 후 고정.
