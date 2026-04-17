## ADDED Requirements

### Requirement: 로그인 화면 레이아웃 렌더링

`(public)/login` 경로에 스플릿 레이아웃 로그인 화면을 렌더링한다. 디자인 충실도는 strict(plan.md §5, §8 기준).

#### Scenario: 데스크톱에서 로그인 화면 진입

- **Given** 데스크톱 뷰포트(1024px 이상)의 미인증 사용자
- **When** `/login` 경로에 접근
- **Then** 좌 55% 다크 패널(배경 `#0f172a` + 우상단 블루 글로우) + 우 45% 라이트 패널(`--surface: #f7f9fb`) 스플릿 레이아웃 표시
- **And** 좌 패널에 "ADMIN CONSOLE" 워드마크(대문자, 넓은 자간) + "운영 콘솔" 보조 라벨 + "© 2025 Admin Console" 저작권 하단 표시
- **And** 우 패널에 로그인 카드 표시 (이버로우 "로그인", 헤드라인 "콘솔에 접속하세요", 서브카피, Google 버튼, 인포 박스, 법적 고지, 푸터)

#### Scenario: 모바일/좁은 화면에서 로그인 화면 진입

- **Given** 모바일 뷰포트(768px 미만)
- **When** `/login` 경로에 접근
- **Then** 좌 패널은 숨겨지고 우 패널이 전폭으로 표시
- **And** 로그인 카드의 모든 요소가 동일하게 표시

---

### Requirement: Google 로그인 버튼 인터랙션

Google 로그인 버튼 클릭 시 Auth.js를 통해 Google OIDC 인가 플로우를 시작한다.

#### Scenario: 정상 Google 로그인 시작

- **Given** 로그인 화면의 기본 상태
- **When** "Google 계정으로 계속하기" 버튼 클릭
- **Then** 버튼이 비활성화되고 로딩 표시가 나타남
- **And** Google 동의 화면으로 리다이렉트

#### Scenario: 버튼 hover 상태

- **Given** 기본 상태의 Google 로그인 버튼
- **When** 마우스를 버튼 위에 올림
- **Then** 버튼 그라디언트가 심화됨(`--primary-dim: #0048c1` 방향으로 전환)

---

### Requirement: 로그인 에러 상태 표시

콜백 에러 코드(`?error=`)에 따라 적절한 사유 메시지를 표시한다.

#### Scenario: 비인가 계정 에러 표시

- **Given** `/login?error=unauthorized_domain` URL
- **When** 로그인 화면 렌더링
- **Then** 인포 박스 위치 또는 상단에 "조직 계정만 허용됩니다." 사유 메시지 표시
- **And** Google 버튼은 재시도 가능 상태로 활성화

#### Scenario: Google 인증 취소/실패 에러 표시

- **Given** `/login?error=OAuthCallback` 또는 `/login?error=OAuthSignin` URL
- **When** 로그인 화면 렌더링
- **Then** "Google 인증 중 오류가 발생했습니다. 다시 시도해 주세요." 메시지 표시
- **And** Google 버튼은 재시도 가능 상태로 활성화

#### Scenario: 서버/일시 오류 에러 표시

- **Given** `/login?error=Configuration` 또는 기타 서버 오류 코드 URL
- **When** 로그인 화면 렌더링
- **Then** "일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." 메시지 표시

#### Scenario: 에러 없는 기본 상태

- **Given** `/login` (error 파라미터 없음)
- **When** 로그인 화면 렌더링
- **Then** 기본 인포 박스("조직 계정만 허용됩니다. 개인 Gmail 계정은 거부됩니다.") 표시
- **And** 에러 배너 미표시

---

### Requirement: 로그인 차단 사용자 상태 안내 및 자동 로그아웃

Google OIDC 로그인 시도 후 `pending` 또는 `rejected` 상태로 인해 접근이 거부된 경우, 사용자에게 상태별 토스트 메시지를 노출하고 즉시 `signOut()`을 호출하여 미완성 세션 흔적을 제거한다.

#### Scenario: pending 사용자 — 승인 대기 토스트 후 자동 로그아웃
- **Given** 사용자가 Google OIDC 인증에 성공했으나 DB `status = pending`이어서 Auth.js가 `/api/auth/error?error=pending_approval`로 리디렉션하고
- **When** 로그인 페이지가 URL 파라미터 `error=pending_approval`을 감지하면
- **Then** "승인 대기 중입니다. 관리자 승인 후 다시 로그인해 주세요." 토스트가 노출되고
- **And** `signOut({ redirect: false })` 또는 `signOut({ callbackUrl: '/login' })`이 자동 호출되어 세션이 종료된다
- **And** 사용자는 콘솔 내부 경로에 진입하지 못하고 로그인 화면에 머문다

#### Scenario: rejected 사용자 — 거절 안내 토스트 후 자동 로그아웃
- **Given** 사용자가 Google OIDC 인증에 성공했으나 DB `status = rejected`이어서 Auth.js가 `/api/auth/error?error=rejected`로 리디렉션하고
- **When** 로그인 페이지가 URL 파라미터 `error=rejected`를 감지하면
- **Then** "접근이 거절되었습니다. 관리자에게 문의해 주세요." 토스트가 노출되고
- **And** `signOut({ redirect: false })` 또는 `signOut({ callbackUrl: '/login' })`이 자동 호출되어 세션이 종료된다
- **And** 사용자는 콘솔 내부 경로에 진입하지 못하고 로그인 화면에 머문다

#### Scenario: 알 수 없는 에러 파라미터 — 기본 에러 안내
- **Given** `/api/auth/error?error=<unknown>` URL로 접근하면
- **When** 로그인 페이지가 에러 파라미터를 감지하지만 `pending_approval` / `rejected`에 해당하지 않으면
- **Then** "로그인 중 오류가 발생했습니다. 다시 시도해 주세요." 기본 에러 토스트가 노출된다
- **And** `signOut()`을 별도 호출하지 않는다 (세션이 없는 상태이므로)

---

### Requirement: 법적 고지·푸터 요소

로그인 카드 하단에 법적 고지 및 푸터 링크·버전 배지를 표시한다.

#### Scenario: 법적 고지 표시

- **Given** 로그인 화면
- **When** 카드 하단 영역 확인
- **Then** 구분선 위에 "계속 진행하면 이용 약관에 동의하는 것으로 간주됩니다." 텍스트와 "이용 약관" 링크 표시
- **And** 링크 hover 시 `--primary` 색으로 전환

#### Scenario: 푸터 링크·버전 배지 표시

- **Given** 로그인 화면
- **When** 카드 최하단 확인
- **Then** 좌측에 "상태 · 도움말" 링크, 우측에 monospace 폰트 "v1.0" 버전 배지 표시
