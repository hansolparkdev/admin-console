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
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
        };

        if (!data.allowed) {
          // Auth.js는 false 반환 시 /login?error=<reason> 으로 redirect한다.
          return `/login?error=${data.reason ?? "unauthorized_domain"}`;
        }

        return true;
      } catch {
        return "/login?error=Configuration";
      }
    },

    async session({ session, token }) {
      // JWT 토큰의 sub를 session.user.id로 노출
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
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
