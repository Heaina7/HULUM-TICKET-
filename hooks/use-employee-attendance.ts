"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KIOSK_REFRESH_INTERVAL_MS } from "@/constants";
import { todayEth } from "@/lib/ethiopian-calendar";
import type { AttendanceRecord } from "@/types";

export interface EmployeeAttendanceData {
  today: AttendanceRecord[];
  history: AttendanceRecord[];
  loading: boolean;
  refresh: () => void;
}

/** Today's records plus the last 7 days, for one employee at one branch. */
export function useEmployeeAttendance(
  branchId: number | null,
  employeeName: string | null
): EmployeeAttendanceData {
  const [today, setToday] = useState<AttendanceRecord[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId || !employeeName) return;
    const supabase = createClient();

    const [todayRes, historyRes] = await Promise.all([
      supabase
        .from("attendance")
        .select("*")
        .eq("branch_id", branchId)
        .eq("employee_name", employeeName)
        .eq("eth_date", todayEth()),
      supabase
        .from("attendance")
        .select("*")
        .eq("branch_id", branchId)
        .eq("employee_name", employeeName)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (todayRes.data) setToday(todayRes.data);
    if (historyRes.data) setHistory(historyRes.data);
    setLoading(false);
  }, [branchId, employeeName]);

  useEffect(() => {
    if (!employeeName) return;
    setLoading(true);
    load();
    const id = setInterval(load, KIOSK_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, employeeName]);

  return { today, history, loading, refresh: load };
}
