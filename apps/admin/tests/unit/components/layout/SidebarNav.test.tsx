import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarNav } from "@/components/layout/SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("SidebarNav", () => {
  it("renders all 5 Stitch menu entries in order", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    const labels = links.map((l) => l.textContent?.trim());
    expect(labels).toEqual([
      "Dashboard",
      "Users",
      "Analytics",
      "Settings",
      "Reports",
    ]);
  });

  it("sets aria-current='page' on Dashboard when at /dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("does NOT set aria-current on other items when at /dashboard", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    for (const label of ["Users", "Analytics", "Settings", "Reports"]) {
      const link = screen.getByText(label).closest("a");
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("sets aria-current='page' on Users at /users", () => {
    vi.mocked(usePathname).mockReturnValue("/users");
    render(<SidebarNav />);
    expect(screen.getByText("Users").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Dashboard").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sets aria-current='page' on Analytics at /analytics/foo (prefix match)", () => {
    vi.mocked(usePathname).mockReturnValue("/analytics/foo");
    render(<SidebarNav />);
    expect(screen.getByText("Analytics").closest("a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renders right-side 4px accent bar on active item (Stitch spec)", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const activeLink = screen
      .getByText("Dashboard")
      .closest("a") as HTMLElement;
    const accentBar = activeLink.querySelector(
      'span[aria-hidden="true"]',
    ) as HTMLElement | null;
    expect(accentBar).not.toBeNull();
    const style = accentBar?.getAttribute("style") ?? "";
    expect(style).toContain("width: 4px");
    expect(style).toContain("right: 0");
    expect(style).toContain("var(--sidebar-primary)");
  });

  it("inactive items do NOT render the accent bar span", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const inactiveLink = screen.getByText("Users").closest("a") as HTMLElement;
    const accentBar = inactiveLink.querySelector('span[aria-hidden="true"]');
    expect(accentBar).toBeNull();
  });

  it("active item applies sidebar-accent background via inline style", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const dashboardLink = screen
      .getByText("Dashboard")
      .closest("a") as HTMLElement;
    expect(dashboardLink.getAttribute("style") ?? "").toContain(
      "var(--sidebar-accent)",
    );
  });

  it("all menu items are <a> links (keyboard-focusable)", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<SidebarNav />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(5);
    for (const link of links) {
      expect(link.tagName.toLowerCase()).toBe("a");
    }
  });
});
