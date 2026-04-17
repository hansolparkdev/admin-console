import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// api 모킹
vi.mock("@/features/admin-users/api", () => ({
  fetchAdminUsers: vi.fn(),
  fetchAdminUser: vi.fn(),
  approveAdminUser: vi.fn(),
  rejectAdminUser: vi.fn(),
  restoreAdminUser: vi.fn(),
}));

import {
  fetchAdminUsers,
  fetchAdminUser,
  approveAdminUser,
  rejectAdminUser,
  restoreAdminUser,
} from "@/features/admin-users/api";

import {
  adminUserKeys,
  useAdminUsers,
  useAdminUser,
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "@/features/admin-users/queries";
import type { AdminUser } from "@/features/admin-users/types";

const makeUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: "user-1",
  email: "admin@example.com",
  name: "Admin User",
  picture: null,
  provider: "google",
  status: "pending",
  role: "admin",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
};

describe("admin-users/queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Query Key Factory ──────────────────────────────────────────────────────
  describe("adminUserKeys", () => {
    it("all 키는 ['admin-users']", () => {
      expect(adminUserKeys.all).toEqual(["admin-users"]);
    });

    it("lists() 키는 ['admin-users', 'list']", () => {
      expect(adminUserKeys.lists()).toEqual(["admin-users", "list"]);
    });

    it("list(undefined)는 status와 page를 포함한다", () => {
      const key = adminUserKeys.list(undefined, 1);
      expect(key[0]).toBe("admin-users");
      expect(key[1]).toBe("list");
    });

    it("list('pending')는 status를 포함한다", () => {
      const key = adminUserKeys.list("pending", 1);
      expect(key).toContain("pending");
    });

    it("detail('user-1')는 ['admin-users', 'detail', 'user-1']", () => {
      expect(adminUserKeys.detail("user-1")).toEqual([
        "admin-users",
        "detail",
        "user-1",
      ]);
    });
  });

  // ─── useAdminUsers ──────────────────────────────────────────────────────────
  describe("useAdminUsers", () => {
    it("관리자 목록을 성공적으로 가져온다", async () => {
      const users = [makeUser()];
      vi.mocked(fetchAdminUsers).mockResolvedValue(users);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdminUsers(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(users);
      expect(fetchAdminUsers).toHaveBeenCalledWith(undefined, 1);
    });

    it("status 필터를 전달한다", async () => {
      vi.mocked(fetchAdminUsers).mockResolvedValue([]);
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdminUsers("pending"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(fetchAdminUsers).toHaveBeenCalledWith("pending", 1);
    });
  });

  // ─── useAdminUser ───────────────────────────────────────────────────────────
  describe("useAdminUser", () => {
    it("관리자 단건을 성공적으로 가져온다", async () => {
      const user = makeUser();
      vi.mocked(fetchAdminUser).mockResolvedValue(user);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useAdminUser("user-1"), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(user);
    });
  });

  // ─── mutations ──────────────────────────────────────────────────────────────
  describe("useApproveAdminUser", () => {
    it("approve mutation을 호출한다", async () => {
      const user = makeUser({ status: "active" });
      vi.mocked(approveAdminUser).mockResolvedValue(user);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useApproveAdminUser(), { wrapper });

      result.current.mutate("user-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(approveAdminUser).toHaveBeenCalledWith("user-1");
    });
  });

  describe("useRejectAdminUser", () => {
    it("reject mutation을 호출한다", async () => {
      const user = makeUser({ status: "rejected" });
      vi.mocked(rejectAdminUser).mockResolvedValue(user);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useRejectAdminUser(), { wrapper });

      result.current.mutate("user-1");
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(rejectAdminUser).toHaveBeenCalledWith("user-1");
    });
  });

  describe("useRestoreAdminUser", () => {
    it("restore mutation을 pending으로 호출한다", async () => {
      const user = makeUser({ status: "pending" });
      vi.mocked(restoreAdminUser).mockResolvedValue(user);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useRestoreAdminUser(), { wrapper });

      result.current.mutate({ id: "user-1", targetStatus: "pending" });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(restoreAdminUser).toHaveBeenCalledWith("user-1", "pending");
    });
  });
});
