import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation for SidebarNav (client component dependency)
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
  redirect: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Map([["x-pathname", "/dashboard"]])),
}));

// Auth.js auth() — 인증된 세션 상태로 고정 (가드 통과)
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { email: "user@example.com", name: "Test User" },
  }),
}));

// Mock next/font/google to avoid issues in test environment
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "font-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "font-mono" }),
  Manrope: () => ({ variable: "--font-manrope", className: "font-manrope" }),
}));

import AppLayout from "@/app/(app)/layout";

describe("AppLayout", () => {
  it("renders aside (sidebar) landmark", async () => {
    render(await AppLayout({ children: "children" }));
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders header landmark", async () => {
    render(await AppLayout({ children: "children" }));
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders main landmark", async () => {
    render(await AppLayout({ children: "children" }));
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders footer landmark with role=contentinfo", async () => {
    render(await AppLayout({ children: "children" }));
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders children inside main", async () => {
    render(await AppLayout({ children: "test-children" }));
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("test-children");
  });

  it("renders exactly one aside, header, main, and contentinfo", async () => {
    render(await AppLayout({ children: "children" }));
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });

  it("footer contains copyright text with current year", async () => {
    render(await AppLayout({ children: "children" }));
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toMatch(/ADMIN CONSOLE\. All rights reserved\./);
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
  });

  it("footer uses var(--footer-muted-foreground) color token", async () => {
    render(await AppLayout({ children: "children" }));
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
});
