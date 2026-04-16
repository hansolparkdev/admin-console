import { describe, it, expect } from "vitest";
import { isMenuActive } from "@/lib/navigation/is-menu-active";

describe("isMenuActive", () => {
  it("matches exact /dashboard", () => {
    expect(isMenuActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("matches /dashboard/anything (sub-path)", () => {
    expect(isMenuActive("/dashboard/anything", "/dashboard")).toBe(true);
  });

  it("matches exact /users", () => {
    expect(isMenuActive("/users", "/users")).toBe(true);
  });

  it("matches /users/123 (sub-path)", () => {
    expect(isMenuActive("/users/123", "/users")).toBe(true);
  });

  it("matches /users/123/edit (deep sub-path)", () => {
    expect(isMenuActive("/users/123/edit", "/users")).toBe(true);
  });

  it("does NOT match /usersettings for /users (false positive guard)", () => {
    expect(isMenuActive("/usersettings", "/users")).toBe(false);
  });

  it("does NOT match /dashboarding for /dashboard (false positive guard)", () => {
    expect(isMenuActive("/dashboarding", "/dashboard")).toBe(false);
  });
});
