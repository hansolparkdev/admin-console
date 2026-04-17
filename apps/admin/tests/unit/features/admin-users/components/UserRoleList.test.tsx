import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/admin-users/queries", () => ({
  useUserRoles: vi.fn(),
  useRemoveUserRole: vi.fn(),
}));

import {
  useUserRoles,
  useRemoveUserRole,
} from "@/features/admin-users/queries";
import { UserRoleList } from "@/features/admin-users/components/UserRoleList";

interface UserRole {
  roleId: string;
  roleName: string;
  isSystem: boolean;
  assignedAt: string;
}

const makeUserRole = (overrides: Partial<UserRole> = {}): UserRole => ({
  roleId: "role-1",
  roleName: "ADMIN",
  isSystem: false,
  assignedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const mockRemoveMutation = { mutate: vi.fn(), isPending: false };

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

describe("UserRoleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRemoveUserRole).mockReturnValue(
      mockRemoveMutation as ReturnType<typeof useRemoveUserRole>,
    );
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    expect(screen.getByTestId("user-role-list-loading")).toBeInTheDocument();
  });

  it("역할 목록을 렌더링한다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeUserRole()],
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("할당된 역할이 없으면 안내 메시지를 표시한다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    expect(screen.getByText(/할당된 역할이 없습니다/)).toBeInTheDocument();
  });

  it("에러 상태에서 에러 메시지를 표시한다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    expect(screen.getByText(/역할을 불러올 수 없습니다/)).toBeInTheDocument();
  });

  it("제거 버튼 클릭 시 removeUserRole이 호출된다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeUserRole()],
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /제거/ }));
    expect(mockRemoveMutation.mutate).toHaveBeenCalledWith("role-1");
  });

  it("시스템 역할은 제거 버튼이 비활성화된다", () => {
    vi.mocked(useUserRoles).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeUserRole({ isSystem: true, roleName: "SUPER_ADMIN" })],
    } as ReturnType<typeof useUserRoles>);
    render(<UserRoleList userId="user-1" />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /제거/ })).toBeDisabled();
  });
});
