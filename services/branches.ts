import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types";

export async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("branches").select("*").order("name");

  if (error) throw new Error(`Failed to load branches: ${error.message}`);
  return data;
}

export async function getBranch(branchId: number): Promise<Branch | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", branchId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load branch: ${error.message}`);
  return data;
}
