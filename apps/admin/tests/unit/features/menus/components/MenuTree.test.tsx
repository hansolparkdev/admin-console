import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/menus/queries", () => ({
  useMenus: vi.fn(),
  useCreateMenu: vi.fn(),
  useUpdateMenu: vi.fn(),
  useDeleteMenu: vi.fn(),
  useReorderMenu: vi.fn(),
  menuKeys: {
    all: ["menus"] as const,
    lists: () => ["menus", "list"] as const,
    detail: (id: string) => ["menus", "detail", id] as const,
  },
}));

import {
  useMenus,
  useDeleteMenu,
  useReorderMenu,
} from "@/features/menus/queries";
import { MenuTree } from "@/features/menus/components/MenuTree";
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
    defaultOptions: { queries: { retry: false } },
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

const mockMutation = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
};

describe("MenuTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeleteMenu).mockReturnValue(
      mockMutation as ReturnType<typeof useDeleteMenu>,
    );
    vi.mocked(useReorderMenu).mockReturnValue(
      mockMutation as ReturnType<typeof useReorderMenu>,
    );
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useMenus>);

    render(<MenuTree onEdit={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByTestId("menu-tree-loading")).toBeInTheDocument();
  });

  it("빈 메뉴 목록 시 안내 메시지를 표시한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    } as ReturnType<typeof useMenus>);

    render(<MenuTree onEdit={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText(/등록된 메뉴가 없습니다/)).toBeInTheDocument();
  });

  it("메뉴 목록을 렌더링한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeMenu()],
    } as ReturnType<typeof useMenus>);

    render(<MenuTree onEdit={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText("대시보드")).toBeInTheDocument();
  });

  it("최상단 메뉴의 '위로' 버튼이 비활성화된다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        makeMenu({ id: "m1" }),
        makeMenu({ id: "m2", name: "관리자 관리", order: 1 }),
      ],
    } as ReturnType<typeof useMenus>);

    render(<MenuTree onEdit={vi.fn()} />, { wrapper: createWrapper() });
    const upButtons = screen.getAllByRole("button", { name: /위로/ });
    expect(upButtons[0]).toBeDisabled();
  });

  it("비활성 메뉴는 회색으로 표시된다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeMenu({ isActive: false })],
    } as ReturnType<typeof useMenus>);

    render(<MenuTree onEdit={vi.fn()} />, { wrapper: createWrapper() });
    const menuText = screen.getByText("대시보드");
    // 비활성 메뉴는 opacity 또는 gray 스타일 적용
    const row = menuText.closest("[data-inactive='true']");
    expect(row).toBeInTheDocument();
  });
});
