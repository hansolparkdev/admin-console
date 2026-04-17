import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * BFF 패턴: Bearer(Google ID Token) 서명 검증 + x-user-role 헤더로 super_admin 확인.
 * - Bearer: Google JWKS로 서명 검증 (위변조 방지)
 * - x-user-role: Next.js BFF 프록시가 Auth.js 세션에서 추출해 전달 (Google ID Token에 role 클레임 없음)
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
    }>();

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7);

    try {
      await jwtVerify(token, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: process.env.AUTH_GOOGLE_ID,
      });
    } catch {
      throw new UnauthorizedException();
    }

    const role = request.headers['x-user-role'];
    if (role !== 'super_admin') {
      throw new ForbiddenException('super_admin role required');
    }

    return true;
  }
}
