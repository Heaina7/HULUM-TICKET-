"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";
import type { UserRole } from "@/types";

export interface ActionResult {
  error: string | null;
}

async function assertSuperAdmin() {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin") throw new Error("Super admin access required.");
  return profile;
}

export interface CreateAdminInput {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  branchId: number | null;
}

export async function createAdminAction(input: CreateAdminInput): Promise<ActionResult> {
  await assertSuperAdmin();

  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { error: "Username must be 3–32 characters: letters, numbers, dots, dashes, underscores." };
  }
  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (input.role === "branch_admin" && !input.branchId) {
    return { error: "Branch admins must be assigned a branch." };
  }

  const admin = createAdminClient();

  // Supabase Auth requires an email. Admin usernames aren't real inboxes, so
  // we mint a stable placeholder address in a reserved subdomain — nothing
  // is ever sent there, it exists only so Auth has a unique identifier that
  // username_to_email() (in part_05_functions.sql) can resolve at login.
  const email = `${username}@accounts.hulum.internal`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: input.fullName.trim() || null,
      role: input.role,
      branch_id: input.role === "branch_admin" ? input.branchId : null,
    },
  });

  if (error || !data.user) {
    const message = error?.message.includes("already been registered")
      ? "That username is already taken."
      : "Couldn't create the account.";
    return { error: message };
  }

  revalidatePath("/admins");
  return { error: null };
}

export interface UpdateAdminInput {
  id: string;
  fullName: string;
  role: UserRole;
  branchId: number | null;
}

export async function updateAdminAction(input: UpdateAdminInput): Promise<ActionResult> {
  const currentProfile = await assertSuperAdmin();

  if (input.role === "branch_admin" && !input.branchId) {
    return { error: "Branch admins must be assigned a branch." };
  }
  if (input.id === currentProfile.id && input.role !== "super_admin") {
    return { error: "You can't demote your own account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim() || null,
      role: input.role,
      branch_id: input.role === "branch_admin" ? input.branchId : null,
    })
    .eq("id", input.id);

  if (error) return { error: "Couldn't update this account." };

  revalidatePath("/admins");
  return { error: null };
}

export async function resetAdminPasswordAction(id: string, newPassword: string): Promise<ActionResult> {
  await assertSuperAdmin();

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword });

  if (error) return { error: "Couldn't reset the password." };

  return { error: null };
}

export async function deleteAdminAction(id: string): Promise<ActionResult> {
  const currentProfile = await assertSuperAdmin();

  if (id === currentProfile.id) {
    return { error: "You can't delete your own account." };
  }

  const admin = createAdminClient();
  // Deleting the auth.users row cascades to profiles via its foreign key
  // (on delete cascade, part_02_tables.sql) — no separate profile delete needed.
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) return { error: "Couldn't delete this account." };

  revalidatePath("/admins");
  return { error: null };
}
