import { describe, it, expect, vi, beforeEach } from "vitest";

// next-auth/react 모킹
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { startGoogleSignIn, performSignOut } from "@/features/auth/api";

describe("auth api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startGoogleSignIn", () => {
    it("signIn('google', { callbackUrl })를 호출한다", async () => {
      const { signIn } = await import("next-auth/react");
      vi.mocked(signIn).mockResolvedValue(undefined);

      await startGoogleSignIn("/dashboard");

      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });

    it("callbackUrl 미전달 시 /dashboard를 기본값으로 사용한다", async () => {
      const { signIn } = await import("next-auth/react");
      vi.mocked(signIn).mockResolvedValue(undefined);

      await startGoogleSignIn();

      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });
  });

  describe("performSignOut", () => {
    it("signOut({ callbackUrl: '/login' })를 호출한다", async () => {
      const { signOut } = await import("next-auth/react");
      vi.mocked(signOut).mockResolvedValue(undefined);

      await performSignOut();

      expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });
});
