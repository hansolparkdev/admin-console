import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoginErrorBanner } from "@/features/auth/components/LoginErrorBanner";

describe("LoginErrorBanner", () => {
  describe("에러 없는 기본 상태", () => {
    it("error가 없으면 아무것도 렌더링하지 않는다", () => {
      const { container } = render(<LoginErrorBanner error={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("비인가 계정 에러", () => {
    it("unauthorized_domain 에러 코드면 접근 거절 메시지 표시", () => {
      render(<LoginErrorBanner error="unauthorized_domain" />);
      expect(screen.getByText(/접근이 거절되었습니다/)).toBeInTheDocument();
    });
  });

  describe("Google 인증 취소/실패 에러", () => {
    it("OAuthCallback 에러면 재시도 안내 메시지 표시", () => {
      render(<LoginErrorBanner error="OAuthCallback" />);
      expect(
        screen.getByText(/Google 인증 중 오류가 발생했습니다/),
      ).toBeInTheDocument();
    });

    it("OAuthSignin 에러면 재시도 안내 메시지 표시", () => {
      render(<LoginErrorBanner error="OAuthSignin" />);
      expect(
        screen.getByText(/Google 인증 중 오류가 발생했습니다/),
      ).toBeInTheDocument();
    });
  });

  describe("서버/일시 오류", () => {
    it("Configuration 에러면 일시적 오류 메시지 표시", () => {
      render(<LoginErrorBanner error="Configuration" />);
      expect(
        screen.getByText(/일시적 오류가 발생했습니다/),
      ).toBeInTheDocument();
    });

    it("알 수 없는 에러 코드면 일시적 오류 메시지 표시", () => {
      render(<LoginErrorBanner error="UnknownError" />);
      expect(
        screen.getByText(/일시적 오류가 발생했습니다/),
      ).toBeInTheDocument();
    });
  });
});
