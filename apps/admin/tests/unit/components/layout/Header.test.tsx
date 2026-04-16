import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const SEARCH_PLACEHOLDER = "Search data points, users, or logs...";

describe("Header", () => {
  it("renders header landmark element", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders SearchInput with Stitch placeholder", () => {
    render(<Header />);
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
  });

  it("renders notification button with aria-label='알림'", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: "알림" })).toBeInTheDocument();
  });

  it("renders help button with aria-label='도움말'", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: "도움말" })).toBeInTheDocument();
  });

  it("renders 'The Executive Lens' brand badge inside header (Stitch 매치)", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveTextContent("The Executive Lens");
  });

  it("applies glass background via inline style", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const style = header.getAttribute("style") ?? "";
    expect(style).toContain("var(--header-glass-bg)");
  });

  it("applies backdrop-filter: blur(12px) via inline style", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const style = header.getAttribute("style") ?? "";
    expect(style).toContain("blur(12px)");
  });

  it("applies -webkit-backdrop-filter via inline style (WebkitBackdropFilter property)", () => {
    render(<Header />);
    const header = screen.getByRole("banner") as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webkitVal = (header.style as any)["WebkitBackdropFilter"] as
      | string
      | undefined;
    expect(webkitVal).toContain("blur(12px)");
  });
});
