import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];

export type Branch = Tables["branches"]["Row"];
export type BranchInsert = Tables["branches"]["Insert"];
export type BranchUpdate = Tables["branches"]["Update"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];

export type Employee = Tables["employees"]["Row"];
export type EmployeeInsert = Tables["employees"]["Insert"];
export type EmployeeUpdate = Tables["employees"]["Update"];

export type Shift = Tables["shifts"]["Row"];
export type ShiftInsert = Tables["shifts"]["Insert"];
export type ShiftUpdate = Tables["shifts"]["Update"];

export type AttendanceRecord = Tables["attendance"]["Row"];
export type AttendanceInsert = Tables["attendance"]["Insert"];

export type Setting = Tables["settings"]["Row"];
export type Holiday = Tables["holidays"]["Row"];
export type Announcement = Tables["announcements"]["Row"];
export type AuditLog = Tables["audit_logs"]["Row"];

export type UserRole = Profile["role"];

/** The authenticated staff member for the current request, joined with their profile. */
export interface CurrentUser {
  id: string;
  email: string | null;
  profile: Profile;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Roles allowed to see this item. Omit to show to every authenticated role. */
  roles?: UserRole[];
  badgeCount?: number;
}

export interface DashboardSummary {
  totalActive: number;
  present: number;
  late: number;
  onTime: number;
  pending: number;
}
