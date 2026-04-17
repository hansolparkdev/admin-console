## Context

현재 `User` 모델에 `role` enum 필드(super_admin/admin)가 있고, 사이드바 메뉴는 `lib/navigation/menu-config.ts`에 정적 배열로 하드코딩되어 있다. 관리자 관리(`/admin/users`)는 승인/거절/복구만 지원하며, 역할·메뉴·권한 개념이 DB에 없다. 인증은 Auth.js v5 + Google OIDC, BFF 프록시(`/api/[...proxy]`)를 통해 서버에서 Bearer 토큰을 주입한다.

## Goals / Non-Goals

**Goals:**
- Menu, Role, RoleMenu, UserRole 모델을 DB에 도입하여 RBAC를 코드 변경 없이 운영 가능하게 한다
- 사이드바를 `/auth/me` 응답의 메뉴 트리로 동적 전환한다
- 기존 `User.role` enum 사용자 데이터를 `UserRole` 관계로 무손실 마이그레이션한다
- 메뉴 관리·역할 관리 화면을 SUPER_ADMIN 역할만 접근 가능하도록 백엔드 Guard + 프론트 UI 양쪽에서 제어한다

**Non-Goals:**
- 3rd-party IdP 연동, OAuth scope 기반 권한은 범위 밖
- 메뉴별 UI 커스터마이징(아이콘 색상, 배지 등) 세부 스타일은 이 스펙에 포함하지 않음
- 퍼미션 정규화(Permission 별도 엔티티) — 이번 스펙은 canRead/canWrite/canDelete 컬럼 방식

## Decisions

### 1. User.role enum 제거 → UserRole 관계 테이블

`User.role` String 필드를 제거하고 `UserRole(userId, roleId)` 조인 테이블로 교체한다.
마이그레이션: Prisma migration에서 기존 `role = 'super_admin'` 사용자를 `SUPER_ADMIN` Role과 연결하는 SQL을 포함한다.

**이유**: 다중 역할 지원, 역할의 DB 관리 가능성, RBAC 확장을 위해 enum 필드로는 한계가 있다.

### 2. 권한 합집합(OR) 정책

관리자가 여러 역할을 가질 때 각 메뉴 권한(canRead/canWrite/canDelete)은 합집합으로 적용한다.
백엔드 `AuthService.me()`에서 `UserRole → RoleMenu`를 조인하여 최종 권한을 계산 후 응답에 포함한다.

**이유**: 최소 권한 정책(교집합)은 여러 역할 부여가 의미없게 만든다. 관리 편의상 OR이 표준 관행.

### 3. /auth/me 응답 확장 — 메뉴 트리 포함

```typescript
// GET /auth/me 응답 구조
{
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: string[];            // 역할 이름 배열
  menus: MenuTreeNode[];      // 허용된 메뉴 트리 (isActive=true, 권한 있는 것만)
}

// MenuTreeNode
{
  id: string;
  name: string;
  path: string | null;
  icon: string | null;
  order: number;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
  children: MenuTreeNode[];
}
```

**이유**: 사이드바가 매 렌더마다 별도 메뉴 API를 호출하지 않고 세션 기반 me 응답에서 트리를 수신하면 왕복 요청을 줄이고, 세션 만료와 메뉴 권한이 동기화된다.

### 4. RbacGuard — 백엔드 역할 체크

`apps/api/src/auth/guards/rbac.guard.ts`에서 `@Roles('SUPER_ADMIN')` 데코레이터를 읽고 `UserRole` 테이블을 조회하여 접근을 제어한다. 프론트엔드의 역할 체크는 UX 보조용으로만 사용하고, 실제 보안 게이트는 Guard에서만 담당한다.

**이유**: forbidden-patterns §1.3 — RBAC 체크를 프론트만 하는 것 금지.

### 5. 메뉴 트리 depth 제한 없음

재귀 `parentId` FK로 N-depth를 지원하되, Seed와 UI는 2depth를 기본으로 한다. 서비스 레이어에서 재귀적으로 트리를 조립한다.

**이유**: 스펙 §6 미결 사항에서 depth 상한 미결. N-depth 재귀 구조가 유연성을 보장하면서 2depth 제약을 런타임에 추가하기 쉽다.

### 6. 역할 삭제 시 할당된 관리자 있으면 차단

`RolesService.remove()`에서 `UserRole` 카운트를 먼저 확인하고 1건 이상이면 `409 Conflict`를 반환한다.

**이유**: plan.md §6 미결 사항 — 권장 정책(삭제 차단) 채택. 할당 해제 후 삭제 흐름은 관리자가 명시적으로 수행하도록 강제.

### 7. Prisma 스키마 신규 모델

```prisma
model Menu {
  id        String   @id @default(cuid())
  name      String
  path      String?
  icon      String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  parentId  String?
  parent    Menu?    @relation("MenuChildren", fields: [parentId], references: [id])
  children  Menu[]   @relation("MenuChildren")
  roleMenus RoleMenu[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Role {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  isSystem    Boolean    @default(false)   // true = 삭제 차단 (SUPER_ADMIN)
  userRoles   UserRole[]
  roleMenus   RoleMenu[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model RoleMenu {
  id          String  @id @default(cuid())
  roleId      String
  menuId      String
  canRead     Boolean @default(false)
  canWrite    Boolean @default(false)
  canDelete   Boolean @default(false)
  role        Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menu        Menu    @relation(fields: [menuId], references: [id], onDelete: Cascade)
  @@unique([roleId, menuId])
}

model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, roleId])
}

// User 모델 변경: role String 필드 제거, userRoles 관계 추가
// model User {
//   ...기존 필드...
//   role      String?   // 제거
//   userRoles UserRole[]  // 추가
// }
```

### 8. API 엔드포인트 목록

```
# Menus (super_admin 전용)
GET    /menus              트리 전체 조회 (관리 화면용, 비활성 포함)
POST   /menus              메뉴 생성
PATCH  /menus/:id          메뉴 수정 (이름/경로/아이콘/parentId/isActive)
DELETE /menus/:id          메뉴 삭제 (하위 있으면 409)
PATCH  /menus/:id/order    순서 변경 (direction: up | down)

# Roles (super_admin 전용)
GET    /roles              역할 목록 조회
POST   /roles              역할 생성
GET    /roles/:id          역할 상세 (관리자 목록 + 메뉴 권한 포함)
PATCH  /roles/:id          역할 수정 (name/description)
DELETE /roles/:id          역할 삭제 (isSystem=true 또는 UserRole 존재 시 409)
POST   /roles/:id/users    관리자 추가 (body: { userId })
DELETE /roles/:id/users/:userId  관리자 제거 (마지막 SUPER_ADMIN 제거 시 409)
PUT    /roles/:id/menus    메뉴별 권한 일괄 저장 (body: RoleMenuPermission[])

# Admin Users 확장 (super_admin 전용)
GET    /admin-users/:id/roles     관리자 역할 조회
POST   /admin-users/:id/roles     역할 할당 (active 상태만, body: { roleId })
DELETE /admin-users/:id/roles/:roleId  역할 제거 (마지막 SUPER_ADMIN 제거 시 409)

# Auth
GET    /auth/me            사용자 정보 + roles[] + menus[] (기존 확장)
```

### 9. 프론트엔드 폴더 구조

```
apps/admin/src/
├── app/(app)/
│   └── admin/
│       ├── menus/
│       │   └── page.tsx
│       ├── roles/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       └── errors/
│           └── 403/
│               └── page.tsx
├── features/
│   ├── menus/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── MenuTree.tsx
│   │       ├── MenuTreeItem.tsx
│   │       ├── MenuFormDialog.tsx
│   │       └── MenuOrderButtons.tsx
│   ├── roles/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── components/
│   │       ├── RoleList.tsx
│   │       ├── RoleFormDialog.tsx
│   │       ├── RoleDetail.tsx
│   │       ├── RoleUserList.tsx
│   │       ├── RoleUserAddDialog.tsx
│   │       └── RolePermissionMatrix.tsx
│   ├── admin-users/
│   │   └── components/
│   │       ├── UserRoleList.tsx         (신규)
│   │       └── UserRoleAssignDialog.tsx (신규)
│   └── auth/
│       └── types.ts                    (me 응답 타입 확장)
└── components/
    └── layout/
        └── SidebarNav.tsx              (동적 로딩으로 수정)
```

## Risks / Trade-offs

- **마이그레이션 데이터 정합성**: `User.role` enum → `UserRole` 관계 전환 시 기존 사용자 데이터가 누락되면 로그인 불가. → 마이그레이션 SQL에 `INSERT INTO "UserRole" SELECT ...` 포함, 스테이징에서 반드시 검증.
- **me() 응답 비대화**: 메뉴 트리가 커질수록 me() 응답 크기 증가. → 클라이언트 캐시(TanStack Query)로 재요청 최소화. 메뉴 수십 개 수준이면 실용적으로 문제없음.
- **RbacGuard 성능**: 매 요청마다 `UserRole` 조회. → JWT payload에 역할 이름을 포함하거나 Redis 캐시로 보완 (현 스펙에서는 DB 조회 허용, 추후 개선 포인트).
- **403 페이지 라우팅**: 권한 없는 경로 접근 시 클라이언트 리다이렉트 vs 서버 redirect 혼용 위험. → 서버 컴포넌트(page.tsx)에서 `auth()` 기반 권한 체크 → `redirect('/admin/errors/403')` 패턴으로 통일.
