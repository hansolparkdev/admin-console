import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './auth.guard';
import { GoogleCallbackDto } from './dto/google-callback.dto';

/**
 * Auth.js v5 signIn 콜백이 호출하는 엔드포인트.
 * - POST /auth/verify : 조직 계정 검증
 * - GET  /auth/me     : 세션 사용자 정보 (AuthGuard 적용)
 * - POST /auth/logout : 세션 파기
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Google ID Token 검증 + 조직 계정 허용 규칙 응답.
   * 허용: { allowed: true, user: { email, name, picture } }
   * 거부: { allowed: false, reason: "unauthorized_domain" }
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: GoogleCallbackDto) {
    // DB status 조회 방식으로 허용 여부 확인
    const checkResult = await this.authService.checkAllowed({
      email: dto.email,
      name: dto.name,
      picture: dto.picture,
      providerAccountId: dto.sub,
    });

    if (!checkResult.allowed) {
      return checkResult; // { allowed: false, reason: 'pending_approval' | 'rejected' }
    }

    // Account 연결 레코드 upsert
    await this.authService.upsertUser({
      email: dto.email,
      name: dto.name,
      picture: dto.picture,
      providerAccountId: dto.sub,
    });

    return checkResult; // { allowed: true, user: { email, name, picture, role } }
  }

  /**
   * 인증된 세션 사용자 정보 반환.
   * BFF 프록시가 세션 → Bearer + x-user-email 헤더로 전달한다.
   * roles[], menus(MenuTreeNode) 포함.
   */
  @Get('me')
  @UseGuards(SessionAuthGuard)
  async me(@Req() req: { user?: { email: string } }) {
    const email = req.user?.email;
    if (!email) return null;
    return this.authService.me(email);
  }

  /**
   * 세션 파기. Auth.js 세션 쿠키를 만료 처리한다.
   * JWT 기반이므로 클라이언트 쿠키 삭제가 유일한 파기 수단.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() res: Response) {
    // Auth.js v5 기본 쿠키명 패턴: authjs.session-token (production: __Secure-authjs.session-token)
    res.clearCookie('authjs.session-token', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
    res.clearCookie('__Secure-authjs.session-token', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });
    res.json({ success: true });
  }
}
