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
