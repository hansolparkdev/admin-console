## Why

현재 권한 체계는 `User.role` enum(super_admin/admin) 2값에 고정되어 역할 추가·메뉴별 세분화가 불가능하다.
사이드바 메뉴가 `menu-config.ts`에 하드코딩되어 있어 메뉴 추가·순서 변경·비활성화 시 코드 배포가 필요하다.
역할(Role)·메뉴(Menu)·권한(Permission)을 DB 기반으로 관리하여 코드 변경 없이 접근 제어와 메뉴 구성을 운영할 수 있게 한다.

## What Changes

- `Menu` 테이블 신설: 계층 트리, 순서, 활성 여부, 아이콘 관리
- `Role` 테이블 신설: 역할 CRUD, SUPER_ADMIN 삭제 차단
- `RoleMenu` 조인 테이블: 역할-메뉴 간 canRead/canWrite/canDelete 권한 매트릭스
- `UserRole` 조인 테이블: 다대다 역할 할당 (기존 `User.role` enum 대체)
- `User.role` enum 필드 제거 → `UserRole` 관계 테이블로 교체, 기존 데이터 마이그레이션
- `/admin/menus` 신규 페이지: 메뉴 트리 CRUD + 순서 변경 + 활성 토글
- `/admin/roles` 신규 페이지: 역할 CRUD + 관리자 배정 + 권한 매트릭스
- `/admin/users` 기존 페이지 확장: 역할 할당 기능 추가 (active 상태만)
- `/auth/me` 응답 확장: 사용자의 메뉴 트리(+권한) 포함
- `SidebarNav` 동적 로딩: `menu-config.ts` 정적 파일 → API 메뉴 트리로 교체
- 403 안내 페이지 신설
- Seed 데이터: 초기 메뉴·역할·권한, 기존 사용자 마이그레이션

## Capabilities

### New Capabilities

- `menu-management`: `/admin/menus` — 메뉴 트리 CRUD, 순서 변경, 활성/비활성, 하위 있으면 삭제 차단
- `role-management`: `/admin/roles` — 역할 CRUD + 관리자 배정 + 메뉴별 canRead/canWrite/canDelete 권한 매트릭스
- `admin-users-rbac`: `/admin/users` 역할 할당 확장 — active 관리자에게만, 마지막 SUPER_ADMIN 제거 차단
- `rbac-seed`: 초기 메뉴·역할·권한 Seed + `User.role` enum → `UserRole` 마이그레이션

### Modified Capabilities

- `sidebar-navigation`: 정적 `menu-config.ts` → `/auth/me` 메뉴 트리 동적 로딩, 로딩/에러/빈 상태 처리, 403 접근 차단 연동

## Impact

**Backend (apps/api)**
- `apps/api/prisma/schema.prisma` — Menu, Role, RoleMenu, UserRole 모델 추가, User.role enum 제거
- `apps/api/prisma/migrations/` — 신규 마이그레이션 파일
- `apps/api/prisma/seed.ts` — 초기 메뉴·역할·권한, 마이그레이션 로직
- `apps/api/src/menus/` — MenusModule, MenusController, MenusService, DTO 신설
- `apps/api/src/roles/` — RolesModule, RolesController, RolesService, DTO 신설
- `apps/api/src/admin-users/` — AdminUsersService 역할 할당 메서드 추가
- `apps/api/src/auth/auth.service.ts` — me() 응답에 메뉴 트리 + 권한 포함
- `apps/api/src/auth/guards/` — RbacGuard, roles.decorator.ts 추가

**Frontend (apps/admin)**
- `apps/admin/src/app/(app)/admin/menus/page.tsx` — 메뉴 관리 페이지
- `apps/admin/src/app/(app)/admin/roles/page.tsx` — 역할 관리 페이지
- `apps/admin/src/app/(app)/admin/roles/[id]/page.tsx` — 역할 상세 페이지
- `apps/admin/src/features/menus/` — 메뉴 관리 feature 슬라이스 신설
- `apps/admin/src/features/roles/` — 역할 관리 feature 슬라이스 신설
- `apps/admin/src/features/admin-users/` — 역할 할당 기능 확장
- `apps/admin/src/features/auth/` — me 쿼리 응답 타입 확장
- `apps/admin/src/components/layout/SidebarNav.tsx` — 동적 메뉴 로딩으로 교체
- `apps/admin/src/lib/navigation/menu-config.ts` — 정적 설정 제거/비활성화
- `apps/admin/src/app/(app)/admin/errors/403/page.tsx` — 403 안내 페이지

## Meta

- feature: rbac-menu-management
- type: fullstack
- package: monorepo

프리로드: folder-conventions.md · dev-flow.md · forbidden-patterns.md
