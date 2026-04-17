import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/roles/queries", () => ({
  useCreateRole: vi.fn(),
  useUpdateRole: vi.fn(),
}));

import { useCreateRole, useUpdateRole } from "@/features/roles/queries";
import { RoleFormDialog } from "@/features/roles/components/RoleFormDialog";
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

const mockCreateMutation = { mutate: vi.fn(), isPending: false };
const mockUpdateMutation = { mutate: vi.fn(), isPending: false };

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

describe("RoleFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateRole).mockReturnValue(
      mockCreateMutation as ReturnType<typeof useCreateRole>,
    );
    vi.mocked(useUpdateRole).mockReturnValue(
      mockUpdateMutation as ReturnType<typeof useUpdateRole>,
    );
  });

  it("신규 생성 모드: 다이얼로그 타이틀이 '역할 추가'이다", () => {
    render(<RoleFormDialog open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("역할 추가")).toBeInTheDocument();
  });

  it("수정 모드: 다이얼로그 타이틀이 '역할 수정'이고 기존값이 채워진다", () => {
    render(<RoleFormDialog open={true} onClose={vi.fn()} role={makeRole()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("역할 수정")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ADMIN")).toBeInTheDocument();
    expect(screen.getByDisplayValue("일반 관리자")).toBeInTheDocument();
  });

  it("닫기 버튼 클릭 시 onClose가 호출된다", () => {
    const onClose = vi.fn();
    render(<RoleFormDialog open={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /취소/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("역할명이 비어있으면 submit이 막힌다", async () => {
    render(<RoleFormDialog open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    await waitFor(() => {
      expect(mockCreateMutation.mutate).not.toHaveBeenCalled();
    });
  });

  it("신규 생성: 저장 클릭 시 createRole이 호출된다", async () => {
    render(<RoleFormDialog open={true} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    fireEvent.change(screen.getByPlaceholderText(/역할명/), {
      target: { value: "NEW_ROLE" },
    });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    await waitFor(() => {
      expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "NEW_ROLE" }),
        expect.anything(),
      );
    });
  });

  it("수정 모드: 저장 클릭 시 updateRole이 호출된다", async () => {
    render(<RoleFormDialog open={true} onClose={vi.fn()} role={makeRole()} />, {
      wrapper: createWrapper(),
    });
    fireEvent.change(screen.getByDisplayValue("ADMIN"), {
      target: { value: "ADMIN_V2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    await waitFor(() => {
      expect(mockUpdateMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "role-1",
          input: expect.objectContaining({ name: "ADMIN_V2" }),
        }),
        expect.anything(),
      );
    });
  });

  it("open=false 이면 렌더링되지 않는다", () => {
    render(<RoleFormDialog open={false} onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.queryByText("역할 추가")).not.toBeInTheDocument();
  });
});
