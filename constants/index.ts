export const ROLES = {
  SUPER_ADMIN: "super_admin",
  BRANCH_ADMIN: "branch_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ATTENDANCE_TYPE = {
  IN: "in",
  OUT: "out",
  PERMISSION: "permission",
} as const;

export type AttendanceType = (typeof ATTENDANCE_TYPE)[keyof typeof ATTENDANCE_TYPE];

export const ATTENDANCE_STATUS = {
  PENDING: "pending",
  DONE: "done",
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

/** Session refresh cadence for the kiosk, matching the original app's 20s poll. */
export const KIOSK_REFRESH_INTERVAL_MS = 20_000;

/** Fallback polling interval when a Realtime subscription can't be established. */
export const REALTIME_FALLBACK_POLL_MS = 30_000;

export const DEFAULT_GRACE_MINUTES = 120;

export const SETTINGS_KEYS = {
  CHECKOUT_ENABLED: "checkout_enabled",
} as const;
