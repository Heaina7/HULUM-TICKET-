"use client";

import { useState, useTransition } from "react";
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
import { resetAdminPasswordAction } from "@/app/(dashboard)/admins/actions";

export function ResetPasswordDialog({
  adminId,
  username,
  open,
  onOpenChange,
}: {
  adminId: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await resetAdminPasswordAction(adminId, password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Password reset for ${username}`);
        setPassword("");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {username}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || password.length < 8}>
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
