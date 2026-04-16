import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCallbackUrl } from "@/lib/auth-utils";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

/**
 * 로그인 화면 서버 컴포넌트.
 *
 * UX: 좌 55% 다크 패널 + 우 45% 라이트 패널 스플릿 레이아웃.
 * searchParams에서 error 코드와 callbackUrl을 읽어 LoginForm에 주입한다.
 *
 * 배치: (public)/login — Shell 미적용 공개 라우트.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const callbackUrl = getCallbackUrl(params.callbackUrl);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* 좌 패널 — 55% 다크 */}
      <div
        aria-hidden="true"
        style={{
          display: "none",
          width: "55%",
          backgroundColor: "#0f172a",
          position: "relative",
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
        }}
        className="md:flex"
      >
        {/* 우상단 블루 글로우 */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,87,255,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* 워드마크 영역 */}
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            운영 콘솔
          </p>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fff",
              lineHeight: "1.1",
            }}
          >
            ADMIN CONSOLE
          </h2>
        </div>

        {/* 저작권 */}
        <p
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          {`© ${new Date().getFullYear()} Admin Console`}
        </p>
      </div>

      {/* 우 패널 — 45% 라이트 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
          backgroundColor: "#f7f9fb",
        }}
      >
        <LoginForm callbackUrl={callbackUrl} error={error} />
      </div>
    </div>
  );
}
