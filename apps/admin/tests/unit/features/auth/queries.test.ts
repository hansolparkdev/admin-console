import { describe, it, expect } from "vitest";
import { authKeys } from "@/features/auth/queries";

describe("authKeys — Query Key Factory", () => {
  it("all은 고정 배열이다", () => {
    expect(authKeys.all).toEqual(["auth"]);
  });

  it("session은 all을 포함하는 배열이다", () => {
    expect(authKeys.session()).toEqual(["auth", "session"]);
  });
});
