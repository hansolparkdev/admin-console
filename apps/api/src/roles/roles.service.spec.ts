import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

const makeRole = (overrides = {}) => ({
  id: 'role-1',
  name: 'ADMIN',
  description: '일반 관리자',
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  picture: null,
  provider: 'google',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockPrisma = {
  role: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userRoleAssignment: {
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  roleMenu: {
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('역할 목록을 반환한다', async () => {
      const roles = [
        makeRole(),
        makeRole({ id: 'role-2', name: 'SUPER_ADMIN', isSystem: true }),
      ];
      mockPrisma.role.findMany.mockResolvedValue(roles);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('역할을 반환한다', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(makeRole());
      const result = await service.findOne('role-1');
      expect(result.id).toBe('role-1');
    });

    it('존재하지 않으면 NotFoundException', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      await expect(service.findOne('no-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('역할을 생성한다', async () => {
      const role = makeRole();
      mockPrisma.role.create.mockResolvedValue(role);
      const result = await service.create({ name: 'ADMIN' });
      expect(result).toEqual(role);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('역할을 업데이트한다', async () => {
      const role = makeRole();
      mockPrisma.role.findUnique.mockResolvedValue(role);
      const updated = { ...role, description: '수정됨' };
      mockPrisma.role.update.mockResolvedValue(updated);
      const result = await service.update('role-1', { description: '수정됨' });
      expect(result.description).toBe('수정됨');
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('isSystem=true 역할 삭제 시 ConflictException (409)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(
        makeRole({ isSystem: true, name: 'SUPER_ADMIN' }),
      );
      await expect(service.remove('role-super')).rejects.toThrow(
        ConflictException,
      );
    });

    it('할당된 관리자가 있으면 ConflictException (409)', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(
        makeRole({ isSystem: false }),
      );
      mockPrisma.userRoleAssignment.count.mockResolvedValue(1);
      await expect(service.remove('role-1')).rejects.toThrow(ConflictException);
    });

    it('일반 역할 삭제 성공', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(
        makeRole({ isSystem: false }),
      );
      mockPrisma.userRoleAssignment.count.mockResolvedValue(0);
      mockPrisma.role.delete.mockResolvedValue(makeRole());
      const result = await service.remove('role-1');
      expect(result).toBeDefined();
    });
  });

  // ─── addUser ───────────────────────────────────────────────────────────────
  describe('addUser()', () => {
    it('역할에 사용자를 추가한다', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(makeRole());
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue(null);
      mockPrisma.userRoleAssignment.create.mockResolvedValue({ id: 'ura-1' });
      const result = await service.addUser('role-1', 'user-1');
      expect(result).toBeDefined();
    });

    it('이미 할당된 사용자면 ConflictException', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(makeRole());
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue({
        id: 'existing',
      });
      await expect(service.addUser('role-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removeUser ────────────────────────────────────────────────────────────
  describe('removeUser()', () => {
    it('마지막 SUPER_ADMIN 사용자 제거 시 ConflictException', async () => {
      const superAdminRole = makeRole({
        id: 'role-super',
        name: 'SUPER_ADMIN',
        isSystem: true,
      });
      mockPrisma.role.findUnique.mockResolvedValue(superAdminRole);
      mockPrisma.userRoleAssignment.count.mockResolvedValue(1); // 마지막 1명
      await expect(service.removeUser('role-super', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('SUPER_ADMIN이 2명이면 한 명 제거 성공', async () => {
      const superAdminRole = makeRole({
        id: 'role-super',
        name: 'SUPER_ADMIN',
        isSystem: true,
      });
      mockPrisma.role.findUnique.mockResolvedValue(superAdminRole);
      mockPrisma.userRoleAssignment.count.mockResolvedValue(2); // 2명
      mockPrisma.userRoleAssignment.delete.mockResolvedValue({ id: 'ura-1' });
      const result = await service.removeUser('role-super', 'user-1');
      expect(result).toBeDefined();
    });

    it('일반 역할 사용자 제거 성공', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(
        makeRole({ isSystem: false }),
      );
      mockPrisma.userRoleAssignment.delete.mockResolvedValue({ id: 'ura-1' });
      const result = await service.removeUser('role-1', 'user-1');
      expect(result).toBeDefined();
    });
  });

  // ─── setMenuPermissions ────────────────────────────────────────────────────
  describe('setMenuPermissions()', () => {
    it('메뉴 권한 일괄 저장 성공', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(makeRole());
      mockPrisma.$transaction.mockResolvedValue(undefined);
      const result = await service.setMenuPermissions('role-1', [
        { menuId: 'menu-1', canRead: true, canWrite: false, canDelete: false },
      ]);
      expect(result).toEqual({ success: true });
    });
  });
});
