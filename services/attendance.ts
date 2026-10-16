import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord } from "@/types";

/**
 * Attendance rows for one branch in one Ethiopian month. eth_date is stored
 * as "<Day> <Month> <Year>", so a suffix match on " <Month> <Year>" is an
 * exact month filter (day is always 1–30, so it never collides with the
 * month/year that follow it).
 */
export async function getAttendanceForMonth(
  branchId: number,
  month: string,
  year: number
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("branch_id", branchId)
    .like("eth_date", `%${month} ${year}`)
    .order("created_at");

  if (error) throw new Error(`Failed to load attendance: ${error.message}`);
  return data;
}
