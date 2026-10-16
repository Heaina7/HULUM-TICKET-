"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grantPermission } from "@/app/(dashboard)/requests/actions";
import type { Employee } from "@/types";

export function GrantPermissionDialog({
  branchId,
  employees,
  onGranted,
}: {
  branchId: number;
  employees: Employee[];
  onGranted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeEmployees = employees.filter((e) => e.active);

  function handleSubmit() {
    const employee = activeEmployees.find((e) => String(e.id) === employeeId);
    if (!employee) {
      toast.error("Pick an employee first.");
      return;
    }

    startTransition(async () => {
      const result = await grantPermission({
        branchId,
        employeeId: employee.id,
        employeeName: employee.name,
        note,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Permission granted for ${employee.name}`);
        setOpen(false);
        setEmployeeId("");
        setNote("");
        onGranted();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusIcon /> Grant permission
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant permission</DialogTitle>
          <DialogDescription>Excuse an employee's absence for today.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-employee">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger id="permission-employee" className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permission-note">Reason (optional)</Label>
            <Textarea
              id="permission-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Medical appointment"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !employeeId}>
            Grant permission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
