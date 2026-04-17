import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { UserStatus } from '@prisma/client';

// jose는 ESM 모듈이므로 mock 처리
jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

const makeUser = (overrides = {}) => ({
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

const mockRequest = (userId = 'requester-1') => ({
  user: { sub: userId },
});

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    restore: jest.fn(),
    getUserRoles: jest.fn(),
    assignRole: jest.fn(),
    removeRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: AdminUsersService, useValue: mockService }],
    })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /admin/users', () => {
    it('status 없이 전체 목록을 반환한다', async () => {
      mockService.findAll.mockResolvedValue([makeUser()]);
      const result = await controller.findAll(undefined, undefined, undefined);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined, 1, 10);
      expect(result).toHaveLength(1);
    });

    it('status 필터를 전달한다', async () => {
      mockService.findAll.mockResolvedValue([
        makeUser({ status: UserStatus.active }),
      ]);
      const result = await controller.findAll(
        UserStatus.active,
        undefined,
        undefined,
      );
      expect(mockService.findAll).toHaveBeenCalledWith(
        UserStatus.active,
        1,
        10,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('사용자 상세를 반환한다', async () => {
      const user = makeUser();
      mockService.findOne.mockResolvedValue(user);
      const result = await controller.findOne('user-1');
      expect(result).toEqual(user);
    });
  });

  describe('PATCH /admin/users/:id/approve', () => {
    it('approve를 호출한다', async () => {
      const user = makeUser({ status: UserStatus.active });
      mockService.approve.mockResolvedValue(user);
      const result = await controller.approve('user-1');
      expect(mockService.approve).toHaveBeenCalledWith('user-1');
      expect(result.status).toBe(UserStatus.active);
    });
  });

  describe('PATCH /admin/users/:id/reject', () => {
    it('reject를 requester ID와 함께 호출한다', async () => {
      const user = makeUser({ status: UserStatus.rejected });
      mockService.reject.mockResolvedValue(user);
      const req = mockRequest('requester-999');
      const result = await controller.reject('user-1', req as any);
      expect(mockService.reject).toHaveBeenCalledWith(
        'user-1',
        'requester-999',
      );
      expect(result.status).toBe(UserStatus.rejected);
    });
  });

  describe('PATCH /admin/users/:id/restore', () => {
    it('restore를 targetStatus pending으로 호출한다', async () => {
      const user = makeUser({ status: UserStatus.pending });
      mockService.restore.mockResolvedValue(user);
      const result = await controller.restore('user-1', {
        targetStatus: 'pending',
      });
      expect(mockService.restore).toHaveBeenCalledWith('user-1', 'pending');
      expect(result.status).toBe(UserStatus.pending);
    });

    it('restore를 targetStatus active로 호출한다', async () => {
      const user = makeUser({ status: UserStatus.active });
      mockService.restore.mockResolvedValue(user);
      const result = await controller.restore('user-1', {
        targetStatus: 'active',
      });
      expect(mockService.restore).toHaveBeenCalledWith('user-1', 'active');
      expect(result.status).toBe(UserStatus.active);
    });
  });

  describe('GET /admin/users/:id/roles', () => {
    it('사용자 역할 목록을 반환한다', async () => {
      mockService.getUserRoles.mockResolvedValue([
        { id: 'ura-1', role: { name: 'SUPER_ADMIN' } },
      ]);
      const result = await controller.getUserRoles('user-1');
      expect(mockService.getUserRoles).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('POST /admin/users/:id/roles', () => {
    it('역할을 할당한다', async () => {
      mockService.assignRole.mockResolvedValue({ id: 'ura-new' });
      const result = await controller.assignRole('user-1', {
        roleId: 'role-super',
      });
      expect(mockService.assignRole).toHaveBeenCalledWith(
        'user-1',
        'role-super',
      );
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /admin/users/:id/roles/:roleId', () => {
    it('역할을 제거한다', async () => {
      mockService.removeRole.mockResolvedValue({ id: 'ura-1' });
      await controller.removeRole('user-1', 'role-super');
      expect(mockService.removeRole).toHaveBeenCalledWith(
        'user-1',
        'role-super',
      );
    });
  });
});
