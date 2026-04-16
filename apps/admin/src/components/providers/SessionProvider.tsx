"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Auth.js v5 SessionProvider 래퍼.
 * RootLayout의 클라이언트 경계로 사용한다.
 * SessionProvider는 클라이언트 전용이므로 "use client" 지시문이 필요.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
