## Context

현재 `AdminUsersListClient`, `AdminUserTable`, `AdminUserDetailClient`는 인라인 `style` 객체로 레이아웃·색상·간격을 하드코딩하고 있다. Tailwind 4 + CSS 변수(`--color-surface-container-low` 등)를 전혀 사용하지 않아 디자인 토큰 변경이 화면에 반영되지 않는다. Stitch 디자인 HTML(list.html, detail.html)이 기준 디자인으로 확정되었으며, 이를 Tailwind 유틸리티 클래스로 1:1 이식한다.

## Goals / Non-Goals

**Goals:**
- 인라인 `style` 객체 전면 제거, Tailwind 4 유틸리티 클래스 + CSS 변수로 대체
- Stitch 디자인에서 추출한 UI 패턴(pill 탭, 교대 테이블 행, 상태 칩, 12컬럼 그리드, ambient shadow 카드, gradient 버튼)을 충실히 구현
- 상태(pending / active / rejected)별 색상·액션 조합을 명세 기반으로 분리
- 기존 데이터 fetching·상태 관리 로직은 변경하지 않음

**Non-Goals:**
- 신규 API 엔드포인트 추가 또는 기존 API 변경
- 역할(Role) 배정 기능 추가
- 반응형 브레이크포인트 `sm`/`md` 이하 최적화 (lg 브레이크포인트까지만 명세)

## Decisions

### 1. 상태 칩·액션 버튼을 독립 컴포넌트로 분리

`AdminUserTable` 내부에 상태별 분기 로직과 버튼 조합이 동시에 인라인으로 존재하면 테스트가 어렵다. `AdminUserStatusBadge`와 `AdminUserActions`를 별도 컴포넌트로 분리해 단위 테스트 가능하게 한다.

**이유**: 상태 칩과 액션 버튼은 목록/상세 양쪽에서 동일한 색상 로직을 공유하므로 단일 컴포넌트에서 관리하는 것이 유지보수에 유리하다.

### 2. `bg-surface-container-*` 계열 CSS 변수를 Tailwind 토큰으로 사용

Stitch 디자인 HTML은 `bg-surface-container-low`, `bg-surface-container-lowest` 등 Material You 기반 토큰을 직접 클래스명으로 사용한다. 프로젝트 Tailwind 4 설정에 이미 CSS 변수가 등록되어 있으므로 그대로 채택한다.

**이유**: 별도 토큰 래핑 없이 Stitch 산출물을 그대로 이식할 수 있어 디자인-코드 드리프트 최소화.

### 3. gradient 버튼 hex 리터럴 허용 범위 제한

`bg-gradient-to-br from-[#22c55e] to-[#16a34a]`는 Tailwind 임의값(arbitrary value)을 사용한다. 이 패턴은 Stitch 디자인의 gradient 승인 버튼에 한정하며, 다른 색상에는 임의값을 쓰지 않는다.

**이유**: Tailwind 4 기본 팔레트에 해당 gradient stop이 없으므로 임의값이 불가피하다. 범위를 명세에 명시해 패턴 확산을 방지한다.

### 4. 상세 화면 카드 shadow는 인라인 style 허용 예외

Stitch 디자인의 ambient shadow(`box-shadow: 0px 12px 32px rgba(42,52,57,0.06)`)는 Tailwind 기본 `shadow-*` 토큰으로 표현하기 어렵다. 이 shadow에 한해 인라인 `style` 또는 CSS 모듈을 허용한다.

**이유**: 디자인 충실도와 Tailwind 유틸 한계 사이의 trade-off. shadow 1개를 위해 커스텀 토큰을 추가하는 비용이 더 크다.

### 5. `border-b border-surface-container` 카드 내부 허용

상세 카드의 정보 행 구분선은 `border-b border-surface-container`를 사용한다. 인라인 style이 아닌 Tailwind 토큰이므로 금지 패턴 아님.

**이유**: tonal 구분 보조 역할로 Stitch 디자인에 명시되어 있으며, CSS 변수 기반이라 디자인 시스템과 일관성을 유지한다.

## Risks / Trade-offs

- **CSS 변수 미등록 위험**: `bg-surface-container-low` 등이 Tailwind 설정에 누락된 경우 스타일이 적용되지 않음 → 개발 착수 전 `tailwind.config`에 해당 토큰 등록 여부를 확인한다.
- **임의값(arbitrary value) 남용**: hex gradient를 허용한 선례가 다른 곳으로 확산될 수 있음 → spec에 "gradient 버튼 한정" 명시로 확산 방지.
- **인라인 style 잔존 가능성**: shadow 예외를 허용했으므로 리뷰어가 shadow 이외 인라인 style이 남아있는지 별도 확인 필요.
