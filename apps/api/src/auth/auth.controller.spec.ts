import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    checkAllowed: jest.fn(),
    upsertUser: jest.fn(),
    me: jest.fn(),
  };

  const mockResponse = {
    clearCookie: jest.fn(),
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/verify — Google ID Token 검증 + DB status 조회', () => {
    it('active 계정이면 200 + { allowed: true, user } 반환', async () => {
      const allowedResult = {
        allowed: true,
        user: {
          email: 'user@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
        },
      };
      mockAuthService.checkAllowed.mockResolvedValue(allowedResult);
      mockAuthService.upsertUser.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.verify({
        idToken: 'google-id-token',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        sub: 'google-sub-123',
      });

      expect(result.allowed).toBe(true);
    });

    it('pending 계정이면 { allowed: false, reason: "pending_approval" } 반환', async () => {
      mockAuthService.checkAllowed.mockResolvedValue({
        allowed: false,
        reason: 'pending_approval',
      });

      const result = await controller.verify({
        idToken: 'google-id-token',
        email: 'new@example.com',
        name: 'New User',
        sub: 'google-sub-456',
      });

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe('pending_approval');
      }
    });

    it('rejected 계정이면 { allowed: false, reason: "rejected" } 반환', async () => {
      mockAuthService.checkAllowed.mockResolvedValue({
        allowed: false,
        reason: 'rejected',
      });

      const result = await controller.verify({
        idToken: 'google-id-token',
        email: 'banned@example.com',
        name: 'Banned User',
        sub: 'google-sub-789',
      });

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe('rejected');
      }
    });
  });

  describe('GET /auth/me — 세션 사용자 정보', () => {
    it('request.user.email로 me() 반환 (SessionAuthGuard가 주입)', async () => {
      const mockMe = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        picture: null,
        status: 'active',
        roles: ['ADMIN'],
        menus: [],
      };
      mockAuthService.me.mockResolvedValue(mockMe);

      const result = await controller.me({
        user: { email: 'user@example.com' },
      });
      expect(result).toEqual(mockMe);
      expect(mockAuthService.me).toHaveBeenCalledWith('user@example.com');
    });

    it('request.user 없으면 null 반환', async () => {
      const result = await controller.me({});
      expect(result).toBeNull();
    });
  });

  describe('POST /auth/logout — 세션 파기', () => {
    it('세션 쿠키를 만료 처리하고 200 반환', () => {
      controller.logout(mockResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        expect.stringContaining('authjs'),
        expect.any(Object),
      );
    });
  });
});
