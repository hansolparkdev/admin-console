import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Bearer 토큰(Google ID Token)을 Google JWKS로 서명 검증한다.
 * Auth.js v5 BFF 패턴에서 세션 → Bearer 변환 후 호출되는 엔드포인트 보호용.
 * 미인증 또는 서명 검증 실패 시 401 UnauthorizedException을 반환한다.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
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
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
