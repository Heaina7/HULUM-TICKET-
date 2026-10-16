import "server-only";
import { createClient } from "@/lib/supabase/server";
import { SETTINGS_KEYS } from "@/constants";
import type { AuditLog, Holiday, Announcement, Shift } from "@/types";

export async function getShifts(branchId: number): Promise<Shift[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("branch_id", branchId)
    .order("start_time");

  if (error) throw new Error(`Failed to load shifts: ${error.message}`);
  return data;
}

export async function getCheckoutEnabled(branchId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("branch_id", branchId)
    .eq("key", SETTINGS_KEYS.CHECKOUT_ENABLED)
    .maybeSingle();

  return data ? data.value !== "false" : true;
}

export async function getHolidays(): Promise<Holiday[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holidays")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load holidays: ${error.message}`);
  return data;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load announcements: ${error.message}`);
  return data;
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load audit log: ${error.message}`);
  return data;
}
