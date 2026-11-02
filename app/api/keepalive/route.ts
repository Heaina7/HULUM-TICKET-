import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Always run on every call — never serve a cached response, otherwise the
// database would not actually be touched.
export const dynamic = "force-dynamic";

/**
 * Keep-alive ping, called once a day by Vercel Cron (see vercel.json).
 *
 * Supabase's free plan pauses a project after about 7 days without
 * activity. A tiny read once a day counts as activity.
 *
 * It only reads ONE id from `branches` (already readable by the public
 * kiosk), so it needs no service-role key and exposes no data.
 *
 * If CRON_SECRET is set in Vercel, Vercel sends it automatically as
 * "Authorization: Bearer <secret>" and any other caller is rejected.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("branches").select("id").limit(1);

    if (error) {
      // 500 makes the failure visible in Vercel's cron/function logs.
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
