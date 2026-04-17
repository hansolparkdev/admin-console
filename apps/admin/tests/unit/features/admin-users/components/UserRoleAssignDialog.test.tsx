import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/admin-users/queries", () => ({
  useAssignUserRole: vi.fn(),
}));
vi.mock("@/features/roles/queries", () => ({
  useRoles: vi.fn(),
}));

import { useAssignUserRole } from "@/features/admin-users/queries";
import { useRoles } from "@/features/roles/queries";
import { UserRoleAssignDialog } from "@/features/admin-users/components/UserRoleAssignDialog";
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

const mockAssignMutation = { mutate: vi.fn(), isPending: false };

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

describe("UserRoleAssignDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAssignUserRole).mockReturnValue(
      mockAssignMutation as ReturnType<typeof useAssignUserRole>,
    );
    vi.mocked(useRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRole()],
    } as ReturnType<typeof useRoles>);
  });

  it("open=false이면 렌더링되지 않는다", () => {
    render(
      <UserRoleAssignDialog open={false} onClose={vi.fn()} userId="user-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByText("역할 할당")).not.toBeInTheDocument();
  });

  it("open=true이면 다이얼로그 타이틀을 표시한다", () => {
    render(
      <UserRoleAssignDialog open={true} onClose={vi.fn()} userId="user-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("역할 할당")).toBeInTheDocument();
  });

  it("취소 버튼 클릭 시 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(
      <UserRoleAssignDialog open={true} onClose={onClose} userId="user-1" />,
      { wrapper: createWrapper() },
    );
    fireEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("역할 선택 후 할당 클릭 시 assignUserRole이 호출된다", async () => {
    render(
      <UserRoleAssignDialog open={true} onClose={vi.fn()} userId="user-1" />,
      { wrapper: createWrapper() },
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "role-1" } });
    fireEvent.click(screen.getByRole("button", { name: /할당/ }));
    await waitFor(() => {
      expect(mockAssignMutation.mutate).toHaveBeenCalledWith(
        "role-1",
        expect.anything(),
      );
    });
  });

  it("역할 미선택 시 할당 버튼이 비활성화된다", () => {
    vi.mocked(useRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRole()],
    } as ReturnType<typeof useRoles>);
    render(
      <UserRoleAssignDialog open={true} onClose={vi.fn()} userId="user-1" />,
      { wrapper: createWrapper() },
    );
    // 기본 선택값이 없을 때 버튼 비활성화
    const btn = screen.getByRole("button", { name: /할당/ });
    expect(btn).toBeDisabled();
  });
});
