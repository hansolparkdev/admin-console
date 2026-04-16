import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from './auth.guard';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from 'jose';

const mockJwtVerify = jwtVerify as jest.Mock;

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionAuthGuard],
    }).compile();

    guard = module.get<SessionAuthGuard>(SessionAuthGuard);
    jest.clearAllMocks();
  });

  const createMockContext = (
    headers: Record<string, string>,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as unknown as ExecutionContext;

  describe('인증된 세션으로 보호 엔드포인트 접근', () => {
    it('유효한 Bearer 토큰이면 true 반환', async () => {
      mockJwtVerify.mockResolvedValue({ payload: { sub: 'user-1' } });

      const ctx = createMockContext({
        authorization: 'Bearer valid-jwt-token',
      });

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        'valid-jwt-token',
        'mock-jwks',
        expect.objectContaining({ issuer: expect.any(Array) }),
      );
    });
  });

  describe('미인증 상태에서 보호 엔드포인트 접근', () => {
    it('Authorization 헤더가 없으면 UnauthorizedException', async () => {
      const ctx = createMockContext({});
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Bearer 형식이 아닌 헤더면 UnauthorizedException', async () => {
      const ctx = createMockContext({ authorization: 'Basic base64encoded' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('JWT 서명 검증 실패 시 UnauthorizedException', async () => {
      mockJwtVerify.mockRejectedValue(new Error('invalid signature'));

      const ctx = createMockContext({ authorization: 'Bearer invalid-token' });
      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
