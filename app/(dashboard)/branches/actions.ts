"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";

export interface ActionResult {
  error: string | null;
}

async function assertSuperAdmin() {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin") throw new Error("Super admin access required.");
}

export async function createBranchAction(input: {
  name: string;
  country: string;
  timezone: string;
}): Promise<ActionResult> {
  await assertSuperAdmin();
  if (!input.name.trim()) return { error: "Branch name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    name: input.name.trim(),
    country: input.country.trim() || null,
    timezone: input.timezone || "Africa/Addis_Ababa",
  });

  if (error) return { error: "Couldn't create branch." };

  revalidatePath("/branches");
  return { error: null };
}

export async function updateBranchAction(input: {
  id: number;
  name: string;
  country: string;
  timezone: string;
}): Promise<ActionResult> {
  await assertSuperAdmin();
  if (!input.name.trim()) return { error: "Branch name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({
      name: input.name.trim(),
      country: input.country.trim() || null,
      timezone: input.timezone || "Africa/Addis_Ababa",
    })
    .eq("id", input.id);

  if (error) return { error: "Couldn't update branch." };

  revalidatePath("/branches");
  return { error: null };
}

export async function deleteBranchAction(id: number): Promise<ActionResult> {
  await assertSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("branches").delete().eq("id", id);

  if (error) {
    // Most likely a foreign key constraint (employees/attendance/admins still
    // reference this branch) — surface something actionable rather than the
    // raw Postgres error.
    return { error: "Couldn't delete this branch. Move or remove its employees and admins first." };
  }

  revalidatePath("/branches");
  return { error: null };
}
