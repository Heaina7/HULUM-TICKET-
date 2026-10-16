import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayEth } from "@/lib/ethiopian-calendar";
import type { DashboardSummary } from "@/types";

/** Today's present/late/on-time/pending counts for one branch (branch admin view). */
export async function getBranchTodaySummary(branchId: number): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("branch_today_summary", {
    p_branch_id: branchId,
    p_eth_date: todayEth(),
  });

  if (error) throw new Error(`Failed to load dashboard summary: ${error.message}`);

  const row = data?.[0];
  return {
    totalActive: row?.total_active ?? 0,
    present: row?.present ?? 0,
    late: row?.late ?? 0,
    onTime: row?.on_time ?? 0,
    pending: row?.pending ?? 0,
  };
}

/** Same summary for every branch at once (super admin Home view). */
export async function getAllBranchesTodaySummary(
  branchIds: number[]
): Promise<Record<number, DashboardSummary>> {
  const results = await Promise.all(
    branchIds.map(async (id) => [id, await getBranchTodaySummary(id)] as const)
  );
  return Object.fromEntries(results);
}
