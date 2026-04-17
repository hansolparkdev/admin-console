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
  fetchAdminUserServer: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "admin@example.com",
    name: "Admin User",
    picture: null,
    provider: "google",
    status: "pending",
    role: "admin",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  }),
}));

// AdminUserDetailClient 모킹
vi.mock("@/features/admin-users/components/AdminUserDetailClient", () => ({
  AdminUserDetailClient: ({ id }: { id: string }) =>
    React.createElement("div", {
      "data-testid": "admin-user-detail-client",
      "data-id": id,
    }),
}));

import AdminUserDetailPage from "@/app/(app)/admin/users/[id]/page";

describe("AdminUserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HydrationBoundary를 렌더링한다", async () => {
    render(
      await AdminUserDetailPage({ params: Promise.resolve({ id: "user-1" }) }),
    );
    expect(screen.getByTestId("hydration-boundary")).toBeInTheDocument();
  });

  it("AdminUserDetailClient를 렌더링한다", async () => {
    render(
      await AdminUserDetailPage({ params: Promise.resolve({ id: "user-1" }) }),
    );
    expect(screen.getByTestId("admin-user-detail-client")).toBeInTheDocument();
  });

  it("id prop을 AdminUserDetailClient에 전달한다", async () => {
    render(
      await AdminUserDetailPage({ params: Promise.resolve({ id: "user-1" }) }),
    );
    const client = screen.getByTestId("admin-user-detail-client");
    expect(client.getAttribute("data-id")).toBe("user-1");
  });
});
