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
        {/* Avatar circle (placeholder — 로그인 슬라이스 병합 시 실제 사진으로 교체) */}
        <div
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: "var(--sidebar-muted)",
            color: "var(--sidebar-foreground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
          }}
          aria-hidden="true"
        >
          A
        </div>

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
            data-testid="user-name"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--sidebar-foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Admin User
          </span>
          <span
            data-testid="user-role"
            style={{
              fontSize: "12px",
              color: "var(--sidebar-subtle)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Administrator
          </span>
        </div>
      </div>
    </div>
  );
}
