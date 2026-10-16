"use client";

import { useEffect, useState } from "react";
import { WifiOffIcon } from "lucide-react";
import { StationPicker } from "@/app/kiosk/station-picker";
import { EmployeePicker } from "@/app/kiosk/employee-picker";
import { CheckInPanel } from "@/app/kiosk/check-in-panel";
import { useKioskStationData } from "@/hooks/use-kiosk-station";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { Branch, Employee } from "@/types";

const BRANCH_STORAGE_KEY = "hulum:kiosk:branch-id";

export function KioskShell({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState<number | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const online = useOnlineStatus();

  // A kiosk is a fixed device per station, so remember the branch across
  // reloads — matches the original app's intent of "set it once per device".
  useEffect(() => {
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
    if (stored) setBranchId(Number(stored));
    setHydrated(true);
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const { shifts, employees, checkoutEnabled, loading } = useKioskStationData(branchId);

  function selectBranch(b: Branch) {
    localStorage.setItem(BRANCH_STORAGE_KEY, String(b.id));
    setBranchId(b.id);
  }

  function changeBranch() {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    setBranchId(null);
    setEmployee(null);
  }

  if (!hydrated) return null;

  return (
    <div className="min-h-svh bg-background">
      {!online && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-warning-foreground">
          <WifiOffIcon className="size-4" /> You&apos;re offline — reconnect to check in or out.
        </div>
      )}

      {!branch ? (
        <StationPicker branches={branches} onSelect={selectBranch} />
      ) : !employee ? (
        <EmployeePicker
          branch={branch}
          employees={employees}
          loading={loading}
          onSelect={setEmployee}
          onChangeBranch={changeBranch}
        />
      ) : (
        <CheckInPanel
          branch={branch}
          employee={employee}
          shifts={shifts}
          checkoutEnabled={checkoutEnabled}
          onChangeEmployee={() => setEmployee(null)}
        />
      )}
    </div>
  );
}
