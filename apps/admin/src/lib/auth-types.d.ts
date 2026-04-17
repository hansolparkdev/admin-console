/**
 * Auth.js v5 세션 타입 확장.
 * session.user.status / session.user.role 타입 안전을 위해 Module Augmentation 사용.
 *
 * API /auth/verify 응답에서 role·status를 JWT 토큰에 담아
 * session 콜백에서 session.user로 전파한다.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      /** 사용자 승인 상태 (pending | active | rejected) */
      status?: "pending" | "active" | "rejected";
      /** 사용자 역할 (super_admin | admin) */
      role?: "super_admin" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Google ID Token — BFF 프록시가 Bearer로 NestJS에 전달 */
    idToken?: string;
    /** Google Refresh Token — ID Token 자동 갱신용 */
    refreshToken?: string;
    /** ID Token 만료 시각 (ms, Unix timestamp) */
    idTokenExpires?: number;
    /** 사용자 승인 상태 */
    status?: "pending" | "active" | "rejected";
    /** 사용자 역할 */
    role?: "super_admin" | "admin";
  }
}

declare module "next-auth" {
  interface Session {
    /** Google ID Token — BFF 프록시용 */
    idToken?: string;
  }
}
