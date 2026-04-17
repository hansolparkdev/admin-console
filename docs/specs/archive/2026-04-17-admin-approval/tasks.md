## 1. [api] Prisma 스키마 및 마이그레이션

- [x] 1.1 User 모델에 `status(pending|active|rejected)`, `role(super_admin|admin)` Enum + 컬럼 추가
  - 수정 파일: `apps/api/prisma/schema.prisma`
- [x] 1.2 Prisma migration 파일 생성 (`add-user-status-role`)
  - 수정 파일: `apps/api/prisma/migrations/<timestamp>_add_user_status_role/migration.sql`
- [x] 1.3 Prisma Client 재생성 확인 (`pnpm --filter api prisma generate`)
  - 수정 파일: 없음 (생성 확인만)

## 2. [api] AdminUsers 도메인 모듈

- [x] 2.1 AdminUsers 타입 정의
  - 수정 파일: `apps/api/src/admin-users/types.ts`
- [x] 2.2 UpdateAdminUser DTO 정의 (`status`, `action` 필드 + class-validator)
  - 수정 파일: `apps/api/src/admin-users/dto/update-admin-user.dto.ts`
- [x] 2.3 AdminUsersService 구현
  - `findAll(status?: string)`: 전체 관리자 목록 (상태 필터)
  - `findOne(id: string)`: 관리자 상세
  - `approve(id: string)`: status → active
  - `reject(id: string)`: status → rejected
  - `restore(id: string, targetStatus: 'pending' | 'active')`: rejected → pending/active
  - 수정 파일: `apps/api/src/admin-users/admin-users.service.ts`
- [x] 2.4 AdminUsersController 구현
  - `GET /admin/users`, `GET /admin/users/:id`
  - `PATCH /admin/users/:id/approve`
  - `PATCH /admin/users/:id/reject`
  - `PATCH /admin/users/:id/restore`
  - super_admin Guard 적용
  - 수정 파일: `apps/api/src/admin-users/admin-users.controller.ts`
- [x] 2.5 AdminUsersModule 등록 및 AppModule에 import
  - 수정 파일: `apps/api/src/admin-users/admin-users.module.ts`
  - 수정 파일: `apps/api/src/app.module.ts`

## 3. [api] AuthService 변경

- [x] 3.1 `checkAllowed` 로직을 환경변수 방식에서 DB status 조회 방식으로 교체
  - `ALLOWED_DOMAINS` / `ALLOWED_EMAILS` 환경변수 참조 제거
  - 신규 사용자 → `pending` 상태로 upsert
  - `pending` → `{ allowed: false, reason: "pending_approval" }` 반환
  - `active` → `{ allowed: true }` 반환
  - `rejected` → `{ allowed: false, reason: "rejected" }` 반환
  - 수정 파일: `apps/api/src/auth/auth.service.ts`
- [x] 3.2 부트스트랩 로직 추가: DB 관리자 0명일 때 최초 로그인 사용자를 `active + super_admin`으로 등록 (트랜잭션 + unique constraint 경합 방지)
  - 수정 파일: `apps/api/src/auth/auth.service.ts`
- [x] 3.3 Auth.js `signIn` 콜백에서 `checkAllowed` 결과에 따라 에러 리디렉션 연결
  - 수정 파일: `apps/api/src/auth/auth.service.ts` (또는 해당 Auth.js 설정 파일)

## 4. [api] super_admin Guard

- [x] 4.1 `SuperAdminGuard` 구현: JWT/세션에서 role 추출 → `super_admin` 아니면 403
  - 수정 파일: `apps/api/src/auth/guards/super-admin.guard.ts`
- [x] 4.2 Guard를 AdminUsersController에 적용 확인
  - 수정 파일: `apps/api/src/admin-users/admin-users.controller.ts`

## 5. [admin] 로그인 UI 상태별 토스트 + 자동 로그아웃

- [x] 5.1 Auth.js 에러 URL 파라미터(`error`, `reason`) 파싱 유틸 추가
  - 수정 파일: `apps/admin/src/features/auth/parse-auth-error.ts`
- [x] 5.2 LoginForm에서 `pending_approval` / `rejected` reason 감지 시 상태별 토스트 노출 후 `signOut()` 자동 호출
  - `pending_approval` → "승인 대기 중입니다. 관리자 승인 후 다시 로그인해 주세요."
  - `rejected` → "접근이 거절되었습니다. 관리자에게 문의해 주세요."
  - 수정 파일: `apps/admin/src/features/auth/components/LoginForm.tsx`

## 6. [admin] session-guard 강화

- [x] 6.1 `(app)/layout.tsx`에서 Auth.js `auth()` 세션 체크 후 `session.user.status !== 'active'`이면 `/login`으로 리디렉션
  - 수정 파일: `apps/admin/src/app/(app)/layout.tsx`
- [x] 6.2 Auth.js 세션 타입에 `status`, `role` 필드 추가 (타입 확장)
  - 수정 파일: `apps/admin/src/lib/auth-types.d.ts` (또는 `types/next-auth.d.ts`)

## 7. [admin] 관리자 목록 화면

- [x] 7.1 AdminUsers fetcher 구현 (`GET /api/admin/users?status=...`)
  - 수정 파일: `apps/admin/src/features/admin-users/api.ts`
- [x] 7.2 Query Key Factory + `useAdminUsers` hook 구현
  - 수정 파일: `apps/admin/src/features/admin-users/queries.ts`
- [x] 7.3 AdminUsers 타입 정의
  - 수정 파일: `apps/admin/src/features/admin-users/types.ts`
- [x] 7.4 `AdminUserStatusBadge` 컴포넌트 구현 (pending/active/rejected 뱃지)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserStatusBadge.tsx`
- [x] 7.5 `AdminUserTable` 컴포넌트 구현 (테이블 + 상태별 필터 탭, loading/error/empty 3상태 처리)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserTable.tsx`
- [x] 7.6 `/admin/users` 목록 페이지 (Server Component prefetch + HydrationBoundary)
  - 수정 파일: `apps/admin/src/app/(app)/admin/users/page.tsx`
- [x] 7.7 사이드바 네비게이션에 관리자 관리 메뉴 항목 추가 (super_admin 조건부 렌더링)
  - 수정 파일: `apps/admin/src/lib/navigation/menu-config.ts`

## 8. [admin] 관리자 상세 화면

- [x] 8.1 AdminUser 단건 fetcher + `useAdminUser` hook 구현
  - 수정 파일: `apps/admin/src/features/admin-users/api.ts`
  - 수정 파일: `apps/admin/src/features/admin-users/queries.ts`
- [x] 8.2 approve / reject / restore mutation fetcher 구현
  - 수정 파일: `apps/admin/src/features/admin-users/api.ts`
- [x] 8.3 `AdminUserActions` 컴포넌트 구현 (승인/거절/복구 버튼, 낙관적 업데이트 `queryClient.setQueryData`)
  - 수정 파일: `apps/admin/src/features/admin-users/components/AdminUserActions.tsx`
- [x] 8.4 `/admin/users/[id]` 상세 페이지 (Server Component prefetch + HydrationBoundary, super_admin 아니면 403/redirect)
  - 수정 파일: `apps/admin/src/app/(app)/admin/users/[id]/page.tsx`
