import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/features/admin-users/queries", () => ({
  useAdminUser: vi.fn(),
  useApproveAdminUser: vi.fn(),
  useRejectAdminUser: vi.fn(),
  useRestoreAdminUser: vi.fn(),
  useUserRoles: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
  useRemoveUserRole: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useAssignUserRole: vi
    .fn()
    .mockReturnValue({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/roles/queries", () => ({
  useRoles: vi
    .fn()
    .mockReturnValue({ isPending: false, isError: false, data: [] }),
}));

import {
  useAdminUser,
  useApproveAdminUser,
  useRejectAdminUser,
  useRestoreAdminUser,
} from "@/features/admin-users/queries";
import { AdminUserDetailClient } from "@/features/admin-users/components/AdminUserDetailClient";
import type { AdminUser } from "@/features/admin-users/types";

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

const makeUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: "user-1",
  email: "admin@example.com",
  name: "Test Admin",
  picture: null,
  provider: "google",
  status: "pending",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

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

describe("AdminUserDetailClient", () => {
  describe("로딩/에러 상태", () => {
    it("isPending=true 이면 로딩 텍스트를 렌더링한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText(/로딩/)).toBeInTheDocument();
    });

    it("isError=true 이면 에러 메시지를 렌더링한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText(/오류/)).toBeInTheDocument();
    });
  });

  describe("페이지 헤더", () => {
    it("'관리자 상세' 제목을 렌더링한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.getByRole("heading", { name: "관리자 상세" }),
      ).toBeInTheDocument();
    });

    it("제목 — text-3xl font-extrabold tracking-tight text-on-surface 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const heading = screen.getByRole("heading", { name: "관리자 상세" });
      expect(heading).toHaveClass("text-3xl");
      expect(heading).toHaveClass("font-extrabold");
      expect(heading).toHaveClass("tracking-tight");
      expect(heading).toHaveClass("text-on-surface");
    });
  });

  describe("그리드 레이아웃", () => {
    it("12컬럼 그리드 — grid grid-cols-12 gap-8 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const grid = container.querySelector(".grid.grid-cols-12.gap-8");
      expect(grid).toBeInTheDocument();
    });

    it("유저 정보 카드 컨테이너 — col-span-12 lg:col-span-7 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const infoCard = container.querySelector(".col-span-12.lg\\:col-span-7");
      expect(infoCard).toBeInTheDocument();
    });

    it("액션 카드 컨테이너 — col-span-12 lg:col-span-5 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const actionCard = container.querySelector(
        ".col-span-12.lg\\:col-span-5",
      );
      expect(actionCard).toBeInTheDocument();
    });
  });

  describe("유저 정보 카드", () => {
    it("카드 — bg-surface-container-lowest rounded-3xl p-8 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      // col-span-12 lg:col-span-7 컨테이너 자체가 bg-surface-container-lowest rounded-3xl p-8을 가짐
      const infoCard = container.querySelector(".col-span-12.lg\\:col-span-7");
      expect(infoCard).toHaveClass("bg-surface-container-lowest");
      expect(infoCard).toHaveClass("rounded-3xl");
      expect(infoCard).toHaveClass("p-8");
    });

    it("picture 있음 — img w-16 h-16 rounded-full object-cover 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ picture: "https://example.com/pic.jpg" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const img = screen.getByRole("img");
      expect(img).toHaveClass("w-16");
      expect(img).toHaveClass("h-16");
      expect(img).toHaveClass("rounded-full");
      expect(img).toHaveClass("object-cover");
    });

    it("picture 없음 — placeholder 엘리먼트를 렌더링한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ picture: null }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      const placeholder = container.querySelector(".w-16.h-16.rounded-full");
      expect(placeholder).toBeInTheDocument();
    });

    it("상태 도트 pending — bg-amber-500 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const dot = container.querySelector(".bg-amber-500");
      expect(dot).toBeInTheDocument();
    });

    it("상태 도트 active — bg-green-500 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "active" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const dot = container.querySelector(".bg-green-500");
      expect(dot).toBeInTheDocument();
    });

    it("상태 도트 rejected — bg-red-500 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "rejected" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const dot = container.querySelector(".bg-red-500");
      expect(dot).toBeInTheDocument();
    });

    it("이름 — text-on-surface font-bold 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ name: "Test Admin" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const name = screen.getByText("Test Admin");
      expect(name).toHaveClass("text-on-surface");
      expect(name).toHaveClass("font-bold");
    });

    it("이메일 — text-sm text-on-surface-variant 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ email: "admin@example.com" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const email = screen.getByText("admin@example.com");
      expect(email).toHaveClass("text-sm");
      expect(email).toHaveClass("text-on-surface-variant");
    });

    it("상태 뱃지 pill — px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const pill = container.querySelector(
        ".bg-secondary-container.rounded-full",
      );
      expect(pill).toHaveClass("px-4");
      expect(pill).toHaveClass("py-1.5");
      expect(pill).toHaveClass("text-on-secondary-container");
    });

    it("정보 행 3종(상태/역할/등록일)이 렌더링된다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText("상태")).toBeInTheDocument();
      expect(screen.getByText("역할")).toBeInTheDocument();
      expect(screen.getByText("등록일")).toBeInTheDocument();
    });

    it("정보 행 — flex items-center justify-between 레이아웃을 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const statusLabel = screen.getByText("상태");
      const statusRow = statusLabel.closest(
        ".flex.items-center.justify-between",
      );
      expect(statusRow).toBeInTheDocument();
    });

    it("상태 행 — border-b border-surface-container 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser(),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const statusLabel = screen.getByText("상태");
      const statusRow = statusLabel.closest(".border-b");
      expect(statusRow).toHaveClass("border-surface-container");
    });
  });

  describe("액션 카드", () => {
    it("카드 헤더 '관리 액션'이 렌더링된다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText("관리 액션")).toBeInTheDocument();
    });

    it("카드 — bg-surface-container-lowest rounded-3xl p-8 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      const { container } = render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const actionCard = container.querySelector(
        ".col-span-12.lg\\:col-span-5",
      );
      const card = actionCard?.querySelector(".rounded-3xl");
      expect(card).toHaveClass("bg-surface-container-lowest");
      expect(card).toHaveClass("p-8");
    });

    it("pending — 승인 버튼(gradient)과 거절 버튼(outline) 둘 다 표시한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByRole("button", { name: /승인/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /거절/ })).toBeInTheDocument();
    });

    it("pending 승인 버튼 — bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const approveBtn = screen.getByRole("button", { name: "승인" });
      expect(approveBtn).toHaveClass("bg-gradient-to-br");
      expect(approveBtn).toHaveClass("from-[#22c55e]");
      expect(approveBtn).toHaveClass("to-[#16a34a]");
      expect(approveBtn).toHaveClass("text-white");
    });

    it("pending 거절 버튼 — border-2 border-error text-error 클래스를 가진다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      const rejectBtn = screen.getByRole("button", { name: "거절" });
      expect(rejectBtn).toHaveClass("border-2");
      expect(rejectBtn).toHaveClass("border-error");
      expect(rejectBtn).toHaveClass("text-error");
    });

    it("active — 거절 버튼만 표시한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "active" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.queryByRole("button", { name: /승인$/ }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /거절/ })).toBeInTheDocument();
    });

    it("rejected — 대기로 복구 + 승인으로 복구 버튼을 표시한다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "rejected" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(
        screen.getByRole("button", { name: /대기로 복구/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /승인으로 복구/ }),
      ).toBeInTheDocument();
    });

    it("보안 지침 카드 — '보안 지침' 텍스트가 렌더링된다", () => {
      vi.mocked(useAdminUser).mockReturnValue({
        data: makeUser({ status: "pending" }),
        isPending: false,
        isError: false,
      } as ReturnType<typeof useAdminUser>);

      render(<AdminUserDetailClient id="user-1" />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText("보안 지침")).toBeInTheDocument();
    });
  });
});
