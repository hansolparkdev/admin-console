import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation redirect
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  usePathname: vi.fn().mockReturnValue("/"),
}));

// Mock auth()
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

describe("RootPage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    authMock.mockReset();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("인증된 사용자: /dashboard 로 redirect", async () => {
    authMock.mockResolvedValue({
      user: { email: "user@example.com" },
    });

    const { default: RootPage } = await import("@/app/page");

    try {
      await RootPage();
    } catch {
      // redirect throws
    }

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("미인증 사용자: /login 으로 redirect", async () => {
    authMock.mockResolvedValue(null);

    const { default: RootPage } = await import("@/app/page");

    try {
      await RootPage();
    } catch {
      // redirect throws
    }

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
