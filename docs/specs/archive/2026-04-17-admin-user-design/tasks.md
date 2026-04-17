## 1. AdminUserStatusBadge 컴포넌트

- [x] 1.1 상태 칩 Tailwind 재작성 — pending/active/rejected 색상 분기
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserStatusBadge.tsx`

## 2. AdminUserActions 컴포넌트

- [x] 2.1 액션 버튼 Tailwind 재작성 — 상태별 버튼 조합 (pending: 승인+거절, active: 거절만, rejected: 복구+승인)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserActions.tsx`

## 3. AdminUserTable 컴포넌트

- [x] 3.1 탭 그룹 pill 형태 Tailwind 재작성 — 컨테이너 `bg-surface-container-low rounded-full p-1`, 활성 탭 `bg-primary text-white rounded-full shadow-md`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.2 테이블 컨테이너 Tailwind 재작성 — `bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.3 테이블 헤더 행 Tailwind 재작성 — `bg-surface-container-low`, th `text-[0.75rem] font-bold text-on-surface-variant uppercase tracking-[0.05em]`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.4 테이블 데이터 행 교대 배경 Tailwind 재작성 — 홀수 `bg-surface-container-low`, 짝수 `bg-surface-container-lowest`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.5 이름 컬럼 링크 스타일 — `text-primary font-bold hover:underline`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.6 역할 뱃지 Tailwind 재작성 — `text-xs font-semibold px-2 py-1 bg-surface-container rounded text-on-surface-variant`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 3.7 `AdminUserStatusBadge`, `AdminUserActions` 분리 컴포넌트 연결 (기존 인라인 분기 교체)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`

## 4. AdminUsersListClient 컴포넌트

- [x] 4.1 페이지 헤더 Tailwind 재작성 — 제목·설명 인라인 style 제거
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUsersListClient.tsx`

## 5. AdminUserDetailClient 컴포넌트

- [x] 5.1 12컬럼 그리드 레이아웃 적용 — `grid grid-cols-12 gap-8`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.2 유저 정보 카드 컨테이너 — `col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8` + ambient shadow `style`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.3 아바타 + 상태 도트 — `w-16 h-16 rounded-full object-cover` + 우하단 오버레이 도트 (pending=amber-500, active=green-500, rejected=red-500)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.4 이름/이메일/상태 뱃지 pill — `px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.5 정보 행 3종 (상태/역할/등록일) — `border-b border-surface-container`, 라벨 `text-xs font-bold text-on-surface-variant uppercase tracking-wider`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.6 액션 카드 컨테이너 — `col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-8` + ambient shadow `style`
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
- [x] 5.7 액션 카드 버튼 — pending: gradient 승인 `bg-gradient-to-br from-[#22c55e] to-[#16a34a]` + outline 거절 `border-2 border-error text-error`, 상태별 조합
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserDetailClient.tsx`
