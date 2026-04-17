import { describe, it, expect } from "vitest";
import { menuKeys } from "@/lib/query-keys/menu-keys";

describe("menuKeys", () => {
  it("all key가 정의되어 있다", () => {
    expect(menuKeys.all).toEqual(["menus"]);
  });

  it("lists key가 all을 포함한다", () => {
    expect(menuKeys.lists()).toContain("menus");
  });

  it("detail key가 id를 포함한다", () => {
    const key = menuKeys.detail("menu-1");
    expect(key).toContain("menu-1");
  });
});
