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
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Wordmark block — Stitch: THE LENS + Admin Console sub */}
      <Link
        href="/dashboard"
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
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-heading), Manrope, sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--sidebar-foreground)",
          }}
        >
          The Lens
        </span>
        <span
          style={{
            display: "block",
            marginTop: "4px",
            fontFamily: "var(--font-sans), Inter, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            letterSpacing: "0.1em",
            color: "var(--sidebar-subtle)",
          }}
        >
          Admin Console
        </span>
      </Link>

      {/* Navigation menu — grows to fill space */}
      <SidebarNav />

      {/* User footer */}
      <SidebarUserFooter />
    </aside>
  );
}
