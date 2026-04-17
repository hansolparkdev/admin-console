import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/roles/api", () => ({
  fetchRoles: vi.fn(),
  fetchRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  setRoleMenuPermissions: vi.fn(),
}));

import {
  fetchRoles,
  createRole,
  deleteRole,
  setRoleMenuPermissions,
} from "@/features/roles/api";
import {
  roleKeys,
  useRoles,
  useCreateRole,
  useDeleteRole,
  useSetRoleMenuPermissions,
} from "@/features/roles/queries";
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

describe("roles/queries", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("roleKeys", () => {
    it("all 키는 ['roles']", () => {
      expect(roleKeys.all).toEqual(["roles"]);
    });
  });

  describe("useRoles", () => {
    it("역할 목록을 가져온다", async () => {
      const roles = [makeRole()];
      vi.mocked(fetchRoles).mockResolvedValue(roles);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRoles(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(roles);
    });
  });

  describe("useCreateRole", () => {
    it("역할을 생성한다", async () => {
      const newRole = makeRole({ id: "role-new" });
      vi.mocked(createRole).mockResolvedValue(newRole);
      vi.mocked(fetchRoles).mockResolvedValue([newRole]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateRole(), { wrapper });

      result.current.mutate({ name: "NEW_ROLE" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(createRole).toHaveBeenCalledWith({ name: "NEW_ROLE" });
    });
  });

  describe("useDeleteRole", () => {
    it("역할을 삭제한다", async () => {
      vi.mocked(deleteRole).mockResolvedValue(undefined);
      vi.mocked(fetchRoles).mockResolvedValue([]);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteRole(), { wrapper });

      result.current.mutate("role-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(deleteRole).toHaveBeenCalledWith("role-1");
    });
  });

  describe("useSetRoleMenuPermissions", () => {
    it("메뉴 권한을 저장한다", async () => {
      vi.mocked(setRoleMenuPermissions).mockResolvedValue({ success: true });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useSetRoleMenuPermissions(), {
        wrapper,
      });

      result.current.mutate({
        roleId: "role-1",
        permissions: [
          {
            menuId: "menu-1",
            canRead: true,
            canWrite: false,
            canDelete: false,
          },
        ],
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
