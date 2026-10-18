"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon, LogInIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeAttendance } from "@/hooks/use-employee-attendance";
import { anyShiftActive, getShiftStatus, type ShiftStatus } from "@/lib/shifts";
import { zonedNow } from "@/lib/time";
import { submitAttendance } from "@/app/kiosk/actions";
import type { Branch, Employee, Shift } from "@/types";

const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  open: "Open now",
  late: "Grace period",
  closed: "Closed",
};

const SHIFT_STATUS_VARIANT: Record<ShiftStatus, "success" | "warning" | "outline"> = {
  open: "success",
  late: "warning",
  closed: "outline",
};

export function CheckInPanel({
  branch,
  employee,
  shifts,
  checkoutEnabled,
  onChangeEmployee,
}: {
  branch: Branch;
  employee: Employee;
  shifts: Shift[];
  checkoutEnabled: boolean;
  onChangeEmployee: () => void;
}) {
  const { today, history, loading, refresh } = useEmployeeAttendance(branch.id, employee.name);
  const [isPending, startTransition] = useTransition();
  // Branch wall-clock time, refreshed so the shift badges and the Check in
  // button follow the clock if the kiosk is left open on this screen.
  const [now, setNow] = useState(() => zonedNow(branch.timezone));
  useEffect(() => {
    const id = setInterval(() => setNow(zonedNow(branch.timezone)), 30_000);
    return () => clearInterval(id);
  }, [branch.timezone]);

  const shiftOpen = anyShiftActive(shifts, now);

  const hasCheckedIn = today.some((r) => r.type === "in");
  const hasCheckedOut = today.some((r) => r.type === "out");
  // Check-out only unlocks once an admin has approved the check-in.
  const hasApprovedIn = today.some((r) => r.type === "in" && r.status === "done");
  const pendingIn = today.some((r) => r.type === "in" && r.status === "pending");
  const pendingOut = today.some((r) => r.type === "out" && r.status === "pending");

  const recentDays = useMemo(() => {
    const byDate = new Map<string, typeof history>();
    for (const record of history) {
      const list = byDate.get(record.eth_date) ?? [];
      list.push(record);
      byDate.set(record.eth_date, list);
    }
    return Array.from(byDate.entries()).slice(0, 7);
  }, [history]);

  function handleAction(type: "in" | "out") {
    startTransition(async () => {
      const result = await submitAttendance({
        branchId: branch.id,
        employeeId: employee.id,
        employeeName: employee.name,
        type,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(type === "in" ? "Check-in submitted for approval" : "Check-out submitted for approval");
        refresh();
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-10">
      <button
        onClick={onChangeEmployee}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Not you?
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRoundIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-foreground">{employee.name}</p>
          <p className="truncate text-xs text-muted-foreground">{branch.name}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        {shifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No shifts configured for this branch yet.</p>
        ) : (
          shifts.map((shift) => {
            const status = getShiftStatus(shift, now);
            return (
              <Card key={shift.id} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{shift.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                  </p>
                </div>
                <Badge variant={SHIFT_STATUS_VARIANT[status]}>{SHIFT_STATUS_LABEL[status]}</Badge>
              </Card>
            );
          })
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Button
          size="lg"
          disabled={hasCheckedIn || !shiftOpen || isPending}
          onClick={() => handleAction("in")}
          className="h-auto flex-col gap-1.5 py-4"
        >
          <LogInIcon className="size-5" />
          {pendingIn ? "Pending" : hasCheckedIn ? "Checked in" : !shiftOpen ? "Check-in closed" : "Check in"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={!checkoutEnabled || !hasApprovedIn || hasCheckedOut || isPending}
          onClick={() => handleAction("out")}
          className="h-auto flex-col gap-1.5 py-4"
        >
          <LogOutIcon className="size-5" />
          {pendingOut
            ? "Pending"
            : hasCheckedOut
              ? "Checked out"
              : hasCheckedIn && !hasApprovedIn
                ? "Awaiting approval"
                : "Check out"}
        </Button>
      </div>

      {!shiftOpen && !hasCheckedIn && shifts.length > 0 && (
        <p className="-mt-3 mb-5 text-xs text-muted-foreground">No shift is open right now.</p>
      )}

      <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Recent activity
      </h2>
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : recentDays.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recentDays.map(([date, records]) => (
            <Card key={date} className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-sm text-foreground">{date}</span>
              <div className="flex gap-1.5">
                {records.map((r) => (
                  <Badge
                    key={r.id}
                    variant={
                      r.type === "permission"
                        ? "outline"
                        : r.status === "pending"
                          ? "warning"
                          : r.is_late
                            ? "warning"
                            : "success"
                    }
                  >
                    {r.type === "permission" ? (
                      "Excused"
                    ) : r.status === "pending" ? (
                      <>
                        <ClockIcon /> {r.type}
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon /> {r.type}
                        {r.is_late ? " · late" : ""}
                      </>
                    )}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
