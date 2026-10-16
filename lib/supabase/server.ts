import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase client for use on the server — Server Components, Server
 * Actions, and Route Handlers. Reads/writes the auth session via Next's
 * cookies() API.
 *
 * Server Components can't write cookies, so the `set` call below is wrapped
 * in a try/catch: when this runs inside a Server Component the write is a
 * no-op (and safe to ignore) because `middleware.ts` is what actually
 * persists a refreshed session back to the browser on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refreshes the
            // session on the next request instead. Safe to ignore.
          }
        },
      },
    }
  );
}
