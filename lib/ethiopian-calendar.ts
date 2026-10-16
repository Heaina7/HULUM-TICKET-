/**
 * Ethiopian calendar + Ethiopian time-of-day utilities.
 *
 * Ported directly from the original vanilla-JS app's js/utils.js. The
 * arithmetic is preserved exactly (including the day-count anchor and the
 * Gregorian-hour-bucket lookup for time-of-day labels) — this is
 * business-critical, user-facing logic, so it is not "cleaned up" or
 * rewritten, only typed and re-organized.
 */

import { parseHhMm } from "@/lib/time";

export const ETHIOPIAN_MONTHS = [
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
] as const;

export type EthiopianMonth = (typeof ETHIOPIAN_MONTHS)[number];

export const ETHIOPIAN_DAYS = ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"] as const;

export interface EthiopianDate {
  year: number;
  day: number;
  month: EthiopianMonth;
  dow: string;
}

export interface EthiopianTime {
  /** Time-of-day label: ሌሊት (night) / ጠዋት (morning) / ከሰዓት (afternoon) / ምሽት (evening) */
  tod: string;
  /** "HH:MM" in the Ethiopian 12-hour numbering */
  hm: string;
  /** Seconds, zero-padded */
  sec: string;
  /** "<tod> HH:MM" */
  full: string;
}

/** Time-of-day label, indexed by the *Gregorian* hour (0–23) — matches the original exactly. */
const TIME_OF_DAY_BY_GREGORIAN_HOUR = [
  "ሌሊት", "ሌሊት", "ሌሊት", "ሌሊት", "ሌሊት", "ሌሊት", // Greg 00–05
  "ጠዋት", "ጠዋት", "ጠዋት", "ጠዋት", "ጠዋት", "ጠዋት", // Greg 06–11
  "ከሰዓት", "ከሰዓት", "ከሰዓት", "ከሰዓት", "ከሰዓት", "ከሰዓት", // Greg 12–17
  "ምሽት", "ምሽት", "ምሽት", "ምሽት", "ምሽት", "ምሽት", // Greg 18–23
] as const;

const zeroPad = (n: number): string => String(n).padStart(2, "0");

/** Converts a Gregorian Date into its Ethiopian calendar equivalent. */
export function calcEthDate(d: Date): EthiopianDate {
  const anchor = new Date(2000, 0, 1);
  const diffDays = Math.floor((d.getTime() - anchor.getTime()) / 86_400_000);

  let t = 1992 * 365 + Math.floor(1992 / 4) + 3 * 30 + 21 + diffDays;

  const fourYearCycles = Math.floor(t / (365 * 4 + 1));
  let rem = t % (365 * 4 + 1);

  const yearsIntoCycle = Math.min(Math.floor(rem / 365), 3);
  const ethYear = fourYearCycles * 4 + yearsIntoCycle;
  rem -= yearsIntoCycle * 365;

  const monthIndex = Math.min(Math.floor(rem / 30), 12);
  const day = Math.min((rem % 30) + 1, 30);

  return {
    year: ethYear,
    day,
    // monthIndex (0–12) and d.getDay() (0–6) are always in range for these
    // 13- and 7-element tuples by construction (see the clamps above) — the
    // fallback here satisfies noUncheckedIndexedAccess without an unsafe
    // cast, and is never actually reached for a real Date input.
    month: ETHIOPIAN_MONTHS[monthIndex] ?? ETHIOPIAN_MONTHS[12],
    dow: ETHIOPIAN_DAYS[d.getDay()] ?? ETHIOPIAN_DAYS[0],
  };
}

/** Converts a Gregorian Date into Ethiopian time-of-day + 12-hour clock. */
export function calcEthTime(d: Date): EthiopianTime {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();

  const eth24 = (h + 6) % 24;
  let ethHour = eth24 % 12;
  if (ethHour === 0) ethHour = 12;

  // d.getHours() is always 0–23 by Date's own contract, always in range for
  // this 24-element tuple; the fallback exists only to satisfy
  // noUncheckedIndexedAccess, not because it can actually be reached.
  const tod = TIME_OF_DAY_BY_GREGORIAN_HOUR[h] ?? TIME_OF_DAY_BY_GREGORIAN_HOUR[0];
  const hm = `${zeroPad(ethHour)}:${zeroPad(m)}`;

  return { tod, hm, sec: zeroPad(s), full: `${tod} ${hm}` };
}

/** "21 ታህሳስ 1992" style full date string for a given Gregorian Date. */
export function ethDateStr(d: Date): string {
  const e = calcEthDate(d);
  return `${e.day} ${e.month} ${e.year}`;
}

/** Today's Ethiopian date string. */
export function todayEth(): string {
  return ethDateStr(new Date());
}

/** Extracts "<Month> <Year>" from a full "<Day> <Month> <Year>" Ethiopian date string. */
export function monthOf(ethDate: string | null | undefined): string {
  if (!ethDate) return "";
  const parts = ethDate.split(" ");
  return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : ethDate;
}

/** "14:05" -> "2:05 PM" */
export function fmtGregTime(t: string | null | undefined): string {
  if (!t) return "--:--";
  const parsed = parseHhMm(t);
  if (!parsed) return "--:--";
  const { hours, minutes } = parsed;
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${zeroPad(minutes)} ${ampm}`;
}

/** "07:15" (Gregorian 24h) -> "ጠዋት 01:15" (Ethiopian time-of-day + 12h clock) */
export function gregTimeToEth(timeStr: string | null | undefined): string {
  if (!timeStr) return "--";
  const parsed = parseHhMm(timeStr);
  if (!parsed) return "--";
  const { hours, minutes } = parsed;
  const eth24 = (hours + 6) % 24;
  let ethHour = eth24 % 12;
  if (ethHour === 0) ethHour = 12;
  // hours is validated to 0–23 by parseHhMm, always in range for this
  // 24-element tuple; the fallback exists only to satisfy
  // noUncheckedIndexedAccess, not because it can actually be reached.
  const tod = TIME_OF_DAY_BY_GREGORIAN_HOUR[hours] ?? TIME_OF_DAY_BY_GREGORIAN_HOUR[0];
  return `${tod} ${zeroPad(ethHour)}:${zeroPad(minutes)}`;
}

/**
 * All "<Day> <Month> <Year>" strings for an Ethiopian month, e.g.
 * generateMonthDates("ታህሳስ 2017") -> ["1 ታህሳስ 2017", "2 ታህሳስ 2017", ...].
 * Used to build the attendance grid's column headers.
 */
export function generateMonthDates(monthStr: string | null | undefined): string[] {
  if (!monthStr) return [];
  const [monthName, yearStr] = monthStr.split(" ");
  const year = parseInt(yearStr ?? "", 10);
  const monthIndex = ETHIOPIAN_MONTHS.indexOf(monthName as (typeof ETHIOPIAN_MONTHS)[number]);
  if (monthIndex === -1) return [];

  // ጳጉሜ (Pagume, month index 12) has 5 days, or 6 in an Ethiopian leap year.
  const daysInMonth = monthIndex < 12 ? 30 : year % 4 === 3 ? 6 : 5;

  const dates: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(`${day} ${monthName} ${year}`);
  }
  return dates;
}

/**
 * Approximate Ethiopian-date -> Gregorian ISO date ("YYYY-MM-DD") conversion.
 *
 * Ported as-is from the original, including its known limitation: it
 * anchors every Ethiopian year to September 11 for the *same* numeric year
 * value passed in, rather than resolving the actual ~7–8 year Gregorian
 * offset, and doesn't account for the Sep 11 vs Sep 12 New Year shift that
 * happens around Gregorian leap years. Treat this as a rough estimate for
 * display, not an authoritative conversion — the original code's own
 * comment called it "ግምታዊ" (approximate) for the same reason.
 */
export function ethDateToGreg(ethDateStr: string | null | undefined): string | null {
  if (!ethDateStr) return null;
  const parts = ethDateStr.split(" ");
  if (parts.length < 3) return null;

  const day = parseInt(parts[0] ?? "", 10);
  const monthName = parts[1];
  const year = parseInt(parts[2] ?? "", 10);
  const monthIndex = ETHIOPIAN_MONTHS.indexOf(monthName as (typeof ETHIOPIAN_MONTHS)[number]);
  if (monthIndex === -1 || Number.isNaN(day) || Number.isNaN(year)) return null;

  const ethNewYear = new Date(year, 8, 11); // Meskerem 1 ≈ September 11 (approximate)
  const daysFromNewYear = monthIndex * 30 + (day - 1);
  const result = new Date(ethNewYear);
  result.setDate(result.getDate() + daysFromNewYear);
  return result.toISOString().split("T")[0] ?? null;
}

/**
 * Compares two "<Day> <Month> <Year>" Ethiopian date strings chronologically. */
export function ethDateCompare(a: string | null | undefined, b: string | null | undefined): number {
  const greg = (s: string | null | undefined) => (s ? (ethDateToGreg(s) ?? "") : "");
  const ga = greg(a);
  const gb = greg(b);
  if (ga < gb) return -1;
  if (ga > gb) return 1;
  return 0;
}

export interface EthMonthOption {
  /** "<Month> <Year>", matches the format generateMonthDates() expects. */
  label: string;
  month: string;
  year: number;
}

/** A rolling list of "<Month> <Year>" options ending at the current Ethiopian month, most recent first. Used by the attendance page's month picker. */
export function getRecentEthMonths(count = 12, fromDate: Date = new Date()): EthMonthOption[] {
  const current = calcEthDate(fromDate);
  let monthIndex = ETHIOPIAN_MONTHS.indexOf(current.month);
  let year = current.year;

  const months: EthMonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const month = ETHIOPIAN_MONTHS[monthIndex];
    if (!month) break;
    months.push({ label: `${month} ${year}`, month, year });
    monthIndex -= 1;
    if (monthIndex < 0) {
      monthIndex = ETHIOPIAN_MONTHS.length - 1;
      year -= 1;
    }
  }
  return months;
}
