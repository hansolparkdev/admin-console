import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const NEW_SEARCH_PLACEHOLDER = "시스템 기능 검색...";

describe("Header", () => {
  it("renders header landmark element with role=banner", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders SearchInput with updated placeholder", () => {
    render(<Header />);
    expect(
      screen.getByPlaceholderText(NEW_SEARCH_PLACEHOLDER),
    ).toBeInTheDocument();
  });

  it("renders notification button with aria-label='알림'", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: "알림" })).toBeInTheDocument();
  });

  it("renders theme toggle button with aria-label='테마 전환'", () => {
    render(<Header />);
    expect(
      screen.getByRole("button", { name: "테마 전환" }),
    ).toBeInTheDocument();
  });

  it("theme toggle button does NOT have aria-pressed attribute", () => {
    render(<Header />);
    const btn = screen.getByRole("button", { name: "테마 전환" });
    expect(btn).not.toHaveAttribute("aria-pressed");
  });

  it("does NOT render help button (도움말 버튼 제거)", () => {
    render(<Header />);
    expect(
      screen.queryByRole("button", { name: "도움말" }),
    ).not.toBeInTheDocument();
  });

  it("does NOT render 'The Executive Lens' text", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveTextContent("The Executive Lens");
  });

  it("does NOT render 'The Lens' text", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveTextContent("The Lens");
  });

  it("does NOT render 'Admin Console' text in header", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveTextContent("Admin Console");
  });

  it("renders profile link to /admins with aria-label='프로필'", () => {
    render(<Header />);
    const profileLink = screen.getByRole("link", { name: "프로필" });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/admins");
  });

  it("profile link contains 'Admin_User' text", () => {
    render(<Header />);
    const profileLink = screen.getByRole("link", { name: "프로필" });
    expect(profileLink).toHaveTextContent("Admin_User");
  });

  it("notification dot has top-2 right-2 positioning", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const dots = header.querySelectorAll('span[aria-hidden="true"]');
    const notifDot = Array.from(dots).find((s) => {
      const style = s.getAttribute("style") ?? "";
      return style.includes("var(--destructive)");
    });
    expect(notifDot).toBeDefined();
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

  it("applies -webkit-backdrop-filter via inline style", () => {
    render(<Header />);
    const header = screen.getByRole("banner") as HTMLElement;
    // WebkitBackdropFilter는 CSSStyleDeclaration 공식 타입에 없음 — 브라우저 비표준 벤더 프리픽스 접근 불가피
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webkitVal = (header.style as any)["WebkitBackdropFilter"] as
      | string
      | undefined;
    expect(webkitVal).toContain("blur(12px)");
  });

  it("header z-index is 50", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    const style = header.getAttribute("style") ?? "";
    expect(style).toContain("z-index: 50");
  });
});
