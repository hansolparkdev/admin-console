import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";

describe("SidebarUserFooter", () => {
  it("renders '최고 관리자' role text", () => {
    render(<SidebarUserFooter />);
    expect(screen.getByText("최고 관리자")).toBeInTheDocument();
  });

  it("renders 'Admin_User' name", () => {
    render(<SidebarUserFooter />);
    expect(screen.getByText("Admin_User")).toBeInTheDocument();
  });

  it("renders 'super-admin@system.com' email with data-testid", () => {
    render(<SidebarUserFooter />);
    const emailEl = screen.getByTestId("user-email");
    expect(emailEl).toBeInTheDocument();
    expect(emailEl.textContent).toBe("super-admin@system.com");
  });

  it("does NOT render 'Administrator' text", () => {
    render(<SidebarUserFooter />);
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
  });

  it("does NOT render 'Admin User' text", () => {
    render(<SidebarUserFooter />);
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument();
  });

  it("does NOT render <img> element (no profile photo)", () => {
    const { container } = render(<SidebarUserFooter />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders 40x40 avatar circle placeholder (no img)", () => {
    const { container } = render(<SidebarUserFooter />);
    // Avatar placeholder is a div with 40px width/height
    const avatar = container.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement | null;
    expect(avatar).not.toBeNull();
    const style = avatar?.getAttribute("style") ?? "";
    expect(style).toContain("40px");
    expect(style).toContain("var(--sidebar-avatar-bg)");
  });

  it("SidebarUserFooter root has mt-auto", () => {
    const { container } = render(<SidebarUserFooter />);
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("style") ?? "").toContain("margin-top: auto");
  });
});
