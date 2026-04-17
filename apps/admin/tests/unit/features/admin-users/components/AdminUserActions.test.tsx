import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// mutations 모킹
vi.mock("@/features/admin-users/queries", () => ({
  useApproveAdminUser: vi.fn(),
  useRejectAdminUser: vi.fn(),
  useRestoreAdminUser: vi.fn(),
}));

import {
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "@/features/admin-users/queries";
import { AdminUserActions } from "@/features/admin-users/components/AdminUserActions";
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

const mockMutate = vi.fn();
const mockMutation = { mutate: mockMutate, isPending: false };

function createWrapper() {
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
}

describe("AdminUserActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApproveAdminUser).mockReturnValue(
      mockMutation as ReturnType<typeof useApproveAdminUser>,
    );
    vi.mocked(useRejectAdminUser).mockReturnValue(
      mockMutation as ReturnType<typeof useRejectAdminUser>,
    );
    vi.mocked(useRestoreAdminUser).mockReturnValue(
      mockMutation as ReturnType<typeof useRestoreAdminUser>,
    );
  });

  describe("pending 상태", () => {
    it("승인 버튼과 거절 버튼을 표시한다", () => {
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByRole("button", { name: /승인/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /거절/ })).toBeInTheDocument();
    });

    it("복구 버튼은 표시하지 않는다", () => {
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.queryByRole("button", { name: /복구/ }),
      ).not.toBeInTheDocument();
    });

    it("승인 버튼 클릭 시 approve mutation을 호출한다", async () => {
      const user = userEvent.setup();
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole("button", { name: /승인/ }));
      expect(mockMutate).toHaveBeenCalledWith("user-1");
    });

    it("거절 버튼 클릭 시 reject mutation을 호출한다", async () => {
      const user = userEvent.setup();
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole("button", { name: /거절/ }));
      expect(mockMutate).toHaveBeenCalledWith("user-1");
    });

    it("승인 버튼 — bg-[#2e7d32] text-white 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });
      const approveBtn = screen.getByRole("button", { name: "승인" });
      expect(approveBtn).toHaveClass("bg-[#2e7d32]");
      expect(approveBtn).toHaveClass("text-white");
    });

    it("거절 버튼(pending) — bg-error text-white 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });
      const rejectBtn = screen.getByRole("button", { name: "거절" });
      expect(rejectBtn).toHaveClass("bg-error");
      expect(rejectBtn).toHaveClass("text-white");
    });

    it("공통 — px-4 py-1.5 text-xs font-bold rounded-lg 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "pending" })} />, {
        wrapper: createWrapper(),
      });
      const approveBtn = screen.getByRole("button", { name: "승인" });
      expect(approveBtn).toHaveClass("px-4");
      expect(approveBtn).toHaveClass("font-bold");
      expect(approveBtn).toHaveClass("rounded-lg");
    });
  });

  describe("active 상태", () => {
    it("거절 버튼만 표시한다", () => {
      render(<AdminUserActions user={makeUser({ status: "active" })} />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.queryByRole("button", { name: /승인/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /거절/ })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /복구/ }),
      ).not.toBeInTheDocument();
    });

    it("거절 버튼(active) — border border-error text-error 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "active" })} />, {
        wrapper: createWrapper(),
      });
      const rejectBtn = screen.getByRole("button", { name: "거절" });
      expect(rejectBtn).toHaveClass("border-error");
      expect(rejectBtn).toHaveClass("text-error");
    });
  });

  describe("rejected 상태", () => {
    it("복구(pending) 버튼과 복구(active) 버튼을 표시한다", () => {
      render(<AdminUserActions user={makeUser({ status: "rejected" })} />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.queryByRole("button", { name: /승인$/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /거절$/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /대기로 복구/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /승인으로 복구/ }),
      ).toBeInTheDocument();
    });

    it("'대기로 복구' 버튼 클릭 시 restore pending mutation을 호출한다", async () => {
      const user = userEvent.setup();
      render(<AdminUserActions user={makeUser({ status: "rejected" })} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole("button", { name: /대기로 복구/ }));
      expect(mockMutate).toHaveBeenCalledWith({
        id: "user-1",
        targetStatus: "pending",
      });
    });

    it("'승인으로 복구' 버튼 클릭 시 restore active mutation을 호출한다", async () => {
      const user = userEvent.setup();
      render(<AdminUserActions user={makeUser({ status: "rejected" })} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole("button", { name: /승인으로 복구/ }));
      expect(mockMutate).toHaveBeenCalledWith({
        id: "user-1",
        targetStatus: "active",
      });
    });

    it("대기로 복구 버튼 — border border-on-surface-variant text-on-surface-variant 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "rejected" })} />, {
        wrapper: createWrapper(),
      });
      const pendingBtn = screen.getByRole("button", { name: /대기로 복구/ });
      expect(pendingBtn).toHaveClass("border-on-surface-variant");
      expect(pendingBtn).toHaveClass("text-on-surface-variant");
    });

    it("승인으로 복구 버튼 — bg-[#2e7d32] text-white 클래스를 가진다", () => {
      render(<AdminUserActions user={makeUser({ status: "rejected" })} />, {
        wrapper: createWrapper(),
      });
      const activeBtn = screen.getByRole("button", { name: /승인으로 복구/ });
      expect(activeBtn).toHaveClass("bg-[#2e7d32]");
      expect(activeBtn).toHaveClass("text-white");
    });
  });
});
