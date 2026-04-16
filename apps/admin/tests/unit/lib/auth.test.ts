/**
 * Auth.js v5 설정 — signIn 콜백, callbackUrl 처리 등 순수 로직 테스트.
 * Auth.js 내부 구현은 mock으로 대체한다.
 */
import { getCallbackUrl } from "@/lib/auth-utils";

describe("getCallbackUrl", () => {
  describe("callbackUrl 검증 — Open Redirect 방지", () => {
    it("상대 경로는 그대로 반환한다", () => {
      expect(getCallbackUrl("/dashboard")).toBe("/dashboard");
    });

    it("외부 URL(http/https)이면 /dashboard로 폴백", () => {
      expect(getCallbackUrl("https://evil.com")).toBe("/dashboard");
    });

    it("외부 URL(프로토콜 상대)이면 /dashboard로 폴백", () => {
      expect(getCallbackUrl("//evil.com")).toBe("/dashboard");
    });

    it("callbackUrl이 없으면 /dashboard 반환", () => {
      expect(getCallbackUrl(undefined)).toBe("/dashboard");
    });

    it("callbackUrl이 빈 문자열이면 /dashboard 반환", () => {
      expect(getCallbackUrl("")).toBe("/dashboard");
    });
  });
});
