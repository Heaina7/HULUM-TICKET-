"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";
import { SETTINGS_KEYS } from "@/constants";

export interface ActionResult {
  error: string | null;
}

async function assertBranchAccess(branchId: number) {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin" && profile.branch_id !== branchId) {
    throw new Error("You don't have access to this branch.");
  }
}

async function assertSuperAdmin() {
  const user = await getCurrentUser();
  if (user.profile.role !== "super_admin") throw new Error("Super admin access required.");
  return user;
}

// ── SHIFTS ───────────────────────────────────────────────────────────────────

export interface ShiftInput {
  branchId: number;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
}

export async function createShiftAction(input: ShiftInput): Promise<ActionResult> {
  await assertBranchAccess(input.branchId);
  if (!input.name.trim()) return { error: "Shift name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").insert({
    branch_id: input.branchId,
    name: input.name.trim(),
    start_time: input.startTime,
    end_time: input.endTime,
    grace_minutes: input.graceMinutes,
  });

  if (error) return { error: "Couldn't create shift." };
  revalidatePath("/settings");
  return { error: null };
}

export async function updateShiftAction(id: number, input: ShiftInput): Promise<ActionResult> {
  await assertBranchAccess(input.branchId);
  if (!input.name.trim()) return { error: "Shift name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("shifts")
    .update({
      name: input.name.trim(),
      start_time: input.startTime,
      end_time: input.endTime,
      grace_minutes: input.graceMinutes,
    })
    .eq("id", id);

  if (error) return { error: "Couldn't update shift." };
  revalidatePath("/settings");
  return { error: null };
}

export async function deleteShiftAction(id: number, branchId: number): Promise<ActionResult> {
  await assertBranchAccess(branchId);

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").delete().eq("id", id);

  if (error) return { error: "Couldn't delete shift." };
  revalidatePath("/settings");
  return { error: null };
}

export async function setCheckoutEnabledAction(branchId: number, enabled: boolean): Promise<ActionResult> {
  await assertBranchAccess(branchId);

  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert({
    branch_id: branchId,
    key: SETTINGS_KEYS.CHECKOUT_ENABLED,
    value: String(enabled),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "Couldn't update checkout setting." };
  revalidatePath("/settings");
  return { error: null };
}

// ── PASSWORD ─────────────────────────────────────────────────────────────────

export async function changeOwnPasswordAction(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: "Couldn't change your password." };

  const { error: auditError } = await supabase.rpc("log_audit_event", {
    p_action: "CHANGE_OWN_PASSWORD",
    p_details: "Changed their own password",
  });
  if (auditError) {
    // The password change itself already succeeded — don't fail the user's
    // request over a secondary logging error, but don't lose it either.
    console.error("log_audit_event failed:", auditError.message);
  }

  return { error: null };
}

// ── HOLIDAYS (super admin) ────────────────────────────────────────────────────

export async function createHolidayAction(input: {
  name: string;
  ethDate: string;
}): Promise<ActionResult> {
  await assertSuperAdmin();
  if (!input.name.trim()) return { error: "Holiday name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("holidays").insert({
    name: input.name.trim(),
    eth_date: input.ethDate.trim() || null,
  });

  if (error) return { error: "Couldn't add holiday." };
  revalidatePath("/settings");
  return { error: null };
}

export async function deleteHolidayAction(id: number): Promise<ActionResult> {
  await assertSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("holidays").delete().eq("id", id);

  if (error) return { error: "Couldn't delete holiday." };
  revalidatePath("/settings");
  return { error: null };
}

// ── ANNOUNCEMENTS (super admin) ───────────────────────────────────────────────

export async function createAnnouncementAction(input: {
  title: string;
  message: string;
}): Promise<ActionResult> {
  const { id } = await assertSuperAdmin();
  if (!input.title.trim()) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    title: input.title.trim(),
    message: input.message.trim() || null,
    created_by: id,
  });

  if (error) return { error: "Couldn't post announcement." };
  revalidatePath("/settings");
  return { error: null };
}

export async function deleteAnnouncementAction(id: number): Promise<ActionResult> {
  await assertSuperAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) return { error: "Couldn't delete announcement." };
  revalidatePath("/settings");
  return { error: null };
}
