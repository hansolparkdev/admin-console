import { IsOptional, IsString } from 'class-validator';

/**
 * POST /auth/verify 요청 바디.
 * Auth.js signIn 콜백이 Google ID Token을 전달한다.
 */
export class GoogleCallbackDto {
  /** Google ID Token (JWT) */
  @IsString()
  idToken!: string;
  /** Google 사용자 이메일 */
  @IsString()
  email!: string;
  /** Google 사용자 이름 */
  @IsOptional()
  @IsString()
  name?: string;
  /** Google 프로필 사진 URL */
  @IsOptional()
  @IsString()
  picture?: string;
  /** Google sub (providerAccountId) */
  @IsString()
  sub!: string;
}
