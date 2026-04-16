import { Bell, HelpCircle } from "lucide-react";
import { SearchInput } from "@/components/layout/SearchInput";

export function Header() {
  return (
    <header
      role="banner"
      style={{
        position: "fixed",
        top: 0,
        left: "var(--sidebar-width)",
        right: 0,
        height: "var(--header-height)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "32px",
        paddingRight: "32px",
        backgroundColor: "var(--header-glass-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "var(--header-shadow)",
      }}
    >
      {/* Left: search */}
      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
        <SearchInput />
      </div>

      {/* Right: actions + brand badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          aria-label="알림"
          style={{
            position: "relative",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            color: "var(--on-surface-variant)",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
          className="hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2"
        >
          <Bell size={20} aria-hidden="true" />
          {/* Unread dot — Stitch: red dot ring-2 with white ring */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 0 2px var(--notification-dot-ring)",
            }}
          />
        </button>

        <button
          type="button"
          aria-label="도움말"
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            color: "var(--on-surface-variant)",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
          className="hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2"
        >
          <HelpCircle size={20} aria-hidden="true" />
        </button>

        {/* Vertical divider */}
        <span
          aria-hidden="true"
          style={{
            height: "32px",
            width: "1px",
            backgroundColor: "var(--header-divider)",
            marginLeft: "8px",
            marginRight: "8px",
          }}
        />

        {/* Brand badge — Stitch: "The Executive Lens" Manrope bold */}
        <span
          style={{
            fontFamily: "var(--font-heading), Manrope, sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--on-surface)",
            letterSpacing: "-0.01em",
          }}
        >
          The Executive Lens
        </span>
      </div>
    </header>
  );
}
