/**
 * Shift status, grace-period and lateness logic.
 * Ported directly from the original vanilla-JS app's js/shifts.js — the
 * grace-period math (including overnight-shift midnight rollover) is
 * exactly what decided "on time" vs "late" for real attendance records, so
 * it must keep producing identical answers for identical inputs.
 */

import { parseHhMm } from "@/lib/time";

export type ShiftStatus = "open" | "late" | "closed";

export interface ShiftLike {
  start_time: string | null;
  end_time: string | null;
  grace_minutes?: number | null;
}

function parseMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const parsed = parseHhMm(timeStr);
  if (!parsed) return null;
  return parsed.hours * 60 + parsed.minutes;
}

/**
 * Whether a shift is currently open for check-in, within its late-arrival
 * grace period, or closed. Supports overnight shifts (e.g. 22:00–06:00).
 */
export function getShiftStatus(shift: ShiftLike, nowDate?: Date): ShiftStatus {
  const d = nowDate ?? new Date();
  const nowMinutes = d.getHours() * 60 + d.getMinutes(); // 0–1439
  const start = parseMinutes(shift.start_time);
  const end = parseMinutes(shift.end_time);
  const grace = shift.grace_minutes ?? 120;

  if (start === null || end === null) return "closed";

  const isOvernight = end < start;

  let inWindow: boolean;
  let inGrace: boolean;

  if (!isOvernight) {
    // Normal shift:  start ──── end ──── end+grace
    inWindow = nowMinutes >= start && nowMinutes < end;
    inGrace = nowMinutes >= end && nowMinutes < Math.min(end + grace, 1440);
  } else {
    // Overnight shift: start ──── midnight(0) ──── end ──── end+grace
    const graceEnd = end + grace; // may exceed 1440
    inWindow = nowMinutes >= start || nowMinutes < end;
    if (graceEnd <= 1440) {
      inGrace = nowMinutes >= end && nowMinutes < graceEnd;
    } else {
      // grace window itself wraps past midnight
      inGrace = (nowMinutes >= end && nowMinutes < 1440) || nowMinutes < graceEnd - 1440;
    }
  }

  if (inWindow) return "open";
  if (inGrace) return "late";
  return "closed";
}

export function isShiftActive(shift: ShiftLike, nowDate?: Date): boolean {
  return getShiftStatus(shift, nowDate) !== "closed";
}

export function anyShiftActive(shifts: ShiftLike[] | null | undefined, nowDate?: Date): boolean {
  return (shifts ?? []).some((s) => isShiftActive(s, nowDate));
}

export function isCheckinLate(shift: ShiftLike, nowDate?: Date): boolean {
  return getShiftStatus(shift, nowDate) === "late";
}

export function getCurrentShift<T extends ShiftLike>(
  shifts: T[] | null | undefined,
  nowDate?: Date
): T | null {
  return (shifts ?? []).find((s) => isShiftActive(s, nowDate)) ?? null;
}

/** Amharic time-of-day label -> Gregorian-hour offset function, used to recover minutes-since-midnight from a legacy eth_time string. */
const TIME_OF_DAY_TO_GREGORIAN_HOUR: Record<string, (h: number) => number> = {
  ምሽት: (h) => (h === 12 ? 18 : h + 18),
  ሌሊት: (h) => h - 6,
  ጠዋት: (h) => (h === 12 ? 6 : h + 6),
  ከሰዓት: (h) => h + 6,
};

/**
 * Recovers "how many minutes late" from a legacy `eth_time` string
 * (e.g. "ጠዋት 02:15") for records that predate storing a plain Gregorian
 * timestamp. Kept for backward compatibility with existing attendance rows.
 */
export function getLateMinutesFromEth(
  ethTime: string | null | undefined,
  shift: ShiftLike | null | undefined
): number | null {
  if (!ethTime || !shift) return null;
  const parts = ethTime.trim().split(" ");
  if (parts.length < 2) return null;

  const tod = parts[0];
  const [ethHourStr, minuteStr] = (parts[1] ?? "").split(":");
  const ethHour = Number(ethHourStr);
  const minute = Number(minuteStr);
  if (!tod || Number.isNaN(ethHour) || Number.isNaN(minute)) return null;

  const toGregorianHour = TIME_OF_DAY_TO_GREGORIAN_HOUR[tod];
  if (!toGregorianHour) return null;

  const gregorianMinutes = toGregorianHour(ethHour) * 60 + minute;
  const end = parseMinutes(shift.end_time);
  if (end === null) return null;

  return gregorianMinutes > end ? gregorianMinutes - end : null;
}

/** 75 -> "+1h15m", 40 -> "+40m" */
export function formatLateMinutes(mins: number | null | undefined): string | null {
  if (!mins || mins <= 0) return null;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `+${h}h${m > 0 ? `${m}m` : ""}`;
  }
  return `+${mins}m`;
}
