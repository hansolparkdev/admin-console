import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getCallbackUrl } from "./auth-utils";

/**
 * Auth.js v5 설정.
 *
 * 세션 전략: JWT (기본값).
 * 서버 측 강제 만료가 필요해지면 Redis adapter로 교체 예정.
 *
 * 조직 계정 검증: signIn 콜백에서 apps/api /auth/verify 호출.
 * 비인가 계정은 false를 반환하여 Auth.js가 /login?error=unauthorized_domain 으로 redirect.
 *
 * ID Token 갱신: Google ID Token은 1시간 만료. jwt 콜백에서 만료 5분 전
 * Refresh Token으로 새 ID Token을 자동 갱신한다.
 */

/** Google token endpoint로 ID Token 갱신 */
async function refreshGoogleIdToken(refreshToken: string): Promise<{
  id_token?: string;
  expires_in?: number;
  error?: string;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return res.json() as Promise<{
    id_token?: string;
    expires_in?: number;
    error?: string;
  }>;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // refresh_token을 받으려면 access_type=offline 필수
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Google provider 외에는 거부
      if (account?.provider !== "google") return false;

      const apiUrl = process.env.API_URL ?? "http://localhost:3001";

      try {
        const res = await fetch(`${apiUrl}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: account.id_token ?? "",
            email: user.email ?? "",
            name: user.name ?? "",
            picture: user.image ?? "",
            sub: account.providerAccountId,
          }),
        });

        const data = (await res.json()) as {
          allowed: boolean;
          reason?: string;
          user?: {
            email: string;
            name?: string | null;
            picture?: string | null;
            role?: "super_admin" | "admin";
            status?: "pending" | "active" | "rejected";
          };
        };

        if (!data.allowed) {
          // Auth.js는 false 반환 시 /login?error=<reason> 으로 redirect한다.
          return `/login?error=${data.reason ?? "unauthorized_domain"}`;
        }

        // JWT 토큰에 role·status를 저장하기 위해 user 객체에 반영
        // user는 Auth.js 내부 User 타입이지만 JWT 콜백에서 확장 필드를 전달하기 위해 캐스팅
        const extUser = user as typeof user & {
          role?: "super_admin" | "admin";
          status?: "pending" | "active" | "rejected";
        };
        if (data.user?.role) {
          extUser.role = data.user.role;
        }
        if (data.user?.status) {
          extUser.status = data.user.status;
        }

        return true;
      } catch {
        return "/login?error=Configuration";
      }
    },

    async jwt({ token, user, account }) {
      // 최초 로그인: account에서 토큰 정보 저장
      if (account) {
        if (account.id_token) token.idToken = account.id_token;
        if (account.refresh_token) token.refreshToken = account.refresh_token;
        // expires_at은 초 단위 Unix timestamp
        if (account.expires_at)
          token.idTokenExpires = account.expires_at * 1000;
      }

      // signIn 직후 user 객체에서 role·status를 JWT 토큰에 저장
      if (user) {
        const extUser = user as typeof user & {
          role?: "super_admin" | "admin";
          status?: "pending" | "active" | "rejected";
        };
        if (extUser.role) token.role = extUser.role;
        if (extUser.status) token.status = extUser.status;
      }

      // ID Token 만료 5분 전 자동 갱신
      const expiresAt = token.idTokenExpires as number | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      const fiveMinMs = 5 * 60 * 1000;

      if (expiresAt && refreshToken && Date.now() > expiresAt - fiveMinMs) {
        const refreshed = await refreshGoogleIdToken(refreshToken);
        if (refreshed.id_token && !refreshed.error) {
          token.idToken = refreshed.id_token;
          // expires_in은 초 단위
          token.idTokenExpires =
            Date.now() + (refreshed.expires_in ?? 3600) * 1000;
        }
        // 갱신 실패 시 기존 토큰 유지 (만료되면 NestJS에서 401 반환)
      }

      return token;
    },

    async session({ session, token }) {
      // JWT 토큰의 sub·role·status를 session.user로 노출
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role;
        if (token.status) session.user.status = token.status;
      }
      // Google ID Token을 세션에 노출 — BFF 프록시가 Bearer로 사용
      if (token.idToken) session.idToken = token.idToken as string;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // callbackUrl 검증 — Open Redirect 방지
      const parsedUrl = url.startsWith(baseUrl)
        ? url.slice(baseUrl.length)
        : url;
      const safe = getCallbackUrl(parsedUrl);
      return `${baseUrl}${safe}`;
    },
  },
  session: { strategy: "jwt" },
});
