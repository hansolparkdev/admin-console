import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// HydrationBoundary + QueryClient 모킹
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    HydrationBoundary: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        "div",
        { "data-testid": "hydration-boundary" },
        children,
      ),
    dehydrate: vi.fn(() => ({})),
  };
});

// get-query-client 모킹
vi.mock("@/lib/get-query-client", () => ({
  getQueryClient: vi.fn(() => ({
    prefetchQuery: vi.fn(),
  })),
}));

// api-server 모킹
vi.mock("@/features/admin-users/api-server", () => ({
  fetchAdminUsersServer: vi.fn().mockResolvedValue([]),
}));

// AdminUsersListClient 모킹
vi.mock("@/features/admin-users/components/AdminUsersListClient", () => ({
  AdminUsersListClient: () =>
    React.createElement("div", { "data-testid": "admin-users-list-client" }),
}));

import AdminUsersPage from "@/app/(app)/admin/users/page";

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HydrationBoundary를 렌더링한다", async () => {
    render(await AdminUsersPage());
    expect(screen.getByTestId("hydration-boundary")).toBeInTheDocument();
  });

  it("AdminUsersListClient를 렌더링한다", async () => {
    render(await AdminUsersPage());
    expect(screen.getByTestId("admin-users-list-client")).toBeInTheDocument();
  });

  it("AdminUsersListClient만 직접 렌더링한다 — 페이지 헤더는 AdminUsersListClient 내부로 이동됨", async () => {
    render(await AdminUsersPage());
    // 페이지는 HydrationBoundary + AdminUsersListClient 조합만 렌더링.
    // 제목은 AdminUsersListClient 내부 (AdminUsersListClient.test.tsx에서 검증).
    expect(screen.getByTestId("admin-users-list-client")).toBeInTheDocument();
  });
});
