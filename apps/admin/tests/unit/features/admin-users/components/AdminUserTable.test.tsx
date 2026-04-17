import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { AdminUserTable } from "@/features/admin-users/components/AdminUserTable";
import type { AdminUser } from "@/features/admin-users/types";

// AdminUserActions 의 queries 의존 모킹
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
  name: "Admin User",
  picture: null,
  provider: "google",
  status: "pending",
  role: "admin",
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

describe("AdminUserTable", () => {
  describe("로딩 상태", () => {
    it("isPending=true이면 로딩 표시를 렌더링한다", () => {
      render(
        <AdminUserTable users={undefined} isPending={true} isError={false} />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText(/로딩/)).toBeInTheDocument();
    });
  });

  describe("에러 상태", () => {
    it("isError=true이면 에러 메시지를 렌더링한다", () => {
      render(
        <AdminUserTable users={undefined} isPending={false} isError={true} />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText(/오류/)).toBeInTheDocument();
    });
  });

  describe("빈 상태", () => {
    it("users가 빈 배열이면 빈 상태 메시지를 렌더링한다", () => {
      render(<AdminUserTable users={[]} isPending={false} isError={false} />, {
        wrapper: createWrapper(),
      });
      expect(screen.getByText(/없습니다/)).toBeInTheDocument();
    });
  });

  describe("테이블 레이아웃", () => {
    const users = [
      makeUser({
        id: "user-1",
        email: "a@example.com",
        name: "Alice",
        status: "pending",
      }),
      makeUser({
        id: "user-2",
        email: "b@example.com",
        name: "Bob",
        status: "active",
      }),
    ];

    it("헤더 컬럼 '사용자 이름', '이메일 주소', '역할', '상태', '액션'이 존재한다", () => {
      render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText("사용자 이름")).toBeInTheDocument();
      expect(screen.getByText("이메일 주소")).toBeInTheDocument();
      expect(screen.getByText("역할")).toBeInTheDocument();
      expect(screen.getByText("상태")).toBeInTheDocument();
      expect(screen.getByText("액션")).toBeInTheDocument();
    });

    it("테이블 컨테이너 — bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const tableWrapper =
        container.querySelector("table")?.parentElement?.parentElement;
      expect(tableWrapper).toHaveClass("bg-surface-container-lowest");
      expect(tableWrapper).toHaveClass("rounded-xl");
      expect(tableWrapper).toHaveClass("overflow-hidden");
      expect(tableWrapper).toHaveClass("shadow-sm");
    });

    it("thead tr — bg-surface-container-low 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const theadRow = container.querySelector("thead tr");
      expect(theadRow).toHaveClass("bg-surface-container-low");
    });

    it("홀수 행 — bg-surface-container-low 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows[0]).toHaveClass("bg-surface-container-low");
    });

    it("짝수 행 — bg-surface-container-lowest 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const rows = container.querySelectorAll("tbody tr");
      expect(rows[1]).toHaveClass("bg-surface-container-lowest");
    });

    it("이름 링크 — text-primary font-bold hover:underline 클래스를 가진다", () => {
      render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const link = screen.getByRole("link", { name: "Alice" });
      expect(link).toHaveClass("text-primary");
      expect(link).toHaveClass("font-bold");
      expect(link).toHaveClass("hover:underline");
    });

    it("역할 뱃지 — bg-surface-container rounded text-on-surface-variant 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const roleBadges = container.querySelectorAll(
        "tbody td span.bg-surface-container",
      );
      expect(roleBadges.length).toBeGreaterThan(0);
      expect(roleBadges[0]).toHaveClass("text-on-surface-variant");
    });

    it("액션 td — text-right 클래스를 가진다", () => {
      const { container } = render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      const rows = container.querySelectorAll("tbody tr");
      const actionTd = rows[0]?.querySelectorAll("td");
      const lastTd = actionTd?.[actionTd.length - 1];
      expect(lastTd).toHaveClass("text-right");
    });

    it("사용자 목록을 렌더링한다", () => {
      render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
      expect(screen.getByText("b@example.com")).toBeInTheDocument();
    });

    it("탭 버튼이 존재하지 않는다 — 탭은 AdminUsersListClient에서 관리", () => {
      render(
        <AdminUserTable users={users} isPending={false} isError={false} />,
        { wrapper: createWrapper() },
      );
      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });
  });
});
