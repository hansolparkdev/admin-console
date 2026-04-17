import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

const makeUser = (
  overrides: Partial<{
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    provider: string;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) => ({
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin User',
  picture: null,
  provider: 'google',
  status: UserStatus.pending,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeRole = (overrides = {}) => ({
  id: 'role-super',
  name: 'SUPER_ADMIN',
  description: '슈퍼 관리자',
  isSystem: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userRoleAssignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('status 필터 없이 전체 목록을 반환한다', async () => {
      const users = [
        makeUser(),
        makeUser({ id: 'user-2', status: UserStatus.active }),
      ];
      mockPrisma.$transaction.mockResolvedValue([users, 2]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(2);
    });

    it('status 필터가 있으면 해당 상태만 조회한다', async () => {
      const users = [makeUser({ status: UserStatus.pending })];
      mockPrisma.$transaction.mockResolvedValue([users, 1]);

      const result = await service.findAll(UserStatus.pending);

      expect(result.data).toHaveLength(1);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('존재하는 사용자를 반환한다', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('user-1');

      expect(result).toEqual(user);
    });

    it('존재하지 않는 사용자이면 NotFoundException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── approve ───────────────────────────────────────────────────────────────
  describe('approve', () => {
    it('pending 사용자를 active로 변경한다', async () => {
      const user = makeUser({ status: UserStatus.pending });
      const updated = makeUser({ status: UserStatus.active });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.approve('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: UserStatus.active },
      });
      expect(result.status).toBe(UserStatus.active);
    });

    it('이미 active인 사용자이면 ConflictException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ status: UserStatus.active }),
      );

      await expect(service.approve('user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('존재하지 않는 사용자이면 NotFoundException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.approve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── reject ────────────────────────────────────────────────────────────────
  describe('reject', () => {
    it('pending 사용자를 rejected로 변경한다', async () => {
      const user = makeUser({ status: UserStatus.pending });
      const updated = makeUser({ status: UserStatus.rejected });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.reject('user-1', 'requester-999');

      expect(result.status).toBe(UserStatus.rejected);
    });

    it('active 사용자를 rejected로 변경한다', async () => {
      const user = makeUser({ status: UserStatus.active });
      const updated = makeUser({ status: UserStatus.rejected });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.reject('user-1', 'requester-999');

      expect(result.status).toBe(UserStatus.rejected);
    });

    it('자기 자신을 거절하면 BadRequestException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser({ id: 'user-1' }));

      await expect(service.reject('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('존재하지 않는 사용자이면 NotFoundException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.reject('nonexistent', 'requester-999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── restore ───────────────────────────────────────────────────────────────
  describe('restore', () => {
    it('rejected 사용자를 pending으로 복구한다', async () => {
      const user = makeUser({ status: UserStatus.rejected });
      const updated = makeUser({ status: UserStatus.pending });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.restore('user-1', 'pending');

      expect(result.status).toBe(UserStatus.pending);
    });

    it('rejected 사용자를 active로 복구한다', async () => {
      const user = makeUser({ status: UserStatus.rejected });
      const updated = makeUser({ status: UserStatus.active });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.restore('user-1', 'active');

      expect(result.status).toBe(UserStatus.active);
    });

    it('rejected가 아닌 사용자를 복구하면 BadRequestException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ status: UserStatus.active }),
      );

      await expect(service.restore('user-1', 'pending')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('존재하지 않는 사용자이면 NotFoundException을 던진다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.restore('nonexistent', 'pending')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getUserRoles ──────────────────────────────────────────────────────────
  describe('getUserRoles', () => {
    it('사용자 역할 목록을 반환한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.userRoleAssignment.findMany.mockResolvedValue([
        { id: 'ura-1', role: makeRole() },
      ]);
      const result = await service.getUserRoles('user-1');
      expect(result).toHaveLength(1);
    });

    it('사용자가 없으면 NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserRoles('no-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── assignRole ───────────────────────────────────────────────────────────
  describe('assignRole', () => {
    it('active 사용자에게 역할을 할당한다', async () => {
      const user = makeUser({ status: UserStatus.active });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue(null);
      mockPrisma.userRoleAssignment.create.mockResolvedValue({ id: 'ura-new' });
      const result = await service.assignRole('user-1', 'role-super');
      expect(result).toBeDefined();
    });

    it('비활성 사용자에게 역할 할당 시 ConflictException', async () => {
      const user = makeUser({ status: UserStatus.pending });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.assignRole('user-1', 'role-super')).rejects.toThrow(
        ConflictException,
      );
    });

    it('이미 할당된 역할이면 ConflictException', async () => {
      const user = makeUser({ status: UserStatus.active });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue({
        id: 'existing',
      });
      await expect(service.assignRole('user-1', 'role-super')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── removeRole ───────────────────────────────────────────────────────────
  describe('removeRole', () => {
    it('마지막 SUPER_ADMIN 역할 제거 시 ConflictException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      const superAdminRole = makeRole({ name: 'SUPER_ADMIN', isSystem: true });
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue({
        id: 'ura-1',
        role: superAdminRole,
      });
      mockPrisma.userRoleAssignment.count.mockResolvedValue(1); // 마지막 1명
      await expect(service.removeRole('user-1', 'role-super')).rejects.toThrow(
        ConflictException,
      );
    });

    it('SUPER_ADMIN이 2명이면 한 명 역할 제거 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      const superAdminRole = makeRole({ name: 'SUPER_ADMIN', isSystem: true });
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue({
        id: 'ura-1',
        role: superAdminRole,
      });
      mockPrisma.userRoleAssignment.count.mockResolvedValue(2); // 2명
      mockPrisma.userRoleAssignment.delete.mockResolvedValue({ id: 'ura-1' });
      const result = await service.removeRole('user-1', 'role-super');
      expect(result).toBeDefined();
    });

    it('일반 역할 제거 성공', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue({
        id: 'ura-1',
        role: makeRole({ name: 'ADMIN', isSystem: false }),
      });
      mockPrisma.userRoleAssignment.delete.mockResolvedValue({ id: 'ura-1' });
      const result = await service.removeRole('user-1', 'role-1');
      expect(result).toBeDefined();
    });

    it('역할 할당이 없으면 NotFoundException', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.userRoleAssignment.findUnique.mockResolvedValue(null);
      await expect(service.removeRole('user-1', 'role-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
