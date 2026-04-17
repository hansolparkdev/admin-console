import { apiFetch } from "@/lib/api";
import type { MenuNode, CreateMenuInput, UpdateMenuInput } from "./types";

/**
 * 메뉴 트리 전체 조회.
 */
export async function fetchMenus(): Promise<MenuNode[]> {
  return apiFetch<MenuNode[]>("/menus");
}

/**
 * 메뉴 생성.
 */
export async function createMenu(input: CreateMenuInput): Promise<MenuNode> {
  return apiFetch<MenuNode>("/menus", { method: "POST", body: input });
}

/**
 * 메뉴 수정.
 */
export async function updateMenu(
  id: string,
  input: UpdateMenuInput,
): Promise<MenuNode> {
  return apiFetch<MenuNode>(`/menus/${id}`, { method: "PATCH", body: input });
}

/**
 * 메뉴 삭제.
 */
export async function deleteMenu(id: string): Promise<void> {
  return apiFetch<void>(`/menus/${id}`, { method: "DELETE" });
}

/**
 * 메뉴 순서 변경.
 */
export async function reorderMenu(
  id: string,
  direction: "up" | "down",
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/menus/${id}/order`, {
    method: "PATCH",
    body: { direction },
  });
}
