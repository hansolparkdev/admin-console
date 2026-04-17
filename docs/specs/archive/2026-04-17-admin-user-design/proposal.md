## Why

현재 관리자 관리 목록/상세 화면은 인라인 `style` 객체로 하드코딩되어 있어 디자인 시스템(Tailwind 4 + CSS 변수)에서 완전히 이탈해 있다.
Stitch 디자인(list.html, detail.html)을 기준으로 Tailwind 4 + CSS 변수 기반으로 전면 재작성해 디자인 일관성을 확보한다.

## What Changes

- `AdminUsersListClient`: 페이지 헤더 Tailwind 재작성 (인라인 style 제거)
- `AdminUserTable`: 탭 그룹 pill 형태 Tailwind 재작성, 테이블 헤더/행 교대 배경 Tailwind 재작성
- `AdminUserStatusBadge` (신규 또는 인라인 → 컴포넌트 분리): 상태 칩 Tailwind (pending/active/rejected 색상)
- `AdminUserActions` (신규 또는 인라인 → 컴포넌트 분리): 액션 버튼 Tailwind (상태별 조합)
- `AdminUserDetailClient`: 12컬럼 그리드 레이아웃, 유저 정보 카드(아바타 + 상태 도트 + 정보 행), 액션 카드(gradient 승인 + outline 거절) Tailwind 재작성

## Capabilities

### New Capabilities

- `admin-user-list-ui`: 관리자 목록 화면의 탭 그룹·테이블·상태 칩·액션 버튼 UI 명세
- `admin-user-detail-ui`: 관리자 상세 화면의 12컬럼 그리드·유저 정보 카드·액션 카드 UI 명세

### Modified Capabilities

(없음 — main 스펙에 admin-user 관련 capability가 아직 존재하지 않아 신규 추가)

## Impact

- `apps/admin/src/features/admin-users/components/AdminUsersListClient.tsx`
- `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- `apps/admin/src/features/admin-users/components/AdminUserStatusBadge.tsx` (신규 분리 또는 기존 수정)
- `apps/admin/src/features/admin-users/components/AdminUserActions.tsx` (신규 분리 또는 기존 수정)
- `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`

## Meta

- feature: admin-user-design
- type: frontend
- package: apps/admin

프리로드: folder-conventions.md · dev-flow.md · forbidden-patterns.md
