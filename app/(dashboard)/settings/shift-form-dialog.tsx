"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShiftAction, updateShiftAction } from "@/app/(dashboard)/settings/actions";
import type { Shift } from "@/types";

export function ShiftFormDialog({
  branchId,
  shift,
  open,
  onOpenChange,
  onSaved,
}: {
  branchId: number;
  shift?: Shift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(shift?.name ?? "");
  const [startTime, setStartTime] = useState(shift?.start_time.slice(0, 5) ?? "08:00");
  const [endTime, setEndTime] = useState(shift?.end_time.slice(0, 5) ?? "17:00");
  const [graceMinutes, setGraceMinutes] = useState(shift?.grace_minutes ?? 120);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(shift?.name ?? "");
      setStartTime(shift?.start_time.slice(0, 5) ?? "08:00");
      setEndTime(shift?.end_time.slice(0, 5) ?? "17:00");
      setGraceMinutes(shift?.grace_minutes ?? 120);
    }
  }, [open, shift]);

  function handleSubmit() {
    startTransition(async () => {
      const input = { branchId, name, startTime, endTime, graceMinutes };
      const result = shift ? await updateShiftAction(shift.id, input) : await createShiftAction(input);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(shift ? "Shift updated" : "Shift added");
        onOpenChange(false);
        onSaved();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shift ? "Edit shift" : "New shift"}</DialogTitle>
          <DialogDescription>
            Grace period is how long after the shift ends a check-in still counts, marked as late.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift-name">Shift name</Label>
            <Input id="shift-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-start">Start time</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-end">End time</Label>
              <Input id="shift-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift-grace">Grace period (minutes)</Label>
            <Input
              id="shift-grace"
              type="number"
              min={0}
              max={1440}
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {shift ? "Save changes" : "Add shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
