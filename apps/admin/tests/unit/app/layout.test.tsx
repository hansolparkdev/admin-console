import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// next/font/google 모킹
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans", className: "inter" }),
  Manrope: () => ({ variable: "--font-heading", className: "manrope" }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
    className: "geist-mono",
  }),
}));

// SessionProvider 모킹
vi.mock("@/components/providers/SessionProvider", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

// QueryProvider 모킹
vi.mock("@/components/providers/query-provider", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("SessionProvider와 QueryProvider로 children을 감싼다", async () => {
    const { default: RootLayout } = await import("@/app/layout");

    render(
      // @ts-expect-error: RootLayout은 html 엘리먼트를 반환하지만 RTL에서는 단순 렌더 테스트
      <RootLayout>
        <div data-testid="child">Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByTestId("query-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
