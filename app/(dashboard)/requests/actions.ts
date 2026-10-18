"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";
import { ethDateStr } from "@/lib/ethiopian-calendar";

export interface ActionResult {
  error: string | null;
  /** True when the request was no longer pending (already approved/rejected) — the UI should drop it. */
  alreadyHandled?: boolean;
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

  // Only a still-pending request can be approved. Filtering on status (and the
  // branch) in the query itself makes this atomic: a double click, a second
  // admin, or a stale screen can't act on a record that was already handled.
  const { data, error } = await supabase
    .from("attendance")
    .update({ status: "done" })
    .eq("id", attendanceId)
    .eq("branch_id", branchId)
    .eq("status", "pending")
    .select("id");

  if (error) return { error: "Couldn't approve this request." };
  if (!data || data.length === 0) {
    return { error: "This request was already handled.", alreadyHandled: true };
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { error: null };
}
