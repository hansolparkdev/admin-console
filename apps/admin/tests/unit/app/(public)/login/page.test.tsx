import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// LoginForm 모킹 — 클라이언트 컴포넌트, 단위 테스트 범위 외
vi.mock("@/features/auth/components/LoginForm", () => ({
  LoginForm: ({
    error,
    callbackUrl,
  }: {
    error?: string;
    callbackUrl?: string;
  }) => (
    <div
      data-testid="login-form"
      {...(error !== undefined ? { "data-error": error } : {})}
      {...(callbackUrl !== undefined
        ? { "data-callback-url": callbackUrl }
        : {})}
    >
      LoginForm
    </div>
  ),
}));

import LoginPage from "@/app/(public)/login/page";

describe("LoginPage", () => {
  describe("데스크톱 레이아웃 — 좌 다크 패널 + 우 라이트 패널", () => {
    it("좌 패널에 ADMIN CONSOLE 워드마크가 표시된다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({}),
        }),
      );

      expect(screen.getByText("ADMIN CONSOLE")).toBeInTheDocument();
    });

    it("좌 패널에 '운영 콘솔' 보조 라벨이 표시된다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({}),
        }),
      );

      expect(screen.getByText("운영 콘솔")).toBeInTheDocument();
    });

    it("좌 패널에 저작권 텍스트가 표시된다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({}),
        }),
      );

      expect(screen.getByText(/© \d{4} Admin Console/)).toBeInTheDocument();
    });

    it("LoginForm이 렌더링된다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({}),
        }),
      );

      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });

  describe("searchParams에서 error 코드 수신", () => {
    it("error 파라미터를 LoginForm에 전달한다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({ error: "unauthorized_domain" }),
        }),
      );

      const form = screen.getByTestId("login-form");
      expect(form.getAttribute("data-error")).toBe("unauthorized_domain");
    });

    it("error 파라미터가 없으면 undefined를 전달한다", async () => {
      render(
        await LoginPage({
          searchParams: Promise.resolve({}),
        }),
      );

      const form = screen.getByTestId("login-form");
      expect(form.getAttribute("data-error")).toBeNull();
    });
  });
});
