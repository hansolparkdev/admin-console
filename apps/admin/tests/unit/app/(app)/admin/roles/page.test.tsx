import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api-server", () => ({
  apiServerFetch: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/roles/queries", () => ({
  useRoles: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
  useCreateRole: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUpdateRole: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteRole: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  roleKeys: {
    all: ["roles"] as const,
    lists: () => ["roles", "list"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
}));

vi.mock("@/lib/get-query-client", () => ({
  getQueryClient: vi.fn(() => new QueryClient()),
}));

import RolesPage from "@/app/(app)/admin/roles/page";

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

describe("RolesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("역할 관리 페이지 제목을 표시한다", async () => {
    render(await RolesPage(), { wrapper: createWrapper() });
    expect(
      screen.getByRole("heading", { name: /역할 관리/ }),
    ).toBeInTheDocument();
  });

  it("역할 추가 버튼을 표시한다", async () => {
    render(await RolesPage(), { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /역할 추가/ }),
    ).toBeInTheDocument();
  });

  it("빈 역할 목록 안내를 표시한다", async () => {
    render(await RolesPage(), { wrapper: createWrapper() });
    expect(screen.getByText(/등록된 역할이 없습니다/)).toBeInTheDocument();
  });
});
