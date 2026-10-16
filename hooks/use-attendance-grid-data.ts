"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceRecord, Employee } from "@/types";

export function useAttendanceGridData(branchId: number, month: string, year: number) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [employeesRes, attendanceRes] = await Promise.all([
      supabase.from("employees").select("*").eq("branch_id", branchId).order("name"),
      supabase
        .from("attendance")
        .select("*")
        .eq("branch_id", branchId)
        .like("eth_date", `%${month} ${year}`)
        .order("created_at"),
    ]);

    setEmployees(employeesRes.data ?? []);
    setRecords(attendanceRes.data ?? []);
    setLoading(false);
  }, [branchId, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { employees, records, loading, refresh: load };
}
