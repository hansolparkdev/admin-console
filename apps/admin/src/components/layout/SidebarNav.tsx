"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/lib/navigation/menu-config";
import { isMenuActive } from "@/lib/navigation/is-menu-active";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="사이드바 주 메뉴"
      style={{
        flex: 1,
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <ul
        style={{ display: "flex", flexDirection: "column", gap: "4px" }}
        role="list"
      >
        {menuItems.map((item) => {
          const active = isMenuActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                  paddingTop: "12px",
                  paddingBottom: "12px",
                  fontFamily: "var(--font-heading), Manrope, sans-serif",
                  fontWeight: 500,
                  fontSize: "14px",
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                  transition: "background-color 200ms, color 200ms",
                  backgroundColor: active
                    ? "var(--sidebar-accent)"
                    : "transparent",
                  color: active
                    ? "var(--sidebar-accent-foreground)"
                    : "var(--sidebar-muted-foreground)",
                }}
                className="focus-visible:outline-none focus-visible:ring-2 hover:bg-[var(--sidebar-muted)] hover:text-white"
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
                {active ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: "4px",
                      backgroundColor: "var(--sidebar-primary)",
                    }}
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
