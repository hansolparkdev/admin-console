import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import UsersPage from "@/app/(app)/users/page";

describe("UsersPage", () => {
  it("renders 'Users' heading", () => {
    render(<UsersPage />);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("renders placeholder description text", () => {
    render(<UsersPage />);
    expect(
      screen.getByText("사용자 목록은 후속 슬라이스에서 추가됩니다."),
    ).toBeInTheDocument();
  });
});
