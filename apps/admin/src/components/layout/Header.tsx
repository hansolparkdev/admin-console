"use client";

// TODO(google-oidc-login): 세션 기반 사용자 정보로 교체

import Link from "next/link";
import { Bell, Sun } from "lucide-react";
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
        zIndex: 50,
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

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Theme toggle — noop, ARIA 1.2: aria-pressed 없음 */}
        <button
          type="button"
          aria-label="테마 전환"
          onClick={() => {}}
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
          className="hover:bg-[var(--header-button-hover-bg)] focus-visible:outline-none focus-visible:ring-2"
        >
          <Sun size={20} aria-hidden="true" />
        </button>

        {/* Notification */}
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
          className="hover:bg-[var(--header-button-hover-bg)] focus-visible:outline-none focus-visible:ring-2"
        >
          <Bell size={20} aria-hidden="true" />
          {/* Unread dot */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--destructive)",
              boxShadow: "0 0 0 2px var(--notification-dot-ring)",
            }}
          />
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

        {/* Profile link */}
        <Link
          href="/admins"
          aria-label="프로필"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "var(--on-surface)",
          }}
          className="focus-visible:outline-none focus-visible:ring-2 rounded-full"
        >
          {/* Avatar circle placeholder */}
          <div
            aria-hidden="true"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "var(--sidebar-avatar-bg)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--on-surface)",
            }}
          >
            Admin_User
          </span>
        </Link>
      </div>
    </header>
  );
}
