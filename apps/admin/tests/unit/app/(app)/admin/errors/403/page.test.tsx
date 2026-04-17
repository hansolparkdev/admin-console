import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import ForbiddenPage from "@/app/(app)/admin/errors/403/page";

describe("ForbiddenPage (403)", () => {
  it("'접근 권한이 없습니다' 메시지를 표시한다", () => {
    render(<ForbiddenPage />);
    expect(screen.getByText(/접근 권한이 없습니다/)).toBeInTheDocument();
  });

  it("홈으로 이동 링크가 있다", () => {
    render(<ForbiddenPage />);
    expect(screen.getByRole("link", { name: /홈으로/ })).toBeInTheDocument();
  });

  it("403 코드가 표시된다", () => {
    render(<ForbiddenPage />);
    expect(screen.getByText("403")).toBeInTheDocument();
  });
});
