"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPasswordAction } from "@/app/(dashboard)/settings/actions";

export function PasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    startTransition(async () => {
      const result = await changeOwnPasswordAction(newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password changed");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-fit" disabled={isPending || newPassword.length < 8}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
