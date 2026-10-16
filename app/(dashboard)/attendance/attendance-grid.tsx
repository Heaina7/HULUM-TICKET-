"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ClockIcon, MinusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMonthDates, ethDateCompare, todayEth } from "@/lib/ethiopian-calendar";
import { DayDetailsDialog } from "@/app/(dashboard)/attendance/day-details-dialog";
import type { AttendanceRecord, Employee } from "@/types";

type CellStatus = "present" | "late" | "permission" | "absent" | "future" | "empty";

const CELL_STYLES: Record<CellStatus, string> = {
  present: "bg-success/15 text-success-foreground",
  late: "bg-warning/15 text-warning-foreground",
  permission: "bg-muted text-muted-foreground",
  absent: "bg-destructive/10 text-destructive",
  future: "bg-transparent text-muted-foreground/40",
  empty: "bg-transparent text-muted-foreground/40",
};

function cellStatus(records: AttendanceRecord[], date: string, today: string): CellStatus {
  if (records.some((r) => r.type === "permission")) return "permission";

  const checkIn = records.find((r) => r.type === "in" && r.status === "done");
  if (checkIn) return checkIn.is_late ? "late" : "present";

  const pendingIn = records.find((r) => r.type === "in" && r.status === "pending");
  if (pendingIn) return "present"; // treat as present pending review, not absent

  if (ethDateCompare(date, today) > 0) return "future";
  return "absent";
}

function CellIcon({ status }: { status: CellStatus }) {
  switch (status) {
    case "present":
      return <CheckIcon className="size-3.5" />;
    case "late":
      return <ClockIcon className="size-3.5" />;
    case "permission":
      return <MinusIcon className="size-3.5" />;
    case "absent":
      return <XIcon className="size-3.5" />;
    default:
      return null;
  }
}

export function AttendanceGrid({
  employees,
  records,
  month,
  search,
  onChanged,
}: {
  employees: Employee[];
  records: AttendanceRecord[];
  month: string;
  search: string;
  onChanged: () => void;
}) {
  const [selected, setSelected] = useState<{ employee: Employee; date: string } | null>(null);
  const today = todayEth();
  const dates = useMemo(() => generateMonthDates(month), [month]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(q));
  }, [employees, search]);

  const recordsByEmployeeDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      const key = `${r.employee_name}::${r.eth_date}`;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [records]);

  const selectedRecords = selected
    ? (recordsByEmployeeDate.get(`${selected.employee.name}::${selected.date}`) ?? [])
    : [];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 min-w-44 bg-muted/40 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
              Employee
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="w-9 min-w-9 px-0 py-2.5 text-center text-xs font-medium text-muted-foreground"
                title={date}
              >
                {date.split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="sticky left-0 z-10 bg-background px-4 py-2 hover:bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{employee.name}</span>
                  {!employee.active && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">(inactive)</span>
                  )}
                </div>
              </td>
              {dates.map((date) => {
                const dayRecords = recordsByEmployeeDate.get(`${employee.name}::${date}`) ?? [];
                const status = cellStatus(dayRecords, date, today);
                const clickable = dayRecords.length > 0;
                return (
                  <td key={date} className="p-0.5 text-center">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => clickable && setSelected({ employee, date })}
                      title={`${employee.name} · ${date}`}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md mx-auto transition-colors",
                        CELL_STYLES[status],
                        clickable && "cursor-pointer hover:opacity-75",
                        !clickable && "cursor-default"
                      )}
                    >
                      <CellIcon status={status} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <DayDetailsDialog
          employeeName={selected.employee.name}
          date={selected.date}
          records={selectedRecords}
          onOpenChange={(open) => !open && setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
