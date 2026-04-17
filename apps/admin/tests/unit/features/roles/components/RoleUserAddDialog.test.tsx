import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/roles/queries", () => ({
  useAddRoleUser: vi.fn(),
}));

import { useAddRoleUser } from "@/features/roles/queries";
import { RoleUserAddDialog } from "@/features/roles/components/RoleUserAddDialog";

const mockAddMutation = { mutate: vi.fn(), isPending: false };

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

describe("RoleUserAddDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAddRoleUser).mockReturnValue(
      mockAddMutation as ReturnType<typeof useAddRoleUser>,
    );
  });

  it("open=false이면 렌더링되지 않는다", () => {
    render(
      <RoleUserAddDialog open={false} onClose={vi.fn()} roleId="role-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByText("사용자 추가")).not.toBeInTheDocument();
  });

  it("open=true이면 다이얼로그 타이틀을 표시한다", () => {
    render(
      <RoleUserAddDialog open={true} onClose={vi.fn()} roleId="role-1" />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("사용자 추가")).toBeInTheDocument();
  });

  it("취소 버튼 클릭 시 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(
      <RoleUserAddDialog open={true} onClose={onClose} roleId="role-1" />,
      { wrapper: createWrapper() },
    );
    fireEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("userId가 비어있으면 submit이 막힌다", async () => {
    render(
      <RoleUserAddDialog open={true} onClose={vi.fn()} roleId="role-1" />,
      { wrapper: createWrapper() },
    );
    fireEvent.click(screen.getByRole("button", { name: /추가/ }));
    await waitFor(() => {
      expect(mockAddMutation.mutate).not.toHaveBeenCalled();
    });
  });

  it("userId 입력 후 추가 클릭 시 addRoleUser가 호출된다", async () => {
    render(
      <RoleUserAddDialog open={true} onClose={vi.fn()} roleId="role-1" />,
      { wrapper: createWrapper() },
    );
    fireEvent.change(screen.getByPlaceholderText(/사용자 ID/), {
      target: { value: "user-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /추가/ }));
    await waitFor(() => {
      expect(mockAddMutation.mutate).toHaveBeenCalledWith(
        "user-123",
        expect.anything(),
      );
    });
  });
});
