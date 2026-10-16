import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses Row Level Security entirely, so it is only
 * ever imported from Server Actions / Route Handlers — the `server-only`
 * import above makes it a build error to accidentally pull this into a
 * Client Component bundle.
 *
 * The one thing this app uses it for: creating a new branch_admin /
 * super_admin login via the Auth Admin API (supabase.auth.admin.createUser),
 * which requires the service role and cannot be done with the anon/
 * publishable key. See app/(dashboard)/admins/actions.ts.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
