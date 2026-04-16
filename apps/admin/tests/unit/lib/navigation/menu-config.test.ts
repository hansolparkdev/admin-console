import { describe, it, expect } from "vitest";
import { menuItems } from "@/lib/navigation/menu-config";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

describe("menuItems", () => {
  it("exports exactly 2 nav entries", () => {
    expect(menuItems).toHaveLength(2);
  });

  it("first entry is 대시보드 → /dashboard with LayoutDashboard icon", () => {
    expect(menuItems[0]).toMatchObject({
      label: "대시보드",
      href: "/dashboard",
    });
    expect(menuItems[0]?.icon).toBe(LayoutDashboard);
  });

  it("second entry is 관리자 관리 → /admins with ShieldCheck icon", () => {
    expect(menuItems[1]).toMatchObject({
      label: "관리자 관리",
      href: "/admins",
    });
    expect(menuItems[1]?.icon).toBe(ShieldCheck);
  });

  it("each entry has label, href, icon", () => {
    for (const item of menuItems) {
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("href");
      expect(item.icon).toBeDefined();
    }
  });

  it("does NOT contain /users href", () => {
    expect(menuItems.map((m) => m.href)).not.toContain("/users");
  });

  it("does NOT contain /analytics href", () => {
    expect(menuItems.map((m) => m.href)).not.toContain("/analytics");
  });

  it("does NOT contain /settings href", () => {
    expect(menuItems.map((m) => m.href)).not.toContain("/settings");
  });

  it("does NOT contain /reports href", () => {
    expect(menuItems.map((m) => m.href)).not.toContain("/reports");
  });
});
