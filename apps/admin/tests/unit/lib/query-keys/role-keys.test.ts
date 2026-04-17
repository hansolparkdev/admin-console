import { describe, it, expect } from "vitest";
import { roleKeys } from "@/lib/query-keys/role-keys";

describe("roleKeys", () => {
  it("all key가 정의되어 있다", () => {
    expect(roleKeys.all).toEqual(["roles"]);
  });

  it("lists key가 all을 포함한다", () => {
    expect(roleKeys.lists()).toContain("roles");
  });

  it("detail key가 id를 포함한다", () => {
    const key = roleKeys.detail("role-1");
    expect(key).toContain("role-1");
  });
});
