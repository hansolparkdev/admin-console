import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";

describe("SidebarUserFooter", () => {
  it("renders avatar initial 'A'", () => {
    render(<SidebarUserFooter />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders 'Admin User' name", () => {
    render(<SidebarUserFooter />);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("renders 'Administrator' role", () => {
    render(<SidebarUserFooter />);
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });

  it("renders name and role in separate DOM elements", () => {
    const { container } = render(<SidebarUserFooter />);
    const name = container.querySelector('[data-testid="user-name"]');
    const role = container.querySelector('[data-testid="user-role"]');
    expect(name).toBeInTheDocument();
    expect(role).toBeInTheDocument();
    expect(name?.textContent).toBe("Admin User");
    expect(role?.textContent).toBe("Administrator");
  });
});
