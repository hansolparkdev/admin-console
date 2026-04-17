import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock next/navigation for SidebarNav (client component dependency)
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
  redirect: vi.fn(),
}));

// server-only 모듈은 테스트 환경에서 동작하지 않으므로 mock 처리
vi.mock("@/lib/api-server", () => ({
  apiServerFetch: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "admin@example.com",
    name: "Admin",
    picture: null,
    status: "active",
    roles: ["SUPER_ADMIN"],
    menus: [],
  }),
}));

// Mock useMe so SidebarNav doesn't trigger real queries
vi.mock("@/features/auth/queries", () => ({
  useMe: vi.fn().mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      id: "u1",
      email: "a@a.com",
      name: "A",
      picture: null,
      status: "active",
      roles: ["SUPER_ADMIN"],
      menus: [],
    },
    refetch: vi.fn(),
  }),
  authKeys: {
    all: ["auth"] as const,
    session: () => ["auth", "session"] as const,
    me: () => ["auth", "me"] as const,
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map([["x-pathname", "/dashboard"]])),
}));

// Auth.js auth() — 인증된 active 세션 상태로 고정 (가드 통과)
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { email: "user@example.com", name: "Test User", status: "active" },
  }),
}));

// Mock next/font/google to avoid issues in test environment
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "font-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "font-mono" }),
  Manrope: () => ({ variable: "--font-manrope", className: "font-manrope" }),
}));

import AppLayout from "@/app/(app)/layout";

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

const renderWithWrapper = async (children: React.ReactNode = "children") => {
  const layout = await AppLayout({ children });
  return render(layout, { wrapper: createWrapper() });
};

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders aside (sidebar) landmark", async () => {
    await renderWithWrapper();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders header landmark", async () => {
    await renderWithWrapper();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders main landmark", async () => {
    await renderWithWrapper();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders footer landmark with role=contentinfo", async () => {
    await renderWithWrapper();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders children inside main", async () => {
    await renderWithWrapper("test-children");
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("test-children");
  });

  it("renders exactly one aside, header, main, and contentinfo", async () => {
    await renderWithWrapper();
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it("footer contains copyright text with current year", async () => {
    await renderWithWrapper();
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toMatch(/ADMIN CONSOLE\. All rights reserved\./);
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it("footer uses var(--footer-muted-foreground) color token", async () => {
    await renderWithWrapper();
    const footer = screen.getByRole("contentinfo");
    const style = footer.getAttribute("style") ?? "";
    expect(style).toContain("var(--footer-muted-foreground)");
  });

  it("미인증 시 /login 으로 redirect한다", async () => {
    const { auth } = await import("@/lib/auth");
    const { redirect } = await import("next/navigation");
    vi.mocked(auth).mockResolvedValueOnce(null);
    vi.mocked(redirect).mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await AppLayout({ children: "children" });
    } catch (err) {
      expect((err as Error).message).toBe("NEXT_REDIRECT");
    }

    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  // ─── session-guard: status 체크 ───────────────────────────────────────────
  it("pending 세션 → /login 으로 redirect한다", async () => {
    const { auth } = await import("@/lib/auth");
    const { redirect } = await import("next/navigation");
    vi.mocked(auth).mockResolvedValueOnce({
      user: {
        email: "user@example.com",
        name: "Pending User",
        status: "pending",
      },
      expires: "",
    });
    vi.mocked(redirect).mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await AppLayout({ children: "children" });
    } catch (err) {
      expect((err as Error).message).toBe("NEXT_REDIRECT");
    }

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("rejected 세션 → /login 으로 redirect한다", async () => {
    const { auth } = await import("@/lib/auth");
    const { redirect } = await import("next/navigation");
    vi.mocked(auth).mockResolvedValueOnce({
      user: {
        email: "user@example.com",
        name: "Rejected User",
        status: "rejected",
      },
      expires: "",
    });
    vi.mocked(redirect).mockImplementationOnce(() => {
      throw new Error("NEXT_REDIRECT");
    });

    try {
      await AppLayout({ children: "children" });
    } catch (err) {
      expect((err as Error).message).toBe("NEXT_REDIRECT");
    }

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("active 세션 → 정상 렌더링 (redirect 없음)", async () => {
    const { auth } = await import("@/lib/auth");
    const { redirect } = await import("next/navigation");
    vi.mocked(auth).mockResolvedValueOnce({
      user: {
        email: "user@example.com",
        name: "Active User",
        status: "active",
      },
      expires: "",
    });

    await renderWithWrapper();

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
