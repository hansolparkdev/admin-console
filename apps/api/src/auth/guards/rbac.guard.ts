import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * RBAC Guard.
 *
 * 1. @Roles() 데코레이터가 없거나 빈 배열이면 공개 엔드포인트로 간주, 통과.
 * 2. Authorization: Bearer 검증 (Google JWKS).
 * 3. x-user-email 헤더에서 유저 조회 → UserRoleAssignment → Role 매핑.
 * 4. 보유 역할 중 하나라도 @Roles()와 일치하면 통과, 아니면 ForbiddenException.
 *
 * BFF 프록시(route.ts)가 Auth.js 세션에서 idToken + email을 헤더로 전달한다.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // @Roles() 없으면 공개 엔드포인트
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
    }>();

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7);

    let userEmail: string;
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: process.env.AUTH_GOOGLE_ID,
      });
      const email = payload['email'] as string | undefined;
      if (!email) throw new UnauthorizedException();
      userEmail = email;
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    // 사용자 역할 조회
    const userRoles = await this.prisma.userRoleAssignment.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    const roleNames = userRoles.map((ur) => ur.role.name);
    const hasRole = requiredRoles.some((r) => roleNames.includes(r));

    if (!hasRole) {
      throw new ForbiddenException('필요한 역할이 없습니다');
    }

    return true;
  }
}
