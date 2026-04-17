import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

const mockPrismaService = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  account: {
    upsert: jest.fn(),
  },
  userRoleAssignment: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AuthService.me()', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('존재하지 않는 이메일이면 null 반환', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    const result = await service.me('unknown@example.com');
    expect(result).toBeNull();
  });

  it('역할 없는 사용자: roles=[], menus=[] 반환', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test',
      picture: null,
      status: UserStatus.active,
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([]);

    const result = await service.me('user@example.com');
    expect(result).not.toBeNull();
    expect(result!.roles).toEqual([]);
    expect(result!.menus).toEqual([]);
  });

  it('단일 역할, 단일 메뉴 → roles, menus 반환', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      picture: null,
      status: UserStatus.active,
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      {
        role: {
          name: 'SUPER_ADMIN',
          roleMenus: [
            {
              canRead: true,
              canWrite: true,
              canDelete: true,
              menu: {
                id: 'menu-1',
                name: '대시보드',
                path: '/dashboard',
                icon: 'LayoutDashboard',
                order: 0,
                isActive: true,
                parentId: null,
              },
            },
          ],
        },
      },
    ]);

    const result = await service.me('admin@example.com');
    expect(result!.roles).toContain('SUPER_ADMIN');
    expect(result!.menus).toHaveLength(1);
    expect(result!.menus[0]).toMatchObject({
      id: 'menu-1',
      name: '대시보드',
      permissions: { canRead: true, canWrite: true, canDelete: true },
      children: [],
    });
  });

  it('다중 역할 권한 합집합: canRead=true OR canWrite=true 합산', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'multi@example.com',
      name: 'Multi',
      picture: null,
      status: UserStatus.active,
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      {
        role: {
          name: 'ROLE_R1',
          roleMenus: [
            {
              canRead: true,
              canWrite: false,
              canDelete: false,
              menu: {
                id: 'menu-m',
                name: '메뉴M',
                path: '/m',
                icon: null,
                order: 0,
                isActive: true,
                parentId: null,
              },
            },
          ],
        },
      },
      {
        role: {
          name: 'ROLE_R2',
          roleMenus: [
            {
              canRead: false,
              canWrite: true,
              canDelete: false,
              menu: {
                id: 'menu-m',
                name: '메뉴M',
                path: '/m',
                icon: null,
                order: 0,
                isActive: true,
                parentId: null,
              },
            },
          ],
        },
      },
    ]);

    const result = await service.me('multi@example.com');
    expect(result!.menus[0]).toMatchObject({
      permissions: { canRead: true, canWrite: true, canDelete: false },
    });
  });

  it('비활성 메뉴(isActive=false)는 반환하지 않음', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      picture: null,
      status: UserStatus.active,
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      {
        role: {
          name: 'ADMIN',
          roleMenus: [
            {
              canRead: true,
              canWrite: false,
              canDelete: false,
              menu: {
                id: 'menu-inactive',
                name: '비활성메뉴',
                path: '/inactive',
                icon: null,
                order: 0,
                isActive: false,
                parentId: null,
              },
            },
          ],
        },
      },
    ]);

    const result = await service.me('user@example.com');
    expect(result!.menus).toHaveLength(0);
  });

  it('계층 트리: parentId 기반으로 children 배열로 조립', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      picture: null,
      status: UserStatus.active,
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      {
        role: {
          name: 'SUPER_ADMIN',
          roleMenus: [
            {
              canRead: true,
              canWrite: true,
              canDelete: true,
              menu: {
                id: 'parent-1',
                name: '부모메뉴',
                path: null,
                icon: null,
                order: 0,
                isActive: true,
                parentId: null,
              },
            },
            {
              canRead: true,
              canWrite: false,
              canDelete: false,
              menu: {
                id: 'child-1',
                name: '자식메뉴',
                path: '/child',
                icon: null,
                order: 0,
                isActive: true,
                parentId: 'parent-1',
              },
            },
          ],
        },
      },
    ]);

    const result = await service.me('user@example.com');
    expect(result!.menus).toHaveLength(1); // 루트만
    expect(result!.menus[0]?.children).toHaveLength(1);
    expect(result!.menus[0]?.children[0]?.name).toBe('자식메뉴');
  });
});
