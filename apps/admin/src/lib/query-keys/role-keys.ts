/**
 * roles 도메인 Query Key Factory.
 * forbidden-patterns.md §2.1: 문자열 리터럴 Query Key 금지.
 */
export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
  users: (id: string) => [...roleKeys.all, "detail", id, "users"] as const,
};
