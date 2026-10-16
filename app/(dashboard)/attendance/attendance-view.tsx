"use client";

import { useState } from "react";
import { DownloadIcon, SearchIcon, UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { getRecentEthMonths } from "@/lib/ethiopian-calendar";
import { useAttendanceGridData } from "@/hooks/use-attendance-grid-data";
import { AttendanceGrid } from "@/app/(dashboard)/attendance/attendance-grid";
import { GrantPermissionDialog } from "@/app/(dashboard)/attendance/grant-permission-dialog";
import { exportAttendanceCsv } from "@/app/(dashboard)/attendance/export-csv";
import type { Branch } from "@/types";

const MONTH_OPTIONS = getRecentEthMonths(12);

export function AttendanceView({
  branches,
  initialBranchId,
}: {
  branches: Branch[];
  initialBranchId: number;
}) {
  const [branchId, setBranchId] = useState(initialBranchId);
  const [monthLabel, setMonthLabel] = useState(MONTH_OPTIONS[0]!.label);
  const [search, setSearch] = useState("");

  const monthOption = MONTH_OPTIONS.find((m) => m.label === monthLabel) ?? MONTH_OPTIONS[0]!;
  const { employees, records, loading, refresh } = useAttendanceGridData(
    branchId,
    monthOption.month,
    monthOption.year
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 && (
            <Select value={String(branchId)} onValueChange={(v) => setBranchId(Number(v))}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={monthLabel} onValueChange={setMonthLabel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m.label} value={m.label}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="w-48 pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GrantPermissionDialog branchId={branchId} employees={employees} onGranted={refresh} />
          <Button
            variant="outline"
            onClick={() => exportAttendanceCsv(employees, records, monthOption.label)}
            disabled={employees.length === 0}
          >
            <DownloadIcon /> Export CSV
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <LegendItem className="bg-success/15 text-success-foreground" label="Present" />
        <LegendItem className="bg-warning/15 text-warning-foreground" label="Late" />
        <LegendItem className="bg-muted text-muted-foreground" label="Excused" />
        <LegendItem className="bg-destructive/10 text-destructive" label="Absent" />
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No employees yet"
          description="Add employees in the Employees tab to start tracking attendance."
        />
      ) : (
        <AttendanceGrid
          employees={employees}
          records={records}
          month={monthOption.label}
          search={search}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded ${className}`} />
      {label}
    </span>
  );
}
