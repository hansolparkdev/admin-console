/**
 * auth 도메인 Query Key Factory + hooks.
 * 문자열 리터럴 queryKey 금지 패턴(forbidden-patterns.md §2.1) 준수.
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MeResponse } from "./types";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * GET /auth/me — 세션 사용자 정보 + roles + menus 트리.
 * Server Component에서 prefetch → HydrationBoundary → 클라이언트 useQuery로 재사용.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
    staleTime: 5 * 60 * 1000, // 5분
  });
}
