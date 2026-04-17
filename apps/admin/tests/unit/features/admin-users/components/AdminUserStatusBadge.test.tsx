import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminUserStatusBadge } from "@/features/admin-users/components/AdminUserStatusBadge";

describe("AdminUserStatusBadge", () => {
  it("pending 상태 — '승인 대기' 텍스트를 렌더링한다", () => {
    render(<AdminUserStatusBadge status="pending" />);
    expect(screen.getByText("승인 대기")).toBeInTheDocument();
  });

  it("active 상태 — '활성' 텍스트를 렌더링한다", () => {
    render(<AdminUserStatusBadge status="active" />);
    expect(screen.getByText("활성")).toBeInTheDocument();
  });

  it("rejected 상태 — '거절됨' 텍스트를 렌더링한다", () => {
    render(<AdminUserStatusBadge status="rejected" />);
    expect(screen.getByText("거절됨")).toBeInTheDocument();
  });

  it("pending — bg-orange-100 text-orange-700 클래스를 가진다", () => {
    render(<AdminUserStatusBadge status="pending" />);
    const badge = screen.getByText("승인 대기");
    expect(badge).toHaveClass("bg-orange-100");
    expect(badge).toHaveClass("text-orange-700");
  });

  it("active — bg-blue-100 text-blue-700 클래스를 가진다", () => {
    render(<AdminUserStatusBadge status="active" />);
    const badge = screen.getByText("활성");
    expect(badge).toHaveClass("bg-blue-100");
    expect(badge).toHaveClass("text-blue-700");
  });

  it("rejected — bg-red-100 text-red-700 클래스를 가진다", () => {
    render(<AdminUserStatusBadge status="rejected" />);
    const badge = screen.getByText("거절됨");
    expect(badge).toHaveClass("bg-red-100");
    expect(badge).toHaveClass("text-red-700");
  });

  it("공통 — px-3 py-1 rounded-full text-[11px] font-bold 클래스를 가진다", () => {
    render(<AdminUserStatusBadge status="pending" />);
    const badge = screen.getByText("승인 대기");
    expect(badge).toHaveClass("px-3");
    expect(badge).toHaveClass("py-1");
    expect(badge).toHaveClass("rounded-full");
    expect(badge).toHaveClass("font-bold");
  });
});
