import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { KioskShell } from "@/app/kiosk/kiosk-shell";

export const metadata: Metadata = { title: "Station Check-in" };

// Public, unauthenticated route — always fetch fresh (never statically cache
// the branch list behind a stale build).
export const dynamic = "force-dynamic";

export default async function KioskPage() {
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("*").order("name");

  return <KioskShell branches={branches ?? []} />;
}
