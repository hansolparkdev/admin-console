import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

// Mock next/navigation for SidebarNav (client component dependency)
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

// Mock useMe — SidebarNav는 동적 메뉴 로딩으로 변경됨
vi.mock("@/features/auth/queries", () => ({
  useMe: vi.fn().mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      picture: null,
      status: "active",
      roles: ["SUPER_ADMIN"],
      menus: [
        {
          id: "m1",
          name: "대시보드",
          path: "/dashboard",
          icon: null,
          order: 0,
          permissions: { canRead: true, canWrite: false, canDelete: false },
          children: [],
        },
        {
          id: "m2",
          name: "관리자 관리",
          path: "/admin/users",
          icon: null,
          order: 1,
          permissions: { canRead: true, canWrite: false, canDelete: false },
          children: [],
        },
      ],
    },
    refetch: vi.fn(),
  }),
  authKeys: {
    all: ["auth"] as const,
    session: () => ["auth", "session"] as const,
    me: () => ["auth", "me"] as const,
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

const wrapper = createWrapper();

describe("Sidebar", () => {
  it("renders aside landmark element", () => {
    render(<Sidebar />, { wrapper });
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders nav with aria-label='사이드바 주 메뉴'", () => {
    render(<Sidebar />, { wrapper });
    expect(
      screen.getByRole("navigation", { name: "사이드바 주 메뉴" }),
    ).toBeInTheDocument();
  });

  it("renders wordmark link with aria-label='ADMIN CONSOLE 홈'", () => {
    render(<Sidebar />, { wrapper });
    const wordmarkLink = screen.getByRole("link", {
      name: "ADMIN CONSOLE 홈",
    });
    expect(wordmarkLink).toBeInTheDocument();
  });

  it("renders h2 with 'ADMIN CONSOLE' and aria-hidden='true'", () => {
    render(<Sidebar />, { wrapper });
    const h2 = screen.getByText("ADMIN CONSOLE");
    expect(h2.tagName.toLowerCase()).toBe("h2");
    expect(h2).toHaveAttribute("aria-hidden", "true");
  });

  it("renders p with 'Admin Console System' and aria-hidden='true'", () => {
    render(<Sidebar />, { wrapper });
    const p = screen.getByText("Admin Console System");
    expect(p.tagName.toLowerCase()).toBe("p");
    expect(p).toHaveAttribute("aria-hidden", "true");
  });

  it("does NOT render 'The Lens' text", () => {
    render(<Sidebar />, { wrapper });
    expect(screen.queryByText("The Lens")).not.toBeInTheDocument();
  });

  it("renders menu items from dynamic menus (대시보드, 관리자 관리)", () => {
    render(<Sidebar />, { wrapper });
    expect(screen.getByText("대시보드")).toBeInTheDocument();
    expect(screen.getByText("관리자 관리")).toBeInTheDocument();
  });

  it("does NOT render old menu items (Users, Analytics, Settings, Reports)", () => {
    render(<Sidebar />, { wrapper });
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });

  it("applies dark sidebar background via var(--sidebar)", () => {
    render(<Sidebar />, { wrapper });
    const aside = screen.getByRole("complementary");
    expect(aside.getAttribute("style") ?? "").toContain("var(--sidebar)");
  });

  it("sidebar z-index is 40", () => {
    render(<Sidebar />, { wrapper });
    const aside = screen.getByRole("complementary");
    const style = aside.getAttribute("style") ?? "";
    expect(style).toContain("z-index: 40");
  });
});
