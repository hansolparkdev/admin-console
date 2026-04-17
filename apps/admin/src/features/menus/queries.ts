/**
 * menus 도메인 Query Key Factory + hooks.
 * 문자열 리터럴 queryKey 금지 패턴(forbidden-patterns.md §2.1) 준수.
 * 낙관적 업데이트는 queryClient.setQueryData 사용(§2.2).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  reorderMenu,
} from "./api";
import type { CreateMenuInput, UpdateMenuInput, MenuNode } from "./types";
import { menuKeys } from "@/lib/query-keys/menu-keys";

export { menuKeys };

export function useMenus() {
  return useQuery({
    queryKey: menuKeys.lists(),
    queryFn: fetchMenus,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMenuInput) => createMenu(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuInput }) =>
      updateMenu(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<MenuNode[]>(menuKeys.lists(), (old) =>
        old ? updateMenuInTree(old, updated) : old,
      );
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenu(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useReorderMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) =>
      reorderMenu(id, direction),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

// 트리 내에서 특정 메뉴를 업데이트
function updateMenuInTree(menus: MenuNode[], updated: MenuNode): MenuNode[] {
  return menus.map((m) => {
    if (m.id === updated.id) return updated;
    if (m.children.length > 0) {
      return { ...m, children: updateMenuInTree(m.children, updated) };
    }
    return m;
  });
}
