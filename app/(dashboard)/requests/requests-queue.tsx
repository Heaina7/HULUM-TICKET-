"use client";

import { InboxIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RequestCard } from "@/app/(dashboard)/requests/request-card";
import { usePendingAttendance } from "@/hooks/use-pending-attendance";
import type { AttendanceRecord } from "@/types";

export function RequestsQueue({
  branchId,
  initialRecords,
}: {
  branchId: number;
  initialRecords: AttendanceRecord[];
}) {
  const { records, remove } = usePendingAttendance(branchId, initialRecords);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="All caught up"
        description="No pending check-in or check-out requests right now."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {records.map((record) => (
        <RequestCard key={record.id} record={record} onResolved={remove} />
      ))}
    </div>
  );
}
