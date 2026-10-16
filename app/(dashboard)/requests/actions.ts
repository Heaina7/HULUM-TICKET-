"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";
import { ethDateStr } from "@/lib/ethiopian-calendar";

export interface ActionResult {
  error: string | null;
}

async function assertBranchAccess(branchId: number) {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin" && profile.branch_id !== branchId) {
    throw new Error("You don't have access to this branch.");
  }
}

export async function approveAttendance(attendanceId: number, branchId: number): Promise<ActionResult> {
  await assertBranchAccess(branchId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("attendance")
    .update({ status: "done" })
    .eq("id", attendanceId);

  if (error) return { error: "Couldn't approve this request." };

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { error: null };
}

export async function rejectAttendance(attendanceId: number, branchId: number): Promise<ActionResult> {
  await assertBranchAccess(branchId);
  const supabase = await createClient();

  const { error } = await supabase.from("attendance").delete().eq("id", attendanceId);

  if (error) return { error: "Couldn't reject this request." };

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function grantPermission(input: {
  branchId: number;
  employeeId: number;
  employeeName: string;
  note?: string;
}): Promise<ActionResult> {
  await assertBranchAccess(input.branchId);
  const supabase = await createClient();

  const { error } = await supabase.from("attendance").insert({
    branch_id: input.branchId,
    employee_id: input.employeeId,
    employee_name: input.employeeName,
    type: "permission",
    status: "done",
    eth_date: ethDateStr(new Date()),
    note: input.note || null,
  });

  if (error) return { error: "Couldn't grant permission." };

  revalidatePath("/requests");
  revalidatePath("/attendance");
  return { error: null };
}
