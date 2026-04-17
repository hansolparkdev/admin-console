import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/roles/queries", () => ({
  useRoleUsers: vi.fn(),
  useRemoveRoleUser: vi.fn(),
}));

import { useRoleUsers, useRemoveRoleUser } from "@/features/roles/queries";
import { RoleUserList } from "@/features/roles/components/RoleUserList";
import type { RoleUser } from "@/features/roles/types";

const makeRoleUser = (overrides: Partial<RoleUser> = {}): RoleUser => ({
  id: "user-1",
  email: "admin@test.com",
  name: "홍길동",
  picture: null,
  status: "active",
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

describe("RoleUserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRemoveRoleUser).mockReturnValue(
      mockRemoveMutation as ReturnType<typeof useRemoveRoleUser>,
    );
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useRoleUsers).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useRoleUsers>);
    render(<RoleUserList roleId="role-1" isSystem={false} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByTestId("role-user-list-loading")).toBeInTheDocument();
  });

  it("사용자 목록을 렌더링한다", () => {
    vi.mocked(useRoleUsers).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRoleUser()],
    } as ReturnType<typeof useRoleUsers>);
    render(<RoleUserList roleId="role-1" isSystem={false} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
  });

  it("사용자가 없으면 안내 메시지를 표시한다", () => {
    vi.mocked(useRoleUsers).mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    } as ReturnType<typeof useRoleUsers>);
    render(<RoleUserList roleId="role-1" isSystem={false} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/할당된 사용자가 없습니다/)).toBeInTheDocument();
  });

  it("에러 상태에서 에러 메시지를 표시한다", () => {
    vi.mocked(useRoleUsers).mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useRoleUsers>);
    render(<RoleUserList roleId="role-1" isSystem={false} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/사용자를 불러올 수 없습니다/)).toBeInTheDocument();
  });

  it("제거 버튼 클릭 시 removeRoleUser가 호출된다", () => {
    vi.mocked(useRoleUsers).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeRoleUser()],
    } as ReturnType<typeof useRoleUsers>);
    render(<RoleUserList roleId="role-1" isSystem={false} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /제거/ }));
    expect(mockRemoveMutation.mutate).toHaveBeenCalledWith("user-1");
  });
});
