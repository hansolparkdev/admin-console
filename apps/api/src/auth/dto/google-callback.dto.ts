/**
 * POST /auth/verify 요청 바디.
 * Auth.js signIn 콜백이 Google ID Token을 전달한다.
 */
export class GoogleCallbackDto {
  /** Google ID Token (JWT) */
  idToken!: string;
  /** Google 사용자 이메일 */
  email!: string;
  /** Google 사용자 이름 */
  name?: string;
  /** Google 프로필 사진 URL */
  picture?: string;
  /** Google sub (providerAccountId) */
  sub!: string;
}
