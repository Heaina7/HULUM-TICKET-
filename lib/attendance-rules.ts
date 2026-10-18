/**
 * Kiosk check-in / check-out rules, kept free of React and Supabase so the
 * exact same checks run in the browser (to disable buttons) and on the server
 * (the real gate — a button being disabled never stops a direct request).
 */

import { anyShiftActive, type ShiftLike } from "@/lib/shifts";

export type KioskAttendanceType = "in" | "out";

export interface CheckAttendanceInput {
  type: KioskAttendanceType;
  /** This employee's records for the current Ethiopian date (pending or approved). */
  todayRecords: { type: string; status?: string }[];
  /** All shifts configured for the branch. */
  shifts: ShiftLike[];
  /** Branch wall-clock time — see zonedNow() in lib/time.ts. */
  now: Date;
}

/** Returns a user-facing reason the request must be refused, or null when it is allowed. */
export function checkAttendanceRules({
  type,
  todayRecords,
  shifts,
  now,
}: CheckAttendanceInput): string | null {
  const hasIn = todayRecords.some((r) => r.type === "in");
  const hasOut = todayRecords.some((r) => r.type === "out");
  // "done" = approved by a branch admin. A pending check-in doesn't count yet.
  const hasApprovedIn = todayRecords.some((r) => r.type === "in" && r.status === "done");

  if (type === "in") {
    if (hasIn) return "You have already checked in today.";
    if (shifts.length === 0) return "No shifts are set up for this branch yet.";
    if (!anyShiftActive(shifts, now)) return "Check-in is closed — no shift is open right now.";
    return null;
  }

  if (!hasIn) return "You haven't checked in today, so you can't check out.";
  if (hasOut) return "You have already checked out today.";
  if (!hasApprovedIn) {
    return "Your check-in is still waiting for approval. You can check out once it has been approved.";
  }
  return null;
}
