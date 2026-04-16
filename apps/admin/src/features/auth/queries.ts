/**
 * auth 도메인 Query Key Factory.
 * 문자열 리터럴 queryKey 금지 패턴(forbidden-patterns.md §2.1) 준수.
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};
