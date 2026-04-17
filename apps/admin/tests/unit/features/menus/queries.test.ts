import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/menus/api", () => ({
  fetchMenus: vi.fn(),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
  reorderMenu: vi.fn(),
}));

import {
  fetchMenus,
  createMenu,
  updateMenu,
  deleteMenu,
} from "@/features/menus/api";
import {
  menuKeys,
  useMenus,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
} from "@/features/menus/queries";
import type { MenuNode } from "@/features/menus/types";

const makeMenu = (overrides: Partial<MenuNode> = {}): MenuNode => ({
  id: "menu-1",
  name: "대시보드",
  path: "/dashboard",
  icon: null,
  order: 0,
  isActive: true,
  parentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  children: [],
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }
  return Wrapper;
};

describe("menus/queries", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("menuKeys", () => {
    it("all 키는 ['menus']", () => {
      expect(menuKeys.all).toEqual(["menus"]);
    });

    it("lists() 키는 배열이다", () => {
      expect(Array.isArray(menuKeys.lists())).toBe(true);
    });
  });

  describe("useMenus", () => {
    it("메뉴 목록을 가져온다", async () => {
      const menus = [makeMenu()];
      vi.mocked(fetchMenus).mockResolvedValue(menus);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMenus(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(menus);
    });
  });

  describe("useCreateMenu", () => {
    it("메뉴를 생성하고 캐시를 무효화한다", async () => {
      const newMenu = makeMenu({ id: "menu-new", name: "신규 메뉴" });
      vi.mocked(createMenu).mockResolvedValue(newMenu);
      vi.mocked(fetchMenus).mockResolvedValue([newMenu]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateMenu(), { wrapper });

      result.current.mutate({ name: "신규 메뉴" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(createMenu).toHaveBeenCalledWith({ name: "신규 메뉴" });
    });
  });

  describe("useUpdateMenu", () => {
    it("메뉴를 수정한다", async () => {
      const updated = makeMenu({ name: "수정됨" });
      vi.mocked(updateMenu).mockResolvedValue(updated);
      vi.mocked(fetchMenus).mockResolvedValue([updated]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateMenu(), { wrapper });

      result.current.mutate({ id: "menu-1", input: { name: "수정됨" } });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(updateMenu).toHaveBeenCalledWith("menu-1", { name: "수정됨" });
    });
  });

  describe("useDeleteMenu", () => {
    it("메뉴를 삭제한다", async () => {
      vi.mocked(deleteMenu).mockResolvedValue(undefined);
      vi.mocked(fetchMenus).mockResolvedValue([]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteMenu(), { wrapper });

      result.current.mutate("menu-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(deleteMenu).toHaveBeenCalledWith("menu-1");
    });
  });
});
