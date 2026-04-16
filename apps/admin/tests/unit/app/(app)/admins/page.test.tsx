import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminsPage from "@/app/(app)/admins/page";

describe("AdminsPage", () => {
  it("renders '관리자 관리' heading", () => {
    render(<AdminsPage />);
    expect(
      screen.getByRole("heading", { name: "관리자 관리" }),
    ).toBeInTheDocument();
  });

  it("renders placeholder description text", () => {
    render(<AdminsPage />);
    expect(
      screen.getByText("관리자 목록은 후속 슬라이스에서 추가됩니다."),
    ).toBeInTheDocument();
  });

  it("does NOT render 'Users' text", () => {
    render(<AdminsPage />);
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});
