import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/menus/queries", () => ({
  useCreateMenu: vi.fn(),
  useUpdateMenu: vi.fn(),
  menuKeys: {
    all: ["menus"] as const,
    lists: () => ["menus", "list"] as const,
  },
}));

import { useCreateMenu, useUpdateMenu } from "@/features/menus/queries";
import { MenuFormDialog } from "@/features/menus/components/MenuFormDialog";
import type { MenuNode } from "@/features/menus/types";

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
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
};

describe("MenuFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateMenu).mockReturnValue(
      mockMutation as ReturnType<typeof useCreateMenu>,
    );
    vi.mocked(useUpdateMenu).mockReturnValue(
      mockMutation as ReturnType<typeof useUpdateMenu>,
    );
  });

  it("열림 상태에서 메뉴 이름 필드를 렌더링한다", () => {
    render(<MenuFormDialog open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
  });

  it("이름 필드가 비어 있을 때 에러 메시지를 표시한다", async () => {
    const user = userEvent.setup();
    render(<MenuFormDialog open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button", { name: /저장/ }));
    expect(await screen.findByText(/이름은 필수입니다/)).toBeInTheDocument();
    expect(mockMutation.mutate).not.toHaveBeenCalled();
  });

  it("이름을 입력하고 저장하면 createMenu를 호출한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockMutation.mutate.mockImplementation(
      (_data: unknown, opts?: { onSuccess?: () => void }) => {
        opts?.onSuccess?.();
      },
    );

    render(<MenuFormDialog open={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText(/이름/), "새 메뉴");
    await user.click(screen.getByRole("button", { name: /저장/ }));

    expect(mockMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "새 메뉴" }),
      expect.anything(),
    );
  });

  it("수정 모드: 초기값이 채워진다", () => {
    const existingMenu: MenuNode = {
      id: "menu-1",
      name: "기존 메뉴",
      path: "/existing",
      icon: null,
      order: 0,
      isActive: true,
      parentId: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      children: [],
    };

    render(
      <MenuFormDialog open={true} onClose={vi.fn()} menu={existingMenu} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByDisplayValue("기존 메뉴")).toBeInTheDocument();
  });
});
