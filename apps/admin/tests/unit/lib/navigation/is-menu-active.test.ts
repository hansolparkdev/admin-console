import { describe, it, expect } from "vitest";
import { isMenuActive } from "@/lib/navigation/is-menu-active";

describe("isMenuActive", () => {
  it("matches exact /dashboard", () => {
    expect(isMenuActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("matches /dashboard/anything (sub-path)", () => {
    expect(isMenuActive("/dashboard/anything", "/dashboard")).toBe(true);
  });

  it("matches exact /admins", () => {
    expect(isMenuActive("/admins", "/admins")).toBe(true);
  });

  it("matches /admins/123 (sub-path)", () => {
    expect(isMenuActive("/admins/123", "/admins")).toBe(true);
  });

  it("does NOT match /adminsettings for /admins (false positive guard)", () => {
    expect(isMenuActive("/adminsettings", "/admins")).toBe(false);
  });

  it("does NOT match /dashboarding for /dashboard (false positive guard)", () => {
    expect(isMenuActive("/dashboarding", "/dashboard")).toBe(false);
  });
});
