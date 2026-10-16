"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ethDateStr, calcEthTime } from "@/lib/ethiopian-calendar";
import { getCurrentShift, isCheckinLate } from "@/lib/shifts";

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
 */
export async function submitAttendance(
  input: SubmitAttendanceInput
): Promise<SubmitAttendanceResult> {
  const supabase = await createClient();
  const now = new Date();

  const { data: shifts } = await supabase
    .from("shifts")
    .select("*")
    .eq("branch_id", input.branchId);

  const currentShift = getCurrentShift(shifts ?? [], now);
  const isLate = input.type === "in" && currentShift ? isCheckinLate(currentShift, now) : false;

  const { error } = await supabase.from("attendance").insert({
    branch_id: input.branchId,
    employee_id: input.employeeId,
    employee_name: input.employeeName,
    type: input.type,
    status: "pending",
    eth_date: ethDateStr(now),
    eth_time: calcEthTime(now).full,
    is_late: isLate,
  });

  if (error) {
    return { error: "Couldn't submit your request. Please try again." };
  }

  revalidatePath("/kiosk");
  return { error: null };
}
