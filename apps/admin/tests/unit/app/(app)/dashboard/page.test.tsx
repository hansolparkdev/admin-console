import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(app)/dashboard/page";

describe("DashboardPage", () => {
  it("renders 'Dashboard' heading", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders placeholder description text", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText("대시보드 콘텐츠는 후속 슬라이스에서 추가됩니다."),
    ).toBeInTheDocument();
  });
});
