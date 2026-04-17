## ADDED Requirements

### Requirement: 12컬럼 그리드 레이아웃

상세 화면은 12컬럼 그리드로 유저 정보 카드(7컬럼)와 액션 카드(5컬럼)를 나란히 배치한다.
최상위 컨테이너: `grid grid-cols-12 gap-8`
- 유저 정보 카드: `col-span-12 lg:col-span-7`
- 액션 카드: `col-span-12 lg:col-span-5`

`lg` 미만 뷰포트에서는 두 카드 모두 `col-span-12`로 전체 너비를 차지한다.

#### Scenario: 그리드 레이아웃 렌더

- **Given** 관리자 상세 페이지가 로드됨
- **When** `AdminUserDetailClient`가 렌더됨
- **Then** 유저 정보 카드와 액션 카드가 각각 렌더됨
- **And** 유저 정보 카드 컨테이너는 `lg:col-span-7` 클래스를 가짐
- **And** 액션 카드 컨테이너는 `lg:col-span-5` 클래스를 가짐

---

### Requirement: 유저 정보 카드

유저의 아바타, 이름, 이메일, 상태 뱃지 및 정보 행(상태/역할/등록일)을 표시하는 카드.
카드 컨테이너: `bg-surface-container-lowest rounded-3xl p-8`에 ambient shadow `style={{ boxShadow: '0px 12px 32px rgba(42,52,57,0.06)' }}` 적용.

**아바타 영역**:
- 이미지가 있으면 `<img>` 태그 `w-16 h-16 rounded-full object-cover`
- 이미지가 없으면 동일 크기의 placeholder(이니셜 또는 기본 아이콘)
- 상태 도트: 아바타 우하단 `-bottom-1 -right-1` 위치에 `w-5 h-5 rounded-full border-4 border-white` 오버레이
  - pending: `bg-amber-500`
  - active: `bg-green-500`
  - rejected: `bg-red-500`

**헤더 영역** (아바타 우측):
- 이름: `text-[20px] font-bold text-on-surface font-headline`
- 이메일: `text-sm text-on-surface-variant`
- 상태 뱃지 pill: `px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase`

**정보 행** (`space-y-6`):
1. 상태 행: `flex items-center justify-between pb-6 border-b border-surface-container`
   - 라벨: `text-xs font-bold text-on-surface-variant uppercase tracking-wider` — "상태"
   - 값: 색상 도트(`w-2 h-2 rounded-full`, 상태 색상 동일) + 텍스트 `text-sm font-semibold`
2. 역할 행: `flex items-center justify-between pb-6 border-b border-surface-container`
   - 라벨: 동일 형식 — "역할"
   - 값: `text-sm font-semibold`
3. 등록일 행: `flex items-center justify-between` (border 없음)
   - 라벨: 동일 형식 — "등록일"
   - 값: `text-sm font-semibold`

**NO-LINE 예외**: 정보 행 구분선 `border-b border-surface-container`는 인라인 style 금지 패턴의 예외로 허용된다 (CSS 변수 기반 Tailwind 토큰).

#### Scenario: 아바타 렌더 (picture 있음)

- **Given** 사용자의 `picture` 필드에 URL이 존재함
- **When** 유저 정보 카드가 렌더됨
- **Then** `<img>` 태그가 `w-16 h-16 rounded-full object-cover` 클래스로 표시됨

#### Scenario: 아바타 렌더 (picture 없음)

- **Given** 사용자의 `picture` 필드가 null 또는 빈 문자열임
- **When** 유저 정보 카드가 렌더됨
- **Then** `<img>` 대신 placeholder 엘리먼트가 동일 크기로 표시됨

#### Scenario: 상태 도트 색상 — pending

- **Given** 사용자의 상태가 `pending`임
- **When** 유저 정보 카드가 렌더됨
- **Then** 아바타 우하단 상태 도트는 `bg-amber-500` 클래스를 가짐

#### Scenario: 상태 도트 색상 — active

- **Given** 사용자의 상태가 `active`임
- **When** 유저 정보 카드가 렌더됨
- **Then** 상태 도트는 `bg-green-500` 클래스를 가짐

#### Scenario: 상태 도트 색상 — rejected

- **Given** 사용자의 상태가 `rejected`임
- **When** 유저 정보 카드가 렌더됨
- **Then** 상태 도트는 `bg-red-500` 클래스를 가짐

#### Scenario: 이름/이메일 렌더

- **Given** 사용자 데이터가 로드됨
- **When** 유저 정보 카드가 렌더됨
- **Then** 사용자 이름이 `text-[20px] font-bold text-on-surface` 스타일로 표시됨
- **And** 사용자 이메일이 `text-sm text-on-surface-variant` 스타일로 표시됨

#### Scenario: 정보 행 3종 렌더

- **Given** 사용자 데이터가 로드됨
- **When** 유저 정보 카드가 렌더됨
- **Then** "상태", "역할", "등록일" 라벨이 모두 표시됨
- **And** 각 라벨은 `uppercase tracking-wider` 스타일을 가짐
- **And** 상태/역할 행에는 `border-b border-surface-container` 구분선이 있음
- **And** 등록일 행에는 구분선이 없음

---

### Requirement: 액션 카드

관리자 승인/거절 액션 버튼을 사용자 상태에 따라 표시하는 카드.
카드 컨테이너: `bg-surface-container-lowest rounded-3xl p-8`에 ambient shadow `style={{ boxShadow: '0px 12px 32px rgba(42,52,57,0.06)' }}` 적용.
카드 헤더: `text-lg font-bold text-on-surface font-headline` — "관리 액션"
버튼 영역: `space-y-8`

**상태별 버튼 조합**:
- pending:
  - 승인 버튼: `w-full py-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white font-bold rounded-xl`
  - 거절 버튼: `w-full py-4 border-2 border-error text-error font-bold rounded-xl`
- active:
  - 거절 버튼만: `w-full py-4 border-2 border-error text-error font-bold rounded-xl`
- rejected:
  - 대기로 복구: `w-full py-4 border-2 border-on-surface-variant text-on-surface-variant font-bold rounded-xl`
  - 승인으로 복구: `w-full py-4 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white font-bold rounded-xl`

**hex 리터럴 허용 범위**: `from-[#22c55e] to-[#16a34a]`는 gradient 승인 버튼에 한정해서만 허용한다. 다른 UI 요소에 임의값 hex를 사용하는 것은 금지한다.

#### Scenario: pending 상태 액션 카드

- **Given** 사용자의 상태가 `pending`임
- **When** 액션 카드가 렌더됨
- **Then** 승인 버튼과 거절 버튼이 모두 표시됨
- **And** 승인 버튼은 `bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white` 스타일임
- **And** 거절 버튼은 `border-2 border-error text-error` outline 스타일임

#### Scenario: active 상태 액션 카드

- **Given** 사용자의 상태가 `active`임
- **When** 액션 카드가 렌더됨
- **Then** 거절 버튼만 표시됨
- **And** 승인 버튼은 존재하지 않음

#### Scenario: rejected 상태 액션 카드

- **Given** 사용자의 상태가 `rejected`임
- **When** 액션 카드가 렌더됨
- **Then** "대기로 복구" outline 버튼과 "승인으로 복구" gradient green 버튼이 모두 표시됨
