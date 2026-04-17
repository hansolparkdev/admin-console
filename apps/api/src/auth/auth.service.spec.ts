import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
  provider: 'google',
  status: UserStatus.pending,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    account: {
      upsert: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRoleAssignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── checkAllowed (DB status 기반) ─────────────────────────────────────────
  describe('checkAllowed', () => {
    it('신규 사용자: pending으로 upsert 후 pending_approval 반환', async () => {
      mockPrismaService.user.count.mockResolvedValue(1); // 이미 사용자 있음
      const pendingUser = makeUser({ status: UserStatus.pending });
      mockPrismaService.user.upsert.mockResolvedValue(pendingUser);

      const result = await service.checkAllowed({
        email: 'new@example.com',
        name: 'New User',
        picture: null,
        providerAccountId: 'sub-123',
      });

      expect(result).toEqual({ allowed: false, reason: 'pending_approval' });
    });

    it('active 사용자: 허용 반환', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);
      const activeUser = makeUser({
        status: UserStatus.active,
      });
      mockPrismaService.user.upsert.mockResolvedValue(activeUser);

      const result = await service.checkAllowed({
        email: 'active@example.com',
        name: 'Active User',
        picture: null,
        providerAccountId: 'sub-456',
      });

      expect(result).toEqual({
        allowed: true,
        user: expect.objectContaining({ email: activeUser.email }),
      });
    });

    it('rejected 사용자: rejected 반환', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);
      const rejectedUser = makeUser({ status: UserStatus.rejected });
      mockPrismaService.user.upsert.mockResolvedValue(rejectedUser);

      const result = await service.checkAllowed({
        email: 'rejected@example.com',
        name: 'Rejected User',
        picture: null,
        providerAccountId: 'sub-789',
      });

      expect(result).toEqual({ allowed: false, reason: 'rejected' });
    });

    it('DB 관리자 0명(최초 사용자): active로 등록', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      const bootstrapUser = makeUser({
        status: UserStatus.active,
      });
      // $transaction 내부에서 upsert 호출을 시뮬레이션
      mockPrismaService.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
          return fn(mockPrismaService);
        },
      );
      mockPrismaService.user.upsert.mockResolvedValue(bootstrapUser);
      // bootstrapFirstUser 내부: SUPER_ADMIN 역할 찾기 + UserRoleAssignment 연결
      mockPrismaService.role.findUnique.mockResolvedValue(null); // 역할 없으면 skip
      mockPrismaService.userRoleAssignment.upsert.mockResolvedValue({});

      const result = await service.checkAllowed({
        email: 'first@example.com',
        name: 'First User',
        picture: null,
        providerAccountId: 'sub-first',
      });

      expect(result).toEqual({
        allowed: true,
        user: expect.objectContaining({ email: bootstrapUser.email }),
      });
    });

    it('부트스트랩 경합: 트랜잭션 내 count가 1이면 pending으로 처리', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(0) // 첫 count (트랜잭션 전)
        .mockResolvedValueOnce(1); // 트랜잭션 내 count (이미 선점됨)

      mockPrismaService.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrismaService) => Promise<unknown>) => {
          return fn(mockPrismaService);
        },
      );
      const pendingUser = makeUser({ status: UserStatus.pending });
      mockPrismaService.user.upsert.mockResolvedValue(pendingUser);

      const result = await service.checkAllowed({
        email: 'race@example.com',
        name: 'Race User',
        picture: null,
        providerAccountId: 'sub-race',
      });

      expect(result).toEqual({ allowed: false, reason: 'pending_approval' });
    });
  });

  // ─── upsertUser (기존 유지) ─────────────────────────────────────────────────
  describe('upsertUser', () => {
    it('최초 로그인 시 User·Account 레코드를 생성한다', async () => {
      const mockUser = makeUser();
      mockPrismaService.user.upsert.mockResolvedValue(mockUser);
      mockPrismaService.account.upsert.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-123',
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      });

      const result = await service.upsertUser({
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        providerAccountId: 'google-sub-123',
      });

      expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'user@example.com' },
        }),
      );
      expect(mockPrismaService.account.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('재로그인 시 기존 User 레코드를 유지한다', async () => {
      const existingUser = makeUser();
      mockPrismaService.user.upsert.mockResolvedValue(existingUser);
      mockPrismaService.account.upsert.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-123',
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      });

      await service.upsertUser({
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        providerAccountId: 'google-sub-123',
      });

      const secondCall = await service.upsertUser({
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        providerAccountId: 'google-sub-123',
      });

      expect(mockPrismaService.user.upsert).toHaveBeenCalledTimes(2);
      expect(secondCall.id).toBe('user-1');
    });
  });
});
