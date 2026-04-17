import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

const makeRole = (overrides = {}) => ({
  id: 'role-1',
  name: 'ADMIN',
  description: '일반 관리자',
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addUser: jest.fn(),
  removeUser: jest.fn(),
  setMenuPermissions: jest.fn(),
};

describe('RolesController', () => {
  let controller: RolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: mockService }],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    jest.clearAllMocks();
  });

  describe('GET /roles', () => {
    it('역할 목록을 반환한다', async () => {
      mockService.findAll.mockResolvedValue([makeRole()]);
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('GET /roles/:id', () => {
    it('역할 상세를 반환한다', async () => {
      mockService.findOne.mockResolvedValue(makeRole());
      const result = await controller.findOne('role-1');
      expect(result.id).toBe('role-1');
    });
  });

  describe('POST /roles', () => {
    it('역할을 생성한다', async () => {
      mockService.create.mockResolvedValue(makeRole());
      const result = await controller.create({ name: 'ADMIN' });
      expect(mockService.create).toHaveBeenCalledWith({ name: 'ADMIN' });
      expect(result).toBeDefined();
    });
  });

  describe('PATCH /roles/:id', () => {
    it('역할을 업데이트한다', async () => {
      mockService.update.mockResolvedValue(makeRole({ description: '수정됨' }));
      const result = await controller.update('role-1', {
        description: '수정됨',
      });
      expect(mockService.update).toHaveBeenCalledWith('role-1', {
        description: '수정됨',
      });
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /roles/:id', () => {
    it('역할을 삭제한다', async () => {
      mockService.remove.mockResolvedValue(makeRole());
      await controller.remove('role-1');
      expect(mockService.remove).toHaveBeenCalledWith('role-1');
    });
  });

  describe('POST /roles/:id/users', () => {
    it('역할에 사용자를 추가한다', async () => {
      mockService.addUser.mockResolvedValue({ id: 'ura-1' });
      const result = await controller.addUser('role-1', { userId: 'user-1' });
      expect(mockService.addUser).toHaveBeenCalledWith('role-1', 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('DELETE /roles/:id/users/:userId', () => {
    it('역할에서 사용자를 제거한다', async () => {
      mockService.removeUser.mockResolvedValue({ id: 'ura-1' });
      await controller.removeUser('role-1', 'user-1');
      expect(mockService.removeUser).toHaveBeenCalledWith('role-1', 'user-1');
    });
  });

  describe('PUT /roles/:id/menus', () => {
    it('메뉴 권한을 일괄 저장한다', async () => {
      mockService.setMenuPermissions.mockResolvedValue({ success: true });
      const result = await controller.setMenuPermissions('role-1', {
        permissions: [
          {
            menuId: 'menu-1',
            canRead: true,
            canWrite: false,
            canDelete: false,
          },
        ],
      });
      expect(mockService.setMenuPermissions).toHaveBeenCalledWith(
        'role-1',
        expect.any(Array),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
