import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// next-auth/react 모킹
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

import { LoginForm } from "@/features/auth/components/LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("기본 렌더링", () => {
    it("이버로우 '로그인' 텍스트를 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(screen.getByText("로그인")).toBeInTheDocument();
    });

    it("헤드라인 '콘솔에 접속하세요' 를 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(screen.getByText("콘솔에 접속하세요")).toBeInTheDocument();
    });

    it("Google 로그인 버튼을 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(
        screen.getByRole("button", { name: /Google 계정으로 계속하기/ }),
      ).toBeInTheDocument();
    });

    it("기본 인포 박스를 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(screen.getByText(/조직 계정만 허용됩니다/)).toBeInTheDocument();
    });
  });

  describe("에러 상태 표시", () => {
    it("error prop이 있으면 LoginErrorBanner를 렌더링한다", () => {
      render(
        <LoginForm callbackUrl="/dashboard" error="unauthorized_domain" />,
      );
      expect(
        screen.getAllByText(/조직 계정만 허용됩니다/).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("Google 로그인 버튼 인터랙션", () => {
    it("버튼 클릭 시 signIn('google')을 호출한다", async () => {
      const { signIn } = await import("next-auth/react");
      const user = userEvent.setup();

      render(<LoginForm callbackUrl="/dashboard" />);

      const button = screen.getByRole("button", {
        name: /Google 계정으로 계속하기/,
      });
      await user.click(button);

      expect(signIn).toHaveBeenCalledWith("google", expect.any(Object));
    });

    it("클릭 후 버튼이 비활성화된다", async () => {
      const { signIn } = await import("next-auth/react");
      // signIn이 resolve하지 않도록 pending 상태 유지
      vi.mocked(signIn).mockImplementation(() => new Promise(() => {}));

      const user = userEvent.setup();

      render(<LoginForm callbackUrl="/dashboard" />);

      const button = screen.getByRole("button", {
        name: /Google 계정으로 계속하기/,
      });
      await user.click(button);

      expect(button).toBeDisabled();
    });
  });

  describe("법적 고지·푸터", () => {
    it("이용 약관 텍스트를 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(screen.getByText(/이용 약관에 동의/)).toBeInTheDocument();
    });

    it("버전 배지를 렌더링한다", () => {
      render(<LoginForm callbackUrl="/dashboard" />);
      expect(screen.getByText(/v1\.0/)).toBeInTheDocument();
    });
  });
});
