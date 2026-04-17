import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest
    .fn()
    .mockResolvedValue({
      payload: { sub: 'google-sub-123', email: 'admin@example.com' },
    }),
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  userRoleAssignment: {
    findMany: jest.fn(),
  },
};

const createMockContext = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  }) as unknown as ExecutionContext;

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        Reflector,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get<Reflector>(Reflector);
    jest.clearAllMocks();
  });

  it('Authorization 헤더 없으면 UnauthorizedException', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);
    const ctx = createMockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('@Roles() 없으면 true 반환 (공개 엔드포인트)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ authorization: 'Bearer token' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('빈 역할 배열이면 true 반환 (공개 엔드포인트)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = createMockContext({ authorization: 'Bearer token' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('JWT payload에 email 없고 유저 조회 실패 시 UnauthorizedException', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    // jwtVerify가 email을 반환하지만 DB에 유저 없음
    const ctx = createMockContext({ authorization: 'Bearer valid-token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('유저가 요구 역할 보유 시 true 반환', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      { role: { name: 'SUPER_ADMIN' } },
    ]);
    const ctx = createMockContext({ authorization: 'Bearer valid-token' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('유저가 요구 역할 없으면 ForbiddenException', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_ADMIN']);
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      { role: { name: 'ADMIN' } },
    ]);
    const ctx = createMockContext({ authorization: 'Bearer valid-token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('다중 역할 중 하나라도 일치하면 true 반환', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['SUPER_ADMIN', 'ADMIN']);
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
    });
    mockPrismaService.userRoleAssignment.findMany.mockResolvedValue([
      { role: { name: 'ADMIN' } },
    ]);
    const ctx = createMockContext({ authorization: 'Bearer valid-token' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
