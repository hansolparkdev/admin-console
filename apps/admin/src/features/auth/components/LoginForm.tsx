"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LoginErrorBanner } from "./LoginErrorBanner";

export interface LoginFormProps {
  /** Auth.js callbackUrl — 로그인 성공 후 이동할 경로 */
  callbackUrl?: string;
  /** 콜백 에러 코드 (?error=<code>) */
  error?: string;
}

/**
 * 로그인 카드 클라이언트 컴포넌트.
 * 우 패널(45%)에 배치된다. 좌 패널은 page.tsx(서버 컴포넌트)에서 구성.
 *
 * UX 포인트:
 * - 이버로우 "로그인" + 헤드라인 "콘솔에 접속하세요" + 서브카피
 * - Google 로그인 버튼: 클릭 시 비활성·로딩 표시
 * - 인포 박스: 기본 상태 / 에러 배너
 * - 법적 고지 + 푸터 링크 + 버전 배지
 */
export function LoginForm({
  callbackUrl = "/dashboard",
  error,
}: LoginFormProps) {
  const [isPending, setIsPending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setIsPending(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "400px",
        gap: "0",
      }}
    >
      {/* 이버로우 */}
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--primary, #0057ff)",
          marginBottom: "8px",
        }}
      >
        로그인
      </p>

      {/* 헤드라인 */}
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "8px",
          lineHeight: "1.2",
        }}
      >
        콘솔에 접속하세요
      </h1>

      {/* 서브카피 */}
      <p
        style={{
          fontSize: "14px",
          color: "#64748b",
          marginBottom: "32px",
          lineHeight: "1.6",
        }}
      >
        조직 Google 계정으로 안전하게 로그인합니다.
      </p>

      {/* 에러 배너 */}
      <LoginErrorBanner error={error} />

      {/* Google 로그인 버튼 */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isPending}
        aria-label="Google 계정으로 계속하기"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          width: "100%",
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          background: isPending
            ? "linear-gradient(135deg, #0048c1, #0033a0)"
            : "linear-gradient(135deg, #0057ff, #0048c1)",
          color: "#fff",
          fontSize: "15px",
          fontWeight: 600,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          transition: "all 0.2s ease",
          marginBottom: "20px",
        }}
      >
        {isPending ? (
          <>
            <span
              aria-hidden="true"
              style={{
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
              }}
            />
            로그인 중...
          </>
        ) : (
          <>
            {/* Google G 로고 SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                fill="#4285F4"
              />
              <path
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                fill="#34A853"
              />
              <path
                d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"
                fill="#FBBC05"
              />
              <path
                d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                fill="#EA4335"
              />
            </svg>
            Google 계정으로 계속하기
          </>
        )}
      </button>

      {/* 인포 박스 */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "8px",
          backgroundColor: "rgba(0, 87, 255, 0.05)",
          border: "1px solid rgba(0, 87, 255, 0.15)",
          fontSize: "13px",
          color: "#475569",
          lineHeight: "1.5",
          marginBottom: "24px",
        }}
      >
        조직 계정만 허용됩니다. 개인 Gmail 계정은 거부됩니다.
      </div>

      {/* 구분선 */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e2e8f0",
          marginBottom: "16px",
        }}
      />

      {/* 법적 고지 */}
      <p
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          textAlign: "center",
          lineHeight: "1.6",
          marginBottom: "16px",
        }}
      >
        계속 진행하면{" "}
        <a
          href="/terms"
          style={{ color: "#64748b", textDecoration: "underline" }}
          className="hover:text-[var(--primary,#0057ff)]"
        >
          이용 약관에 동의
        </a>
        하는 것으로 간주됩니다.
      </p>

      {/* 푸터 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href="/status"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            상태
          </a>
          <span aria-hidden="true">·</span>
          <a href="/help" style={{ color: "inherit", textDecoration: "none" }}>
            도움말
          </a>
        </div>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: "#f1f5f9",
            color: "#64748b",
          }}
        >
          v1.0
        </span>
      </div>
    </div>
  );
}
