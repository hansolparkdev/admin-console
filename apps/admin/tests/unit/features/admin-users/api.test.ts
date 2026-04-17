import { describe, it, expect, vi, beforeEach } from "vitest";

// apiFetch 모킹
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";
import {
  fetchAdminUsers,
  fetchAdminUser,
  approveAdminUser,
  rejectAdminUser,
  restoreAdminUser,
} from "@/features/admin-users/api";
import type { AdminUser } from "@/features/admin-users/types";

const makeUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: "user-1",
  email: "admin@example.com",
  name: "Admin User",
  picture: null,
  provider: "google",
  status: "pending",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("admin-users/api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAdminUsers", () => {
    it("status 없이 전체 목록을 요청한다", async () => {
      const users = [makeUser()];
      vi.mocked(apiFetch).mockResolvedValue(users);

      const result = await fetchAdminUsers();

      // page=1&limit=10이 기본값으로 포함됨
      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users"),
      );
      expect(result).toEqual(users);
    });

    it("status 필터가 있으면 쿼리 파라미터를 포함한다", async () => {
      const users = [makeUser({ status: "pending" })];
      vi.mocked(apiFetch).mockResolvedValue(users);

      const result = await fetchAdminUsers("pending");

      expect(apiFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=pending"),
      );
      expect(result).toEqual(users);
    });
  });

  describe("fetchAdminUser", () => {
    it("단건 사용자를 요청한다", async () => {
      const user = makeUser();
      vi.mocked(apiFetch).mockResolvedValue(user);

      const result = await fetchAdminUser("user-1");

      expect(apiFetch).toHaveBeenCalledWith("/admin/users/user-1");
      expect(result).toEqual(user);
    });
  });

  describe("approveAdminUser", () => {
    it("PATCH /admin/users/:id/approve를 호출한다", async () => {
      const user = makeUser({ status: "active" });
      vi.mocked(apiFetch).mockResolvedValue(user);

      const result = await approveAdminUser("user-1");

      expect(apiFetch).toHaveBeenCalledWith("/admin/users/user-1/approve", {
        method: "PATCH",
      });
      expect(result.status).toBe("active");
    });
  });

  describe("rejectAdminUser", () => {
    it("PATCH /admin/users/:id/reject를 호출한다", async () => {
      const user = makeUser({ status: "rejected" });
      vi.mocked(apiFetch).mockResolvedValue(user);

      const result = await rejectAdminUser("user-1");

      expect(apiFetch).toHaveBeenCalledWith("/admin/users/user-1/reject", {
        method: "PATCH",
      });
      expect(result.status).toBe("rejected");
    });
  });

  describe("restoreAdminUser", () => {
    it("PATCH /admin/users/:id/restore를 targetStatus pending으로 호출한다", async () => {
      const user = makeUser({ status: "pending" });
      vi.mocked(apiFetch).mockResolvedValue(user);

      const result = await restoreAdminUser("user-1", "pending");

      expect(apiFetch).toHaveBeenCalledWith("/admin/users/user-1/restore", {
        method: "PATCH",
        body: { targetStatus: "pending" },
      });
      expect(result.status).toBe("pending");
    });

    it("PATCH /admin/users/:id/restore를 targetStatus active로 호출한다", async () => {
      const user = makeUser({ status: "active" });
      vi.mocked(apiFetch).mockResolvedValue(user);

      const result = await restoreAdminUser("user-1", "active");

      expect(apiFetch).toHaveBeenCalledWith("/admin/users/user-1/restore", {
        method: "PATCH",
        body: { targetStatus: "active" },
      });
      expect(result.status).toBe("active");
    });
  });
});
