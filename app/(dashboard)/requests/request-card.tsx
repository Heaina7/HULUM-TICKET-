"use client";

import { useTransition } from "react";
import { CheckIcon, ClockIcon, LogInIcon, LogOutIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveAttendance, rejectAttendance } from "@/app/(dashboard)/requests/actions";
import type { AttendanceRecord } from "@/types";

export function RequestCard({
  record,
  onResolved,
}: {
  record: AttendanceRecord;
  /** Called once the request is no longer pending, so the list can drop it. */
  onResolved: (id: number) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handle(action: "approve" | "reject") {
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveAttendance(record.id, record.branch_id)
          : await rejectAttendance(record.id, record.branch_id);

      if (result.error) {
        toast.error(result.error);
        // Someone else (or an earlier click) already handled it — it's stale, so remove it.
        if (result.alreadyHandled) onResolved(record.id);
      } else {
        toast.success(action === "approve" ? "Approved" : "Rejected");
        onResolved(record.id);
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {record.type === "in" ? <LogInIcon className="size-4" /> : <LogOutIcon className="size-4" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{record.employee_name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="capitalize">{record.type}</span>
            <span aria-hidden>·</span>
            <span>{record.eth_date}</span>
            {record.eth_time && (
              <>
                <span aria-hidden>·</span>
                <span>{record.eth_time}</span>
              </>
            )}
            {record.is_late && (
              <Badge variant="warning" className="ml-1">
                <ClockIcon /> Late
              </Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handle("reject")}
          aria-label={`Reject ${record.employee_name}'s ${record.type} request`}
        >
          <XIcon /> Reject
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => handle("approve")}
          aria-label={`Approve ${record.employee_name}'s ${record.type} request`}
        >
          <CheckIcon /> Approve
        </Button>
      </div>
    </Card>
  );
}
