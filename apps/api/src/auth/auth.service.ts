import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpsertUserInput {
  email: string;
  name?: string;
  picture?: string;
  providerAccountId: string;
}

export interface CheckAllowedResult {
  allowed: true;
  user?: { email: string; name?: string; picture?: string };
}

export interface CheckDeniedResult {
  allowed: false;
  reason: 'unauthorized_domain';
}

export type AllowedCheckResult = CheckAllowedResult | CheckDeniedResult;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 허용 도메인·이메일 기반으로 계정을 검증한다.
   * ALLOWED_DOMAINS, ALLOWED_EMAILS 미설정 시 전체 허용(개발 환경 안전망).
   */
  checkAllowed(email: string): AllowedCheckResult {
    const allowedDomains = (process.env.ALLOWED_DOMAINS ?? '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    // 도메인·이메일 미설정 → 전체 허용 (개발 모드)
    if (allowedDomains.length === 0 && allowedEmails.length === 0) {
      return { allowed: true };
    }

    // 허용 이메일 목록에 포함
    if (allowedEmails.includes(email)) {
      return { allowed: true };
    }

    // 허용 도메인에 포함
    const domain = email.split('@')[1] ?? '';
    if (allowedDomains.includes(domain)) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'unauthorized_domain' };
  }

  /**
   * Google OAuth 계정 정보를 DB에 upsert한다.
   * 최초 로그인: User·Account 레코드 생성.
   * 재로그인: updatedAt 갱신, 중복 생성 없음.
   */
  async upsertUser(input: UpsertUserInput) {
    const { email, name, picture, providerAccountId } = input;

    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email, name, picture, provider: 'google' },
      update: { name, picture },
    });

    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId,
        },
      },
      create: {
        userId: user.id,
        provider: 'google',
        providerAccountId,
      },
      update: {},
    });

    return user;
  }
}
