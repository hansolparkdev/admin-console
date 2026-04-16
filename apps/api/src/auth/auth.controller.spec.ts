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

  describe('POST /auth/verify — Google ID Token 검증', () => {
    it('허용된 계정이면 200 + { allowed: true } 반환', async () => {
      mockAuthService.checkAllowed.mockReturnValue({ allowed: true });
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
      expect(result.user).toMatchObject({ email: 'user@example.com' });
    });

    it('비인가 계정이면 403 + { allowed: false, reason }', async () => {
      mockAuthService.checkAllowed.mockReturnValue({
        allowed: false,
        reason: 'unauthorized_domain',
      });

      const result = await controller.verify({
        idToken: 'google-id-token',
        email: 'user@gmail.com',
        name: 'Personal User',
        sub: 'google-sub-456',
      });

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.reason).toBe('unauthorized_domain');
      }
    });
  });

  describe('GET /auth/me — 세션 사용자 정보', () => {
    it('요청 user 객체를 반환한다', () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = controller.me({ user: mockUser });
      expect(result).toEqual(mockUser);
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
