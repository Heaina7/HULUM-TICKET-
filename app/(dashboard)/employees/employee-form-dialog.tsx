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
import { createEmployeeAction, updateEmployeeAction } from "@/app/(dashboard)/employees/actions";
import type { Employee } from "@/types";

export function EmployeeFormDialog({
  branchId,
  employee,
  open,
  onOpenChange,
  onSaved,
}: {
  branchId: number;
  /** Omit to create a new employee; pass an Employee to edit it. */
  employee?: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(employee?.name ?? "");
  const [position, setPosition] = useState(employee?.position ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(employee?.name ?? "");
      setPosition(employee?.position ?? "");
    }
  }, [open, employee]);

  function handleSubmit() {
    startTransition(async () => {
      const result = employee
        ? await updateEmployeeAction({ id: employee.id, branchId, name, position })
        : await createEmployeeAction({ branchId, name, position });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(employee ? "Employee updated" : "Employee added");
        onOpenChange(false);
        onSaved();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update this employee's details." : "Add a new employee to this branch."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employee-name">Full name</Label>
            <Input
              id="employee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="employee-position">Position / group</Label>
            <Input
              id="employee-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Staff"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {employee ? "Save changes" : "Add employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
