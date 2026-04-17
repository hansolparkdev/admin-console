import { Test, TestingModule } from '@nestjs/testing';
import { MenusService } from './menus.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const makeMenu = (overrides = {}) => ({
  id: 'menu-1',
  name: '대시보드',
  path: '/dashboard',
  icon: 'LayoutDashboard',
  order: 0,
  isActive: true,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockPrismaService = {
  menu: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('MenusService', () => {
  let service: MenusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MenusService>(MenusService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('메뉴 트리 반환 — parentId 기반 계층 구조', async () => {
      const menus = [
        makeMenu({ id: 'p-1', parentId: null }),
        makeMenu({ id: 'c-1', parentId: 'p-1', order: 0 }),
      ];
      mockPrismaService.menu.findMany.mockResolvedValue(menus);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]?.children).toHaveLength(1);
    });

    it('빈 메뉴 목록 반환', async () => {
      mockPrismaService.menu.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create()', () => {
    it('메뉴 정상 생성', async () => {
      const menu = makeMenu();
      mockPrismaService.menu.create.mockResolvedValue(menu);
      const result = await service.create({ name: '대시보드' });
      expect(result).toEqual(menu);
    });
  });

  describe('update()', () => {
    it('메뉴 업데이트 성공', async () => {
      const menu = makeMenu();
      mockPrismaService.menu.findUnique.mockResolvedValue(menu);
      const updated = { ...menu, name: '수정됨' };
      mockPrismaService.menu.update.mockResolvedValue(updated);
      const result = await service.update('menu-1', { name: '수정됨' });
      expect(result.name).toBe('수정됨');
    });

    it('존재하지 않는 메뉴 업데이트 시 NotFoundException', async () => {
      mockPrismaService.menu.findUnique.mockResolvedValue(null);
      await expect(service.update('no-id', { name: '수정' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove()', () => {
    it('하위 메뉴가 있으면 ConflictException (409)', async () => {
      mockPrismaService.menu.findUnique.mockResolvedValue(makeMenu());
      mockPrismaService.menu.count.mockResolvedValue(1); // 하위 메뉴 있음
      await expect(service.remove('menu-1')).rejects.toThrow(ConflictException);
    });

    it('하위 메뉴 없으면 정상 삭제', async () => {
      mockPrismaService.menu.findUnique.mockResolvedValue(makeMenu());
      mockPrismaService.menu.count.mockResolvedValue(0);
      mockPrismaService.menu.delete.mockResolvedValue(makeMenu());
      const result = await service.remove('menu-1');
      expect(result).toBeDefined();
    });

    it('존재하지 않으면 NotFoundException', async () => {
      mockPrismaService.menu.findUnique.mockResolvedValue(null);
      await expect(service.remove('no-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder()', () => {
    it('최상단 메뉴 위로 이동 시 ConflictException', async () => {
      const menus = [
        makeMenu({ id: 'menu-1', order: 0, parentId: null }),
        makeMenu({ id: 'menu-2', order: 1, parentId: null }),
      ];
      mockPrismaService.menu.findUnique.mockResolvedValue(menus[0]);
      mockPrismaService.menu.findMany.mockResolvedValue(menus);
      await expect(service.reorder('menu-1', 'up')).rejects.toThrow(
        ConflictException,
      );
    });

    it('두 번째 메뉴 위로 이동 시 swap 성공', async () => {
      const menus = [
        makeMenu({ id: 'menu-1', order: 0, parentId: null }),
        makeMenu({ id: 'menu-2', order: 1, parentId: null }),
      ];
      mockPrismaService.menu.findUnique.mockResolvedValue(menus[1]);
      mockPrismaService.menu.findMany.mockResolvedValue(menus);
      mockPrismaService.menu.update.mockResolvedValue({});
      const result = await service.reorder('menu-2', 'up');
      expect(mockPrismaService.menu.update).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });
  });
});
