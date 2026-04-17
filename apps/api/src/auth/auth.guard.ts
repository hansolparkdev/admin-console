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
 * BFF 패턴: Bearer(Google ID Token)를 Google JWKS로 서명 검증한다.
 * 검증 후 payload의 email 클레임을 request.user에 주입한다.
 * x-user-email 헤더 불필요 — email은 ID Token payload에 포함되어 있다.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: { email: string };
    }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice(7);

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: process.env.AUTH_GOOGLE_ID,
      });
      const email = payload['email'] as string | undefined;
      if (!email) throw new UnauthorizedException();
      request.user = { email };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
