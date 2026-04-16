import Link from "next/link";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";

export function Sidebar() {
  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "var(--sidebar-width)",
        height: "100vh",
        backgroundColor: "var(--sidebar)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Wordmark block — ADMIN CONSOLE */}
      <Link
        href="/dashboard"
        aria-label="ADMIN CONSOLE 홈"
        style={{
          display: "block",
          paddingLeft: "32px",
          paddingRight: "32px",
          paddingTop: "40px",
          paddingBottom: "40px",
          textDecoration: "none",
        }}
        className="focus-visible:outline-none focus-visible:ring-2"
      >
        <h2
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-heading), Manrope, sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--sidebar-foreground)",
            margin: 0,
          }}
        >
          ADMIN CONSOLE
        </h2>
        <p
          aria-hidden="true"
          style={{
            display: "block",
            marginTop: "4px",
            fontFamily: "var(--font-sans), Inter, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            letterSpacing: "0.1em",
            color: "var(--sidebar-subtle)",
            margin: 0,
          }}
        >
          Admin Console System
        </p>
      </Link>

      {/* Navigation menu — grows to fill space */}
      <SidebarNav />

      {/* User footer */}
      <SidebarUserFooter />
    </aside>
  );
}
