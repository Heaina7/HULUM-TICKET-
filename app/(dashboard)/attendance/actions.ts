"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";

export interface ActionResult {
  error: string | null;
}

export async function deleteAttendanceRecord(
  attendanceId: number,
  branchId: number
): Promise<ActionResult> {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin" && profile.branch_id !== branchId) {
    return { error: "You don't have access to this branch." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("attendance").delete().eq("id", attendanceId);

  if (error) return { error: "Couldn't delete this record." };

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { error: null };
}
