import { describe, it, expect, vi } from "vitest";

// Mock next/navigation redirect
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  usePathname: vi.fn().mockReturnValue("/"),
}));

describe("RootPage", () => {
  it("calls redirect('/dashboard')", async () => {
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    // Import after mock is set up
    const { default: RootPage } = await import("@/app/page");

    try {
      RootPage();
    } catch (err) {
      // Next.js redirect throws internally — that is expected
      expect(err).toBeInstanceOf(Error);
    }

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
