"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ethDateStr, calcEthTime } from "@/lib/ethiopian-calendar";
import { getCurrentShift, isCheckinLate } from "@/lib/shifts";
import { checkAttendanceRules } from "@/lib/attendance-rules";
import { DEFAULT_TIMEZONE, zonedNow } from "@/lib/time";

export interface SubmitAttendanceInput {
  branchId: number;
  employeeId: number;
  employeeName: string;
  type: "in" | "out";
}

export interface SubmitAttendanceResult {
  error: string | null;
}

/**
 * Records a pending attendance request. Unlike the original app, the
 * timestamp is computed here — on the server, from the server's own clock —
 * rather than trusted from the client and merely cross-checked against a
 * server-time RPC. There's no client value to spoof in the first place.
 *
 * The clock is read in the *branch's* time zone (not the server's, which is
 * UTC on Vercel) so shift windows and the Ethiopian date/time are correct.
 *
 * The kiosk rules are enforced here, not just in the UI, because a disabled
 * button doesn't stop a direct call to this action:
 *   - check-in needs an open shift (or its grace period) and no earlier check-in today
 *   - check-out needs an *approved* check-in today and no earlier check-out today
 */
export async function submitAttendance(
  input: SubmitAttendanceInput
): Promise<SubmitAttendanceResult> {
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("timezone")
    .eq("id", input.branchId)
    .maybeSingle();

  const now = zonedNow(branch?.timezone ?? DEFAULT_TIMEZONE);
  const ethDate = ethDateStr(now);

  const [{ data: shifts }, { data: todayRecords }] = await Promise.all([
    supabase.from("shifts").select("*").eq("branch_id", input.branchId),
    supabase
      .from("attendance")
      .select("type, status")
      .eq("branch_id", input.branchId)
      .eq("employee_name", input.employeeName)
      .eq("eth_date", ethDate),
  ]);

  const ruleError = checkAttendanceRules({
    type: input.type,
    todayRecords: todayRecords ?? [],
    shifts: shifts ?? [],
    now,
  });
  if (ruleError) return { error: ruleError };

  const currentShift = getCurrentShift(shifts ?? [], now);
  const isLate = input.type === "in" && currentShift ? isCheckinLate(currentShift, now) : false;

  const { error } = await supabase.from("attendance").insert({
    branch_id: input.branchId,
    employee_id: input.employeeId,
    employee_name: input.employeeName,
    type: input.type,
    status: "pending",
    eth_date: ethDate,
    eth_time: calcEthTime(now).full,
    is_late: isLate,
  });

  if (error) {
    return { error: "Couldn't submit your request. Please try again." };
  }

  revalidatePath("/kiosk");
  return { error: null };
}
