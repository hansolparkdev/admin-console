import { parseAuthError } from "@/features/auth/parse-auth-error";

describe("parseAuthError", () => {
  it("error=pending_approval → { type: 'pending_approval' }", () => {
    const result = parseAuthError("pending_approval", undefined);
    expect(result).toEqual({ type: "pending_approval" });
  });

  it("error=rejected → { type: 'rejected' }", () => {
    const result = parseAuthError("rejected", undefined);
    expect(result).toEqual({ type: "rejected" });
  });

  it("error=Configuration → { type: 'unknown', code: 'Configuration' }", () => {
    const result = parseAuthError("Configuration", undefined);
    expect(result).toEqual({ type: "unknown", code: "Configuration" });
  });

  it("error=undefined → null", () => {
    const result = parseAuthError(undefined, undefined);
    expect(result).toBeNull();
  });

  it("error 없음 → null", () => {
    const result = parseAuthError(undefined, undefined);
    expect(result).toBeNull();
  });
});
