## 1. DB 스키마 및 마이그레이션

- [x] 1.1 Prisma 스키마에 Menu, Role, RoleMenu, UserRole 모델 추가, User.role 필드 제거
  - 수정 파일: `apps/api/prisma/schema.prisma`
- [x] 1.2 Prisma 마이그레이션 생성 (`pnpm --filter api prisma migrate dev --name add_rbac_menu`)
  - 수정 파일: `apps/api/prisma/migrations/<timestamp>_add_rbac_menu/migration.sql`
- [x] 1.3 마이그레이션 SQL에 기존 `User.role = 'super_admin'` → SUPER_ADMIN UserRole 연결 INSERT 포함
  - 수정 파일: `apps/api/prisma/migrations/<timestamp>_add_rbac_menu/migration.sql`

## 2. Seed 데이터

- [x] 2.1 초기 Role 생성: SUPER_ADMIN(isSystem=true), ADMIN
  - 수정 파일: `apps/api/prisma/seed.ts`
- [x] 2.2 초기 Menu 생성: 대시보드, 관리자 관리, 메뉴 관리, 역할 관리 (order 설정)
  - 수정 파일: `apps/api/prisma/seed.ts`
- [x] 2.3 SUPER_ADMIN 역할에 전체 메뉴 canRead/canWrite/canDelete=true RoleMenu 생성
  - 수정 파일: `apps/api/prisma/seed.ts`
- [x] 2.4 ADMIN 역할에 대시보드 canRead=true RoleMenu 생성
  - 수정 파일: `apps/api/prisma/seed.ts`
- [x] 2.5 기존 super_admin enum 사용자 → SUPER_ADMIN 역할 UserRole 연결 (upsert)
  - 수정 파일: `apps/api/prisma/seed.ts`

## 3. 백엔드 공통 — RbacGuard + 데코레이터

- [x] 3.1 `@Roles()` 데코레이터 생성
  - 수정 파일: `apps/api/src/auth/guards/roles.decorator.ts`
- [x] 3.2 `RbacGuard` 구현 — JWT payload userId → UserRole 조회 → 역할 검증
  - 수정 파일: `apps/api/src/auth/guards/rbac.guard.ts`
- [x] 3.3 AppModule에 RbacGuard 등록
  - 수정 파일: `apps/api/src/app.module.ts`

## 4. Auth — /auth/me 응답 확장

- [x] 4.1 `AuthService.me()` — UserRole → Role + RoleMenu 조인하여 menus 트리 계산, roles[] 포함
  - 수정 파일: `apps/api/src/auth/auth.service.ts`
- [x] 4.2 `MeResponseDto` 신규 타입 — roles, menus(MenuTreeNode) 포함
  - 수정 파일: `apps/api/src/auth/dto/me-response.dto.ts`
- [x] 4.3 `AuthController.me()` 응답 타입 업데이트
  - 수정 파일: `apps/api/src/auth/auth.controller.ts`

## 5. 메뉴 관리 API (apps/api)

- [x] 5.1 `MenusModule` 생성 및 AppModule 등록
  - 수정 파일: `apps/api/src/menus/menus.module.ts`, `apps/api/src/app.module.ts`
- [x] 5.2 `CreateMenuDto`, `UpdateMenuDto`, `ReorderMenuDto` DTO 생성
  - 수정 파일: `apps/api/src/menus/dto/create-menu.dto.ts`, `apps/api/src/menus/dto/update-menu.dto.ts`, `apps/api/src/menus/dto/reorder-menu.dto.ts`
- [x] 5.3 `MenusService` 구현 — 트리 조회(재귀), CRUD, 순서 변경(swap), 삭제 보호
  - 수정 파일: `apps/api/src/menus/menus.service.ts`
- [x] 5.4 `MenusController` 구현 — `@Roles('SUPER_ADMIN')` 적용
  - 수정 파일: `apps/api/src/menus/menus.controller.ts`

## 6. 역할 관리 API (apps/api)

- [x] 6.1 `RolesModule` 생성 및 AppModule 등록
  - 수정 파일: `apps/api/src/roles/roles.module.ts`, `apps/api/src/app.module.ts`
- [x] 6.2 `CreateRoleDto`, `UpdateRoleDto`, `RoleMenuPermissionDto` DTO 생성
  - 수정 파일: `apps/api/src/roles/dto/create-role.dto.ts`, `apps/api/src/roles/dto/update-role.dto.ts`, `apps/api/src/roles/dto/role-menu-permission.dto.ts`
- [x] 6.3 `RolesService` 구현 — CRUD, isSystem 삭제 차단, UserRole 카운트 삭제 차단, 관리자 추가/제거, 마지막 SUPER_ADMIN 제거 차단, 메뉴 권한 일괄 저장
  - 수정 파일: `apps/api/src/roles/roles.service.ts`
- [x] 6.4 `RolesController` 구현 — `@Roles('SUPER_ADMIN')` 적용
  - 수정 파일: `apps/api/src/roles/roles.controller.ts`

## 7. 관리자 관리 API 확장 (apps/api)

- [x] 7.1 `AdminUsersService`에 역할 조회/할당/제거 메서드 추가 — active 상태 검증, 마지막 SUPER_ADMIN 제거 차단
  - 수정 파일: `apps/api/src/admin-users/admin-users.service.ts`
- [x] 7.2 `AdminUsersController`에 역할 관련 엔드포인트 추가 — `@Roles('SUPER_ADMIN')` 적용
  - 수정 파일: `apps/api/src/admin-users/admin-users.controller.ts`
- [x] 7.3 `UserRoleDto` 신규 DTO 생성
  - 수정 파일: `apps/api/src/admin-users/dto/user-role.dto.ts`

## 8. 프론트엔드 — 공통 타입 및 쿼리 키

- [x] 8.1 `me` 응답 타입 확장 — `MenuTreeNode`, `MeResponse` 타입 정의
  - 수정 파일: `apps/admin/src/features/auth/types.ts`
- [x] 8.2 메뉴 Query Key Factory 생성
  - 수정 파일: `apps/admin/src/lib/query-keys/menu-keys.ts`
- [x] 8.3 역할 Query Key Factory 생성
  - 수정 파일: `apps/admin/src/lib/query-keys/role-keys.ts`

## 9. SidebarNav 동적 로딩 (apps/admin)

- [x] 9.1 `SidebarNav`를 서버 prefetch + `useQuery` 기반으로 교체 — `menu-config.ts` 정적 참조 제거
  - 수정 파일: `apps/admin/src/components/layout/SidebarNav.tsx`
- [x] 9.2 `(app)/layout.tsx`에서 메뉴 me 데이터 서버 prefetch → `HydrationBoundary` 전달
  - 수정 파일: `apps/admin/src/app/(app)/layout.tsx`
- [x] 9.3 `SidebarNav` 로딩/에러/빈 상태 처리 — 스켈레톤, 재시도 버튼, "역할이 할당되지 않았습니다" 안내 + 그룹 메뉴 접기/펼치기 토글
  - 수정 파일: `apps/admin/src/components/layout/SidebarNav.tsx`

## 10. 메뉴 관리 기능 UI (apps/admin)

- [x] 10.1 메뉴 관리 API fetcher 구현
  - 수정 파일: `apps/admin/src/features/menus/api.ts`
- [x] 10.2 메뉴 관리 Query/Mutation 훅 구현 (Query Key Factory 사용)
  - 수정 파일: `apps/admin/src/features/menus/queries.ts`
- [x] 10.3 메뉴 트리 타입 정의
  - 수정 파일: `apps/admin/src/features/menus/types.ts`
- [x] 10.4 `MenuTree`, `MenuTreeItem`, `MenuOrderButtons` 컴포넌트 구현
  - 수정 파일: `apps/admin/src/features/menus/components/MenuTree.tsx`, `apps/admin/src/features/menus/components/MenuTreeItem.tsx`, `apps/admin/src/features/menus/components/MenuOrderButtons.tsx`
- [x] 10.5 `MenuFormDialog` 컴포넌트 구현 (react-hook-form + zod)
  - 수정 파일: `apps/admin/src/features/menus/components/MenuFormDialog.tsx`
- [x] 10.6 `/admin/menus` 페이지 구현 — 서버 prefetch + HydrationBoundary
  - 수정 파일: `apps/admin/src/app/(app)/admin/menus/page.tsx`

## 11. 역할 관리 기능 UI (apps/admin)

- [x] 11.1 역할 관리 API fetcher 구현
  - 수정 파일: `apps/admin/src/features/roles/api.ts`
- [x] 11.2 역할 관리 Query/Mutation 훅 구현 (Query Key Factory 사용)
  - 수정 파일: `apps/admin/src/features/roles/queries.ts`
- [x] 11.3 역할 타입 정의
  - 수정 파일: `apps/admin/src/features/roles/types.ts`
- [x] 11.4 `RoleList`, `RoleFormDialog` 컴포넌트 구현
  - 수정 파일: `apps/admin/src/features/roles/components/RoleList.tsx`, `apps/admin/src/features/roles/components/RoleFormDialog.tsx`
- [x] 11.5 `RolePermissionMatrix` 컴포넌트 구현 — 메뉴 × canRead/canWrite/canDelete 체크박스 그리드
  - 수정 파일: `apps/admin/src/features/roles/components/RolePermissionMatrix.tsx`
- [x] 11.6 `RoleUserList`, `RoleUserAddDialog` 컴포넌트 구현
  - 수정 파일: `apps/admin/src/features/roles/components/RoleUserList.tsx`, `apps/admin/src/features/roles/components/RoleUserAddDialog.tsx`
- [x] 11.7 `/admin/roles` 목록 페이지 구현
  - 수정 파일: `apps/admin/src/app/(app)/admin/roles/page.tsx`
- [x] 11.8 `/admin/roles/[id]` 상세 페이지 구현 — 서버 prefetch
  - 수정 파일: `apps/admin/src/app/(app)/admin/roles/[id]/page.tsx`

## 12. 관리자 관리 역할 할당 UI (apps/admin)

- [x] 12.1 `UserRoleList`, `UserRoleAssignDialog` 컴포넌트 구현
  - 수정 파일: `apps/admin/src/features/admin-users/components/UserRoleList.tsx`, `apps/admin/src/features/admin-users/components/UserRoleAssignDialog.tsx`
- [x] 12.2 기존 관리자 관리 queries.ts에 역할 관련 Query/Mutation 추가
  - 수정 파일: `apps/admin/src/features/admin-users/queries.ts`
- [x] 12.3 기존 관리자 상세/목록 페이지에 역할 섹션 통합
  - 수정 파일: `apps/admin/src/app/(app)/admin/users/[id]/page.tsx`

## 13. 403 안내 페이지

- [x] 13.1 `/admin/errors/403` 페이지 구현 — "접근 권한이 없습니다" 안내 + 홈으로 이동 버튼
  - 수정 파일: `apps/admin/src/app/(app)/admin/errors/403/page.tsx`

## 14. lib/navigation 정리

- [x] 14.1 `menu-config.ts` 정적 메뉴 배열 제거 또는 빈 배열로 교체 (동적 로딩으로 대체됨)
  - 수정 파일: `apps/admin/src/lib/navigation/menu-config.ts`
