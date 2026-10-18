"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REALTIME_FALLBACK_POLL_MS } from "@/constants";
import type { AttendanceRecord } from "@/types";

/**
 * Subscribes to Supabase Realtime for a branch's pending attendance
 * records. Falls back to polling if the Realtime channel never reaches
 * SUBSCRIBED (e.g. Realtime disabled on the table, or a restrictive
 * network), so the requests queue never silently goes stale.
 */
export function usePendingAttendance(branchId: number, initial: AttendanceRecord[]) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initial);

  // useState only reads `initial` once. After approve/reject the server action
  // revalidates the page and React hands us fresh `initial` data — pick it up,
  // otherwise the list would keep showing requests that were already handled.
  useEffect(() => {
    setRecords(initial);
  }, [initial]);

  /** Drops a request from the list immediately, without waiting for a refetch. */
  const remove = useCallback((id: number) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;

    async function fetchPending() {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("branch_id", branchId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setRecords(data);
    }

    const channel = supabase
      .channel(`attendance-pending-${branchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `branch_id=eq.${branchId}` },
        () => fetchPending()
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && fallbackTimer) {
          clearInterval(fallbackTimer);
          fallbackTimer = null;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          fallbackTimer ??= setInterval(fetchPending, REALTIME_FALLBACK_POLL_MS);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [branchId]);

  return { records, remove };
}
