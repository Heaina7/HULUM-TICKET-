/**
 * Small shared helper for parsing "HH:MM" strings, used by both
 * lib/ethiopian-calendar.ts and lib/shifts.ts. Centralized so the same
 * validation (and the same TypeScript-safe destructuring, under
 * noUncheckedIndexedAccess) doesn't get duplicated — and slightly
 * hardened over the original: out-of-range values like "99:00" are now
 * rejected as malformed rather than silently producing a nonsense result.
 */
export interface ParsedTime {
  hours: number;
  minutes: number;
}

export function parseHhMm(value: string): ParsedTime | null {
  const [hStr, mStr] = value.split(":");
  if (hStr === undefined || mStr === undefined) return null;

  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

/** Every branch defaults to Ethiopian time unless its own `timezone` says otherwise. */
export const DEFAULT_TIMEZONE = "Africa/Addis_Ababa";

/**
 * Returns a Date whose *local* getters (getHours(), getDate(), …) read the
 * wall-clock time in `timeZone`, regardless of where the code is running.
 *
 * Why this exists: Vercel's servers run in UTC, but shifts are defined in
 * local clock time (e.g. 08:00–17:00 in Addis Ababa, UTC+3). Calling
 * getHours() on a plain `new Date()` on the server would therefore be three
 * hours off. Everything downstream (getShiftStatus, calcEthTime, ethDateStr)
 * reads local getters, so handing them this Date makes them correct without
 * touching their logic. The result is only meant for reading the clock — not
 * for storing as a timestamp.
 */
export function zonedNow(timeZone: string = DEFAULT_TIMEZONE, base: Date = new Date()): Date {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(base);

    const get = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((p) => p.type === type)?.value);

    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    const second = get("second");

    if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) return base;
    return new Date(year, month - 1, day, hour, minute, second);
  } catch {
    // Unknown/invalid time zone string — fall back to the runtime's own clock.
    return base;
  }
}
