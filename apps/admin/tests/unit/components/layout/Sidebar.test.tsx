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

  it("renders wordmark link with aria-label='ADMIN CONSOLE 홈'", () => {
    render(<Sidebar />);
    const wordmarkLink = screen.getByRole("link", {
      name: "ADMIN CONSOLE 홈",
    });
    expect(wordmarkLink).toBeInTheDocument();
  });

  it("renders h2 with 'ADMIN CONSOLE' and aria-hidden='true'", () => {
    render(<Sidebar />);
    const h2 = screen.getByText("ADMIN CONSOLE");
    expect(h2.tagName.toLowerCase()).toBe("h2");
    expect(h2).toHaveAttribute("aria-hidden", "true");
  });

  it("renders p with 'Admin Console System' and aria-hidden='true'", () => {
    render(<Sidebar />);
    const p = screen.getByText("Admin Console System");
    expect(p.tagName.toLowerCase()).toBe("p");
    expect(p).toHaveAttribute("aria-hidden", "true");
  });

  it("does NOT render 'The Lens' text", () => {
    render(<Sidebar />);
    expect(screen.queryByText("The Lens")).not.toBeInTheDocument();
  });

  it("renders exactly 2 menu items (대시보드, 관리자 관리)", () => {
    render(<Sidebar />);
    expect(screen.getByText("대시보드")).toBeInTheDocument();
    expect(screen.getByText("관리자 관리")).toBeInTheDocument();
  });

  it("does NOT render old menu items (Users, Analytics, Settings, Reports)", () => {
    render(<Sidebar />);
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
  });

  it("applies dark sidebar background via var(--sidebar)", () => {
    render(<Sidebar />);
    const aside = screen.getByRole("complementary");
    expect(aside.getAttribute("style") ?? "").toContain("var(--sidebar)");
  });

  it("sidebar z-index is 40", () => {
    render(<Sidebar />);
    const aside = screen.getByRole("complementary");
    const style = aside.getAttribute("style") ?? "";
    expect(style).toContain("z-index: 40");
  });
});
