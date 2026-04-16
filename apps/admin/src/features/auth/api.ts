"use client";

import { signIn, signOut } from "next-auth/react";

const DEFAULT_CALLBACK_URL = "/dashboard";

/**
 * Google OIDC 로그인 플로우를 시작한다.
 * callbackUrl이 없으면 /dashboard로 이동한다.
 */
export async function startGoogleSignIn(callbackUrl?: string) {
  await signIn("google", { callbackUrl: callbackUrl ?? DEFAULT_CALLBACK_URL });
}

/**
 * 로그아웃 후 로그인 화면으로 이동한다.
 */
export async function performSignOut() {
  await signOut({ callbackUrl: "/login" });
}
