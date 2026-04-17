## ADDED Requirements

### Requirement: 탭 그룹 pill 스타일

관리자 목록 화면 상단에 전체/승인 대기/활성/거절됨 탭을 pill 형태로 표시한다.
컨테이너는 `bg-surface-container-low rounded-full p-1 flex items-center gap-2 w-fit mb-8` 클래스를 사용한다.
활성 탭은 `bg-primary text-white rounded-full shadow-md px-6 py-2 text-sm font-bold`로 강조한다.
비활성 탭은 `text-on-surface-variant rounded-full px-6 py-2 text-sm font-semibold hover:text-on-surface`로 표시한다.
각 버튼은 `role="tab"` 속성을 가지며, 활성 상태는 `aria-selected="true"`로 표시한다.

#### Scenario: 기본 탭 렌더

- **Given** 관리자 목록 화면이 로드됨
- **When** 탭 그룹 컨테이너가 렌더됨
- **Then** "전체", "승인 대기", "활성", "거절됨" 4개의 탭 버튼이 존재함
- **And** 각 버튼은 `role="tab"` 속성을 가짐

#### Scenario: 활성 탭 스타일

- **Given** "승인 대기" 탭이 선택된 상태
- **When** 탭 버튼을 렌더함
- **Then** "승인 대기" 버튼은 `aria-selected="true"`이고 `bg-primary text-white` 클래스를 가짐
- **And** 나머지 탭은 `aria-selected="false"`이고 `text-on-surface-variant` 클래스를 가짐

---

### Requirement: 테이블 레이아웃

관리자 목록을 표 형태로 표시한다.
테이블 컨테이너는 `bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm w-full` 클래스를 사용한다.
헤더 행은 `bg-surface-container-low`이며, `th`는 `px-8 py-5 text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em]` 클래스를 사용한다.
데이터 행은 홀수 행 `bg-surface-container-low`, 짝수 행 `bg-surface-container-lowest`로 교대 배경을 적용한다.
이름 컬럼은 상세 페이지로 이동하는 링크로, `text-primary font-bold hover:underline` 스타일을 갖는다.
역할 컬럼에는 `text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant` 뱃지를 사용한다.

#### Scenario: 테이블 헤더 렌더

- **Given** 관리자 목록 데이터가 존재함
- **When** 테이블이 렌더됨
- **Then** "사용자 이름", "이메일", "역할", "상태", "액션" 컬럼 헤더가 모두 표시됨
- **And** 헤더 행에 `bg-surface-container-low` 클래스가 적용됨

#### Scenario: 데이터 행 교대 배경

- **Given** 관리자 목록에 3명 이상의 사용자가 있음
- **When** 테이블이 렌더됨
- **Then** 홀수 번째 행은 `bg-surface-container-low` 클래스를 가짐
- **And** 짝수 번째 행은 `bg-surface-container-lowest` 클래스를 가짐

#### Scenario: 이름 링크

- **Given** 관리자 목록에 사용자 "김영희"가 있음
- **When** 테이블 행이 렌더됨
- **Then** "김영희" 이름은 해당 사용자의 상세 페이지로 향하는 `<a>` 또는 `<Link>` 태그로 렌더됨
- **And** 링크는 `text-primary font-bold hover:underline` 스타일을 가짐

---

### Requirement: 상태 칩

사용자의 승인 상태를 색상이 다른 pill 형태 칩으로 표시한다.
공통 기본 클래스: `px-3 py-1 rounded-full text-[11px] font-bold`
- pending(승인 대기): `bg-orange-100 text-orange-700`, 텍스트 "승인 대기"
- active(활성): `bg-blue-100 text-blue-700`, 텍스트 "활성"
- rejected(거절됨): `bg-red-100 text-red-700`, 텍스트 "거절됨"

#### Scenario: pending 상태 칩

- **Given** 사용자의 상태가 `pending`임
- **When** 상태 칩 컴포넌트(`AdminUserStatusBadge`)가 렌더됨
- **Then** 칩 배경이 `bg-orange-100`, 텍스트 색상이 `text-orange-700`임
- **And** 칩 텍스트가 "승인 대기"로 표시됨

#### Scenario: active 상태 칩

- **Given** 사용자의 상태가 `active`임
- **When** 상태 칩 컴포넌트가 렌더됨
- **Then** 칩 배경이 `bg-blue-100`, 텍스트 색상이 `text-blue-700`임
- **And** 칩 텍스트가 "활성"으로 표시됨

#### Scenario: rejected 상태 칩

- **Given** 사용자의 상태가 `rejected`임
- **When** 상태 칩 컴포넌트가 렌더됨
- **Then** 칩 배경이 `bg-red-100`, 텍스트 색상이 `text-red-700`임
- **And** 칩 텍스트가 "거절됨"으로 표시됨

---

### Requirement: 액션 버튼

사용자의 상태에 따라 표시되는 액션 버튼 조합이 다르다.
공통 기본 클래스: `px-4 py-1.5 text-xs font-bold rounded-lg`
- pending: 승인(`bg-[#2e7d32] text-white`) + 거절(`bg-error text-white`) 두 버튼 나란히 표시
- active: 거절 버튼만 표시 (`border border-error text-error`, outline 스타일)
- rejected: 대기로 복구(`border border-on-surface-variant text-on-surface-variant`, outline) + 승인으로 복구(`bg-[#2e7d32] text-white`) 두 버튼 나란히 표시

#### Scenario: pending 행 액션 버튼

- **Given** 사용자의 상태가 `pending`임
- **When** 액션 컴포넌트(`AdminUserActions`)가 렌더됨
- **Then** 승인 버튼과 거절 버튼이 모두 표시됨
- **And** 승인 버튼은 green filled 스타일임
- **And** 거절 버튼은 error filled 스타일임

#### Scenario: active 행 액션 버튼

- **Given** 사용자의 상태가 `active`임
- **When** 액션 컴포넌트가 렌더됨
- **Then** 거절 버튼만 표시됨
- **And** 거절 버튼은 `border border-error text-error` outline 스타일임

#### Scenario: rejected 행 액션 버튼

- **Given** 사용자의 상태가 `rejected`임
- **When** 액션 컴포넌트가 렌더됨
- **Then** "대기로 복구" outline 버튼과 "승인으로 복구" green filled 버튼이 모두 표시됨
