import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AdminWithBranch {
  id: string;
  username: string;
  full_name: string | null;
  role: "super_admin" | "branch_admin";
  branch_id: number | null;
  branch_name: string | null;
  created_at: string;
}

/**
 * Profiles joined with their branch name. Joined client-side (two queries +
 * a Map) rather than via a PostgREST nested select (`branches(name)`)
 * because the hand-written Database type in types/database.ts has no
 * Relationships metadata for supabase-js to type-check an embedded
 * resource against — this keeps the return type exact without needing
 * that metadata.
 */
export async function getAdmins(): Promise<AdminWithBranch[]> {
  const supabase = await createClient();

  const [profilesRes, branchesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, role, branch_id, created_at")
      .order("created_at"),
    supabase.from("branches").select("id, name"),
  ]);

  if (profilesRes.error) throw new Error(`Failed to load admins: ${profilesRes.error.message}`);

  const branchNameById = new Map((branchesRes.data ?? []).map((b) => [b.id, b.name]));

  return profilesRes.data.map((row) => ({
    ...row,
    branch_name: row.branch_id ? (branchNameById.get(row.branch_id) ?? null) : null,
  }));
}
