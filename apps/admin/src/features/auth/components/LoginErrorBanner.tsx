/**
 * 로그인 에러 코드에 따른 사유 메시지 배너.
 * error가 없으면 아무것도 렌더링하지 않는다.
 */

export interface LoginErrorBannerProps {
  error: string | undefined;
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized_domain:
    "조직 계정만 허용됩니다. 개인 Gmail 계정으로는 로그인할 수 없습니다.",
  OAuthCallback: "Google 인증 중 오류가 발생했습니다. 다시 시도해 주세요.",
  OAuthSignin: "Google 인증 중 오류가 발생했습니다. 다시 시도해 주세요.",
};

const DEFAULT_ERROR_MESSAGE =
  "일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

export function LoginErrorBanner({ error }: LoginErrorBannerProps) {
  if (!error) return null;

  const message = ERROR_MESSAGES[error] ?? DEFAULT_ERROR_MESSAGE;

  return (
    <div
      role="alert"
      style={{
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        color: "#dc2626",
        fontSize: "14px",
        lineHeight: "1.5",
        marginBottom: "16px",
      }}
    >
      {message}
    </div>
  );
}
