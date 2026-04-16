import {
  LayoutDashboard,
  Users,
  LineChart,
  Settings,
  FileText,
} from "lucide-react";
import type { ComponentType } from "react";

export interface MenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Analytics", href: "/analytics", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Reports", href: "/reports", icon: FileText },
];
