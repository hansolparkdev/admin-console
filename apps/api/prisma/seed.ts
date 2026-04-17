/**
 * Prisma seed — admin-console RBAC 초기 데이터
 *
 * 멱등 실행 보장: upsert 사용으로 중복 생성 없음
 *
 * 생성 목록:
 * - Role: SUPER_ADMIN (isSystem=true), ADMIN
 * - Menu: 대시보드, 관리자 관리, 메뉴 관리, 역할 관리
 * - RoleMenu: SUPER_ADMIN → 전체 메뉴 canRead/canWrite/canDelete=true
 * - RoleMenu: ADMIN → 대시보드 canRead=true
 * - UserRoleAssignment: 기존 super_admin 사용자 → SUPER_ADMIN 역할 연결
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ─── 1. Role 생성 ──────────────────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    create: {
      id: 'role-super-admin-system',
      name: 'SUPER_ADMIN',
      description: '시스템 슈퍼 관리자 역할. 모든 기능에 접근 가능.',
      isSystem: true,
    },
    update: {
      description: '시스템 슈퍼 관리자 역할. 모든 기능에 접근 가능.',
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    create: {
      id: 'role-admin-system',
      name: 'ADMIN',
      description: '일반 관리자 역할. 기본 조회 권한 보유.',
      isSystem: false,
    },
    update: {
      description: '일반 관리자 역할. 기본 조회 권한 보유.',
    },
  });

  // ─── 2. Menu 생성 ──────────────────────────────────────────────────────────
  const dashboardMenu = await prisma.menu.upsert({
    where: { id: 'menu-dashboard' },
    create: {
      id: 'menu-dashboard',
      name: '대시보드',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      order: 0,
      isActive: true,
    },
    update: {
      name: '대시보드',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      order: 0,
    },
  });

  const adminUsersMenu = await prisma.menu.upsert({
    where: { id: 'menu-admin-users' },
    create: {
      id: 'menu-admin-users',
      name: '관리자 관리',
      path: '/admin/users',
      icon: 'ShieldCheck',
      order: 1,
      isActive: true,
    },
    update: {
      name: '관리자 관리',
      path: '/admin/users',
      icon: 'ShieldCheck',
      order: 1,
    },
  });

  const menusMenu = await prisma.menu.upsert({
    where: { id: 'menu-menus' },
    create: {
      id: 'menu-menus',
      name: '메뉴 관리',
      path: '/admin/menus',
      icon: 'Menu',
      order: 2,
      isActive: true,
    },
    update: {
      name: '메뉴 관리',
      path: '/admin/menus',
      icon: 'Menu',
      order: 2,
    },
  });

  const rolesMenu = await prisma.menu.upsert({
    where: { id: 'menu-roles' },
    create: {
      id: 'menu-roles',
      name: '역할 관리',
      path: '/admin/roles',
      icon: 'Lock',
      order: 3,
      isActive: true,
    },
    update: {
      name: '역할 관리',
      path: '/admin/roles',
      icon: 'Lock',
      order: 3,
    },
  });

  // ─── 3. SUPER_ADMIN RoleMenu (전체 권한) ──────────────────────────────────
  const allMenus = [dashboardMenu, adminUsersMenu, menusMenu, rolesMenu];

  for (const menu of allMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: { roleId: superAdminRole.id, menuId: menu.id },
      },
      create: {
        roleId: superAdminRole.id,
        menuId: menu.id,
        canRead: true,
        canWrite: true,
        canDelete: true,
      },
      update: {
        canRead: true,
        canWrite: true,
        canDelete: true,
      },
    });
  }

  // ─── 4. ADMIN RoleMenu (대시보드 canRead만) ────────────────────────────────
  await prisma.roleMenu.upsert({
    where: {
      roleId_menuId: { roleId: adminRole.id, menuId: dashboardMenu.id },
    },
    create: {
      roleId: adminRole.id,
      menuId: dashboardMenu.id,
      canRead: true,
      canWrite: false,
      canDelete: false,
    },
    update: {
      canRead: true,
      canWrite: false,
      canDelete: false,
    },
  });

  // ─── 5. 기존 super_admin 사용자 → SUPER_ADMIN 역할 UserRoleAssignment ─────
  // 이미 마이그레이션 SQL에서 처리됐지만 seed에서 멱등으로 재확인
  const superAdminUsers = await prisma.user.findMany({
    where: { userRoles: { none: { roleId: superAdminRole.id } } },
  });

  // 새로 생성된 사용자 중 아직 역할이 없는 경우만 처리
  // (실제로는 마이그레이션으로 이미 처리됨)
  for (const user of superAdminUsers) {
    // 역할이 전혀 없는 사용자는 무시 (seed 목적은 데이터 초기화)
    const hasAnyRole = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id },
    });
    if (!hasAnyRole) {
      await prisma.userRoleAssignment.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }
  }

  console.log('Seed completed:');
  console.log(
    `- Roles: SUPER_ADMIN (${superAdminRole.id}), ADMIN (${adminRole.id})`,
  );
  console.log(`- Menus: ${allMenus.map((m) => m.name).join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
