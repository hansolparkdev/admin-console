import { describe, it, expect } from "vitest";
import { menuItems } from "@/lib/navigation/menu-config";

describe("menuItems", () => {
  it("exports Stitch's 5 nav entries in order", () => {
    expect(menuItems.map((m) => m.label)).toEqual([
      "Dashboard",
      "Users",
      "Analytics",
      "Settings",
      "Reports",
    ]);
  });

  it("each entry has label, href, icon", () => {
    for (const item of menuItems) {
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("href");
      expect(item.icon).toBeDefined();
    }
  });

  it("first entry is Dashboard → /dashboard", () => {
    expect(menuItems[0]).toMatchObject({
      label: "Dashboard",
      href: "/dashboard",
    });
  });

  it("second entry is Users → /users", () => {
    expect(menuItems[1]).toMatchObject({ label: "Users", href: "/users" });
  });
});
