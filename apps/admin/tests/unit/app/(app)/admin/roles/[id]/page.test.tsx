import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api-server", () => ({
  apiServerFetch: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/get-query-client", () => ({
  getQueryClient: vi.fn(() => new QueryClient()),
}));

vi.mock("@/features/roles/queries", () => ({
  useRole: vi.fn().mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      id: "role-1",
      name: "ADMIN",
      description: "일반 관리자",
      isSystem: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  }),
  useRoleUsers: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
  useRemoveRoleUser: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useAddRoleUser: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useSetRoleMenuPermissions: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
  roleKeys: {
    all: ["roles"] as const,
    lists: () => ["roles", "list"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
}));

vi.mock("@/features/menus/queries", () => ({
  useMenus: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
  menuKeys: {
    all: ["menus"] as const,
    lists: () => ["menus", "list"] as const,
    detail: (id: string) => ["menus", "detail", id] as const,
  },
}));

import RoleDetailPage from "@/app/(app)/admin/roles/[id]/page";

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

describe("RoleDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("역할 상세 페이지를 렌더링한다", async () => {
    render(
      await RoleDetailPage({ params: Promise.resolve({ id: "role-1" }) }),
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("권한 매트릭스 섹션이 표시된다", async () => {
    render(
      await RoleDetailPage({ params: Promise.resolve({ id: "role-1" }) }),
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/메뉴 권한/)).toBeInTheDocument();
  });

  it("사용자 목록 섹션이 표시된다", async () => {
    render(
      await RoleDetailPage({ params: Promise.resolve({ id: "role-1" }) }),
      { wrapper: createWrapper() },
    );
    expect(
      screen.getByRole("heading", { name: /할당된 사용자/ }),
    ).toBeInTheDocument();
  });
});
