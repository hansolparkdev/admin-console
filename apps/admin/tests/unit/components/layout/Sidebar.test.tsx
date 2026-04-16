import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

// Mock next/navigation for SidebarNav (client component dependency)
vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

describe("Sidebar", () => {
  it("renders aside landmark element", () => {
    render(<Sidebar />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders nav with aria-label='사이드바 주 메뉴'", () => {
    render(<Sidebar />);
    expect(
      screen.getByRole("navigation", { name: "사이드바 주 메뉴" }),
    ).toBeInTheDocument();
  });

  it("renders 2-tier wordmark ('The Lens' + 'Admin Console') inside a single link to /dashboard", () => {
    render(<Sidebar />);
    const wordmarkLink = screen.getByRole("link", {
      name: /The Lens.*Admin Console/i,
    });
    expect(wordmarkLink).toBeInTheDocument();
    expect(wordmarkLink).toHaveAttribute("href", "/dashboard");
    expect(wordmarkLink).toHaveTextContent("The Lens");
    expect(wordmarkLink).toHaveTextContent("Admin Console");
  });

  it("renders all 5 Stitch menu items", () => {
    render(<Sidebar />);
    for (const label of [
      "Dashboard",
      "Users",
      "Analytics",
      "Settings",
      "Reports",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders 'Admin User' footer name", () => {
    render(<Sidebar />);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("renders 'Administrator' footer role", () => {
    render(<Sidebar />);
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });

  it("applies dark sidebar background via var(--sidebar)", () => {
    render(<Sidebar />);
    const aside = screen.getByRole("complementary");
    expect(aside.getAttribute("style") ?? "").toContain("var(--sidebar)");
  });
});
