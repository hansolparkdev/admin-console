import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api-server", () => ({
  apiServerFetch: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/menus/queries", () => ({
  useMenus: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
  useCreateMenu: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateMenu: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteMenu: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useReorderMenu: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
  menuKeys: {
    all: ["menus"] as const,
    lists: () => ["menus", "list"] as const,
    detail: (id: string) => ["menus", "detail", id] as const,
  },
}));

vi.mock("@/lib/get-query-client", () => ({
  getQueryClient: vi.fn(() => new QueryClient()),
}));

import MenusPage from "@/app/(app)/admin/menus/page";

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

describe("MenusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("메뉴 관리 페이지 제목을 표시한다", async () => {
    render(await MenusPage(), { wrapper: createWrapper() });
    expect(
      screen.getByRole("heading", { name: /메뉴 관리/ }),
    ).toBeInTheDocument();
  });

  it("메뉴 추가 버튼을 표시한다", async () => {
    render(await MenusPage(), { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /메뉴 추가/ }),
    ).toBeInTheDocument();
  });

  it("빈 메뉴 목록 안내를 표시한다", async () => {
    render(await MenusPage(), { wrapper: createWrapper() });
    expect(screen.getByText(/등록된 메뉴가 없습니다/)).toBeInTheDocument();
  });
});
