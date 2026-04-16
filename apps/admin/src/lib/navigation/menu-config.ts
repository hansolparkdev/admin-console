import { LayoutDashboard, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const menuItems: MenuItem[] = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "관리자 관리", href: "/admins", icon: ShieldCheck },
];
