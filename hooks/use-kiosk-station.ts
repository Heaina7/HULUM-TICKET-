"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KIOSK_REFRESH_INTERVAL_MS, SETTINGS_KEYS } from "@/constants";
import type { Employee, Shift } from "@/types";

export interface KioskStationData {
  shifts: Shift[];
  employees: Employee[];
  checkoutEnabled: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useKioskStationData(branchId: number | null): KioskStationData {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!branchId) return;
    const supabase = createClient();

    const [shiftsRes, employeesRes, settingsRes] = await Promise.all([
      supabase.from("shifts").select("*").eq("branch_id", branchId),
      supabase
        .from("employees")
        .select("*")
        .eq("branch_id", branchId)
        .eq("active", true)
        .order("name"),
      supabase
        .from("settings")
        .select("*")
        .eq("branch_id", branchId)
        .eq("key", SETTINGS_KEYS.CHECKOUT_ENABLED)
        .maybeSingle(),
    ]);

    if (shiftsRes.data) setShifts(shiftsRes.data);
    if (employeesRes.data) setEmployees(employeesRes.data);
    setCheckoutEnabled(settingsRes.data ? settingsRes.data.value !== "false" : true);
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, KIOSK_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { shifts, employees, checkoutEnabled, loading, refresh: load };
}
