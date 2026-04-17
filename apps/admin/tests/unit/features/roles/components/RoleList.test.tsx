import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/roles/queries", () => ({
  useRoles: vi.fn(),
  useDeleteRole: vi.fn(),
  roleKeys: {
    all: ["roles"] as const,
    lists: () => ["roles", "list"] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
  },
}));

import { useRoles, useDeleteRole } from "@/features/roles/queries";
import { RoleList } from "@/features/roles/components/RoleList";
import type { Role } from "@/features/roles/types";

const makeRole = (overrides: Partial<Role> = {}): Role => ({
  id: "role-1",
  name: "ADMIN",
  description: "일반 관리자",
  isSystem: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const mockMutation = { mutate: vi.fn(), isPending: false };

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

describe("RoleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeleteRole).mockReturnValue(
      mockMutation as ReturnType<typeof useDeleteRole>,
    );
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useRoles).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useRoles>);

    render(<RoleList onEdit={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByTestId("role-list-loading")).toBeInTheDocument();
  });

  it("역할 목록을 렌더링한다", () => {
    vi.mocked(useRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRole()],
    } as ReturnType<typeof useRoles>);

    render(<RoleList onEdit={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("SUPER_ADMIN 행의 삭제 버튼이 비활성화된다", () => {
    vi.mocked(useRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRole({ name: "SUPER_ADMIN", isSystem: true })],
    } as ReturnType<typeof useRoles>);

    render(<RoleList onEdit={vi.fn()} />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /삭제/ });
    expect(deleteBtn).toBeDisabled();
  });
});
