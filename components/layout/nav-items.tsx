import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  InboxIcon,
  CalendarCheckIcon,
  UsersIcon,
  Building2Icon,
  ShieldCheckIcon,
  SettingsIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Omit to show to every authenticated role. */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Requests", href: "/requests", icon: InboxIcon, roles: ["branch_admin"] },
  { label: "Attendance", href: "/attendance", icon: CalendarCheckIcon },
  { label: "Employees", href: "/employees", icon: UsersIcon },
  { label: "Branches", href: "/branches", icon: Building2Icon, roles: ["super_admin"] },
  { label: "Admins", href: "/admins", icon: ShieldCheckIcon, roles: ["super_admin"] },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export function navItemsForRole(role: UserRole): NavEntry[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
