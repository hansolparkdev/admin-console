import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation for SidebarNav (client component dependency)
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

// Mock next/font/google to avoid issues in test environment
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "font-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "font-mono" }),
  Manrope: () => ({ variable: "--font-manrope", className: "font-manrope" }),
}));

import AppLayout from "@/app/(app)/layout";

describe("AppLayout", () => {
  it("renders aside (sidebar) landmark", () => {
    render(<AppLayout>children</AppLayout>);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders header landmark", () => {
    render(<AppLayout>children</AppLayout>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders main landmark", () => {
    render(<AppLayout>children</AppLayout>);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders children inside main", () => {
    render(<AppLayout>test-children</AppLayout>);
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("test-children");
  });

  it("renders exactly one aside, header, and main", () => {
    render(<AppLayout>children</AppLayout>);
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
