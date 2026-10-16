"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteAttendanceRecord } from "@/app/(dashboard)/attendance/actions";
import type { AttendanceRecord } from "@/types";

export function DayDetailsDialog({
  employeeName,
  date,
  records,
  onOpenChange,
  onDeleted,
}: {
  employeeName: string;
  date: string;
  records: AttendanceRecord[];
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(record: AttendanceRecord) {
    startTransition(async () => {
      const result = await deleteAttendanceRecord(record.id, record.branch_id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Record deleted");
        onDeleted();
      }
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employeeName}</DialogTitle>
          <DialogDescription>{date}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium capitalize text-foreground">
                  {record.type}
                  {record.is_late && (
                    <Badge variant="warning" className="ml-2">
                      Late
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.eth_time ?? "No time recorded"}
                  {record.note && ` · ${record.note}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleDelete(record)}
                aria-label={`Delete ${record.type} record`}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
