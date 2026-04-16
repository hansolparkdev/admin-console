import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    account: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyGoogleToken', () => {
    describe('허용 도메인·목록 미설정 (개발 환경)', () => {
      it('ALLOWED_DOMAINS, ALLOWED_EMAILS 모두 비어 있으면 전체 허용', () => {
        const originalDomains = process.env.ALLOWED_DOMAINS;
        const originalEmails = process.env.ALLOWED_EMAILS;
        delete process.env.ALLOWED_DOMAINS;
        delete process.env.ALLOWED_EMAILS;

        const result = service.checkAllowed('anyone@gmail.com');

        expect(result).toEqual({ allowed: true });

        process.env.ALLOWED_DOMAINS = originalDomains;
        process.env.ALLOWED_EMAILS = originalEmails;
      });
    });

    describe('허용된 조직 도메인 계정', () => {
      it('ALLOWED_DOMAINS=example.com 이면 user@example.com 허용', () => {
        const original = process.env.ALLOWED_DOMAINS;
        process.env.ALLOWED_DOMAINS = 'example.com';
        delete process.env.ALLOWED_EMAILS;

        const result = service.checkAllowed('user@example.com');

        expect(result).toEqual({ allowed: true });
        process.env.ALLOWED_DOMAINS = original;
      });
    });

    describe('비인가 개인 Gmail 계정', () => {
      it('ALLOWED_DOMAINS=example.com 이면 user@gmail.com 거부', () => {
        const original = process.env.ALLOWED_DOMAINS;
        process.env.ALLOWED_DOMAINS = 'example.com';
        delete process.env.ALLOWED_EMAILS;

        const result = service.checkAllowed('user@gmail.com');

        expect(result).toEqual({
          allowed: false,
          reason: 'unauthorized_domain',
        });
        process.env.ALLOWED_DOMAINS = original;
      });
    });

    describe('허용 목록에 명시된 개인 계정', () => {
      it('ALLOWED_EMAILS에 명시된 이메일은 도메인 무관 허용', () => {
        const originalDomains = process.env.ALLOWED_DOMAINS;
        const originalEmails = process.env.ALLOWED_EMAILS;
        process.env.ALLOWED_DOMAINS = 'example.com';
        process.env.ALLOWED_EMAILS = 'special@gmail.com';

        const result = service.checkAllowed('special@gmail.com');

        expect(result).toEqual({ allowed: true });
        process.env.ALLOWED_DOMAINS = originalDomains;
        process.env.ALLOWED_EMAILS = originalEmails;
      });
    });
  });

  describe('upsertUser', () => {
    it('최초 로그인 시 User·Account 레코드를 생성한다', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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
      const existingUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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

      // 두 번 호출해도 같은 user가 반환됨
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

      // upsert는 create 없이 update 경로를 탄다 — 중복 없음
      expect(mockPrismaService.user.upsert).toHaveBeenCalledTimes(2);
      expect(secondCall.id).toBe('user-1');
    });
  });
});
