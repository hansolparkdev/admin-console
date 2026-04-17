import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/menus/queries", () => ({
  useMenus: vi.fn(),
}));
vi.mock("@/features/roles/queries", () => ({
  useSetRoleMenuPermissions: vi.fn(),
}));

import { useMenus } from "@/features/menus/queries";
import { useSetRoleMenuPermissions } from "@/features/roles/queries";
import { RolePermissionMatrix } from "@/features/roles/components/RolePermissionMatrix";
import type { MenuNode } from "@/features/menus/types";
import type { RoleMenuPermission } from "@/features/roles/types";

const makeMenu = (overrides: Partial<MenuNode> = {}): MenuNode => ({
  id: "menu-1",
  name: "대시보드",
  path: "/dashboard",
  icon: null,
  order: 1,
  isActive: true,
  parentId: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  children: [],
  ...overrides,
});

const mockSaveMutation = { mutate: vi.fn(), isPending: false };

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

describe("RolePermissionMatrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSetRoleMenuPermissions).mockReturnValue(
      mockSaveMutation as ReturnType<typeof useSetRoleMenuPermissions>,
    );
  });

  it("로딩 중 스켈레톤을 표시한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useMenus>);
    render(<RolePermissionMatrix roleId="role-1" initialPermissions={[]} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByTestId("permission-matrix-loading")).toBeInTheDocument();
  });

  it("메뉴별 canRead/canWrite/canDelete 체크박스를 렌더링한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeMenu()],
    } as ReturnType<typeof useMenus>);

    render(<RolePermissionMatrix roleId="role-1" initialPermissions={[]} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("대시보드")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3); // canRead, canWrite, canDelete
  });

  it("initialPermissions 값으로 체크박스 초기값이 설정된다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeMenu()],
    } as ReturnType<typeof useMenus>);

    const initialPermissions: RoleMenuPermission[] = [
      { menuId: "menu-1", canRead: true, canWrite: false, canDelete: false },
    ];

    render(
      <RolePermissionMatrix
        roleId="role-1"
        initialPermissions={initialPermissions}
      />,
      { wrapper: createWrapper() },
    );

    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    // canRead is checked, canWrite and canDelete are not
    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[1]?.checked).toBe(false);
    expect(checkboxes[2]?.checked).toBe(false);
  });

  it("저장 버튼 클릭 시 setRoleMenuPermissions를 호출한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [makeMenu()],
    } as ReturnType<typeof useMenus>);

    render(<RolePermissionMatrix roleId="role-1" initialPermissions={[]} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    expect(mockSaveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ roleId: "role-1" }),
    );
  });

  it("에러 상태에서 에러 메시지를 표시한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useMenus>);
    render(<RolePermissionMatrix roleId="role-1" initialPermissions={[]} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/메뉴를 불러올 수 없습니다/)).toBeInTheDocument();
  });

  it("메뉴가 없을 경우 안내 메시지를 표시한다", () => {
    vi.mocked(useMenus).mockReturnValue({
      isPending: false,
      isError: false,
      data: [],
    } as ReturnType<typeof useMenus>);
    render(<RolePermissionMatrix roleId="role-1" initialPermissions={[]} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText(/등록된 메뉴가 없습니다/)).toBeInTheDocument();
  });
});
