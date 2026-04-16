import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/layout/SearchInput";

const PLACEHOLDER = "Search data points, users, or logs...";

describe("SearchInput", () => {
  it("renders input with Stitch placeholder", () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeInTheDocument();
  });

  it("updates value on user input", () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input.value).toBe("hello");
  });

  it("renders Search icon (aria-hidden)", () => {
    render(<SearchInput />);
    const svgs = document.querySelectorAll("svg[aria-hidden='true']");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("applies 384px container width (Stitch w-96)", () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    const container = input.parentElement as HTMLElement;
    expect(container.getAttribute("style")).toContain("384px");
  });

  it("applies full rounded pill shape on input (border-radius 9999px)", () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement;
    expect(input.getAttribute("style")).toContain("9999px");
  });
});
