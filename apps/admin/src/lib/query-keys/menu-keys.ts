/**
 * menus 도메인 Query Key Factory.
 * forbidden-patterns.md §2.1: 문자열 리터럴 Query Key 금지.
 */
export const menuKeys = {
  all: ["menus"] as const,
  lists: () => [...menuKeys.all, "list"] as const,
  detail: (id: string) => [...menuKeys.all, "detail", id] as const,
};
