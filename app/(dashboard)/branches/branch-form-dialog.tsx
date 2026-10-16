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
import { createBranchAction, updateBranchAction } from "@/app/(dashboard)/branches/actions";
import type { Branch } from "@/types";

export function BranchFormDialog({
  branch,
  open,
  onOpenChange,
  onSaved,
}: {
  branch?: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(branch?.name ?? "");
  const [country, setCountry] = useState(branch?.country ?? "");
  const [timezone, setTimezone] = useState(branch?.timezone ?? "Africa/Addis_Ababa");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(branch?.name ?? "");
      setCountry(branch?.country ?? "");
      setTimezone(branch?.timezone ?? "Africa/Addis_Ababa");
    }
  }, [open, branch]);

  function handleSubmit() {
    startTransition(async () => {
      const result = branch
        ? await updateBranchAction({ id: branch.id, name, country, timezone })
        : await createBranchAction({ name, country, timezone });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(branch ? "Branch updated" : "Branch created");
        onOpenChange(false);
        onSaved();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branch ? "Edit branch" : "New branch"}</DialogTitle>
          <DialogDescription>
            {branch ? "Update this branch's details." : "Add a new station to the system."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-name">Branch name</Label>
            <Input id="branch-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-country">Country</Label>
            <Input id="branch-country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branch-timezone">Timezone</Label>
            <Input
              id="branch-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Africa/Addis_Ababa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {branch ? "Save changes" : "Create branch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
