import Link from "next/link";

/**
 * 403 접근 거부 페이지.
 * Shell이 얹히는 (app) 그룹 안에 위치하므로 인증된 사용자에게만 표시됨.
 */
export default function ForbiddenPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <p
        style={{
          fontSize: "72px",
          fontWeight: 700,
          color: "var(--muted-foreground)",
          lineHeight: 1,
          marginBottom: "16px",
        }}
      >
        403
      </p>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        접근 권한이 없습니다
      </h1>
      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: "14px",
          marginBottom: "32px",
          maxWidth: "360px",
        }}
      >
        이 페이지에 접근할 권한이 없습니다. 필요한 권한이 있는지 관리자에게
        문의하세요.
      </p>
      <Link
        href="/"
        style={{
          padding: "10px 24px",
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        홈으로 이동
      </Link>
    </div>
  );
}
