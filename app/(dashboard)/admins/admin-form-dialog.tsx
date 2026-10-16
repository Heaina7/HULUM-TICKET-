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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAdminAction, updateAdminAction } from "@/app/(dashboard)/admins/actions";
import type { AdminWithBranch } from "@/services/admins";
import type { Branch, UserRole } from "@/types";

export function AdminFormDialog({
  admin,
  branches,
  open,
  onOpenChange,
  onSaved,
}: {
  admin?: AdminWithBranch | null;
  branches: Branch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(admin?.username ?? "");
  const [fullName, setFullName] = useState(admin?.full_name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(admin?.role ?? "branch_admin");
  const [branchId, setBranchId] = useState<string>(admin?.branch_id ? String(admin.branch_id) : "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setUsername(admin?.username ?? "");
      setFullName(admin?.full_name ?? "");
      setPassword("");
      setRole(admin?.role ?? "branch_admin");
      setBranchId(admin?.branch_id ? String(admin.branch_id) : "");
    }
  }, [open, admin]);

  function handleSubmit() {
    startTransition(async () => {
      const result = admin
        ? await updateAdminAction({
            id: admin.id,
            fullName,
            role,
            branchId: role === "branch_admin" ? Number(branchId) || null : null,
          })
        : await createAdminAction({
            username,
            fullName,
            password,
            role,
            branchId: role === "branch_admin" ? Number(branchId) || null : null,
          });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(admin ? "Account updated" : "Account created");
        onOpenChange(false);
        onSaved();
      }
    });
  }

  const canSubmit =
    (admin || (username.trim().length >= 3 && password.length >= 8)) &&
    (role === "super_admin" || branchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{admin ? "Edit account" : "New admin account"}</DialogTitle>
          <DialogDescription>
            {admin ? "Update role and branch assignment." : "Create a login for a branch or super admin."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {!admin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-fullname">Full name</Label>
            <Input id="admin-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          {!admin && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger id="admin-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="branch_admin">Branch Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "branch_admin" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-branch">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="admin-branch" className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {admin ? "Save changes" : "Create account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
