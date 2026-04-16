// TODO(google-oidc-login): 세션 프로필로 교체

export function SidebarUserFooter() {
  return (
    <div style={{ marginTop: "auto", padding: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "var(--sidebar-footer-bg)",
        }}
      >
        {/* Avatar circle placeholder — <img> 없음, google-oidc-login 슬라이스에서 교체 */}
        <div
          aria-hidden="true"
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: "var(--sidebar-avatar-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Name and role */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--primary-fixed)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            최고 관리자
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--sidebar-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Admin_User
          </span>
          <span
            data-testid="user-email"
            style={{
              fontSize: "10px",
              color: "var(--sidebar-muted-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            super-admin@system.com
          </span>
        </div>
      </div>
    </div>
  );
}
