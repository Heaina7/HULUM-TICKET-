"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";

export interface ActionResult {
  error: string | null;
}

async function assertBranchAccess(branchId: number) {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin" && profile.branch_id !== branchId) {
    throw new Error("You don't have access to this branch.");
  }
}

export async function createEmployeeAction(input: {
  branchId: number;
  name: string;
  position: string;
}): Promise<ActionResult> {
  await assertBranchAccess(input.branchId);

  if (!input.name.trim()) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert({
    branch_id: input.branchId,
    name: input.name.trim(),
    position: input.position.trim() || "Staff",
  });

  if (error) return { error: "Couldn't add employee." };

  revalidatePath("/employees");
  return { error: null };
}

export async function updateEmployeeAction(input: {
  id: number;
  branchId: number;
  name: string;
  position: string;
}): Promise<ActionResult> {
  await assertBranchAccess(input.branchId);

  if (!input.name.trim()) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ name: input.name.trim(), position: input.position.trim() || "Staff" })
    .eq("id", input.id);

  if (error) return { error: "Couldn't update employee." };

  revalidatePath("/employees");
  revalidatePath("/attendance");
  return { error: null };
}

export async function setEmployeeActiveAction(
  id: number,
  branchId: number,
  active: boolean
): Promise<ActionResult> {
  await assertBranchAccess(branchId);

  const supabase = await createClient();
  const { error } = await supabase.from("employees").update({ active }).eq("id", id);

  if (error) return { error: "Couldn't update employee status." };

  revalidatePath("/employees");
  revalidatePath("/attendance");
  return { error: null };
}
