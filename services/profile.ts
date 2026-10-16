import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/types";

/**
 * Loads the authenticated user's profile (role, branch, username) for use
 * in Server Components/Actions. Redirects to /login if there's no session —
 * middleware already blocks unauthenticated requests to dashboard routes,
 * this is the defense-in-depth version for direct Server Component reads.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return { id: user.id, email: user.email ?? null, profile };
}

/** Same as getCurrentUser(), but returns null instead of redirecting — for optional-auth spots like the root layout. */
export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile };
}
