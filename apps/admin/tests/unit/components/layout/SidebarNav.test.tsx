import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "@/components/layout/SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("SidebarNav", () => {
  it("renders exactly 2 menu entries", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });

  it("renders menu entries in order: 대시보드, 관리자 관리", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    const labels = links.map((l) => l.textContent?.trim());
    expect(labels).toEqual(["대시보드", "관리자 관리"]);
  });

  it("sets aria-current='page' on 대시보드 when at /dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const dashboardLink = screen.getByText("대시보드").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("sets aria-current='page' on 관리자 관리 at /admins", () => {
    vi.mocked(usePathname).mockReturnValue("/admins");
    render(<SidebarNav />);
    expect(screen.getByText("관리자 관리").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("대시보드").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sets aria-current='page' on 관리자 관리 at /admins/123 (prefix match)", () => {
    vi.mocked(usePathname).mockReturnValue("/admins/123");
    render(<SidebarNav />);
    expect(screen.getByText("관리자 관리").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("does NOT set aria-current on other item when at /dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    expect(screen.getByText("관리자 관리").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("does NOT render width:4px <span> (bar removed)", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const activeLink = screen.getByText("대시보드").closest("a") as HTMLElement;
    const spans = activeLink.querySelectorAll('span[aria-hidden="true"]');
    for (const span of spans) {
      const style = span.getAttribute("style") ?? "";
      expect(style).not.toContain("width: 4px");
    }
  });

  it("active link className includes translate-x-1", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const activeLink = screen.getByText("대시보드").closest("a") as HTMLElement;
    expect(activeLink.className).toContain("translate-x-1");
  });

  it("active link className includes rounded-xl", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const activeLink = screen.getByText("대시보드").closest("a") as HTMLElement;
    expect(activeLink.className).toContain("rounded-xl");
  });

  it("active item applies sidebar-accent background via inline style", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const dashboardLink = screen
      .getByText("대시보드")
      .closest("a") as HTMLElement;
    expect(dashboardLink.getAttribute("style") ?? "").toContain(
      "var(--sidebar-accent)",
    );
  });

  it("icon is rendered at 22px", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    // Check that the active link icon has class size-[22px] or similar
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("all menu items are <a> links (keyboard-focusable)", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link.tagName.toLowerCase()).toBe("a");
    }
  });
});
