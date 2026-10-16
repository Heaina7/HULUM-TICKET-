"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon, MoreVerticalIcon, PencilIcon, PlusIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { AdminFormDialog } from "@/app/(dashboard)/admins/admin-form-dialog";
import { ResetPasswordDialog } from "@/app/(dashboard)/admins/reset-password-dialog";
import { deleteAdminAction } from "@/app/(dashboard)/admins/actions";
import type { AdminWithBranch } from "@/services/admins";
import type { Branch } from "@/types";

export function AdminsList({
  initialAdmins,
  branches,
  currentUserId,
}: {
  initialAdmins: AdminWithBranch[];
  branches: Branch[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminWithBranch | null>(null);
  const [resetting, setResetting] = useState<AdminWithBranch | null>(null);
  const [deleting, setDeleting] = useState<AdminWithBranch | null>(null);

  // Server Actions already revalidate the /admins path; router.refresh()
  // re-runs this page's server-side data fetch and merges it in without a
  // full reload or losing client state elsewhere on the page.
  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon /> New account
        </Button>
      </div>

      {initialAdmins.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title="No admin accounts yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {initialAdmins.map((admin) => (
            <Card key={admin.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {admin.full_name || admin.username}
                    {admin.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{admin.username}</p>
                </div>
                <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                  {admin.role === "super_admin" ? "Super Admin" : admin.branch_name || "Branch Admin"}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${admin.username}`}>
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(admin);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setResetting(admin)}>
                    <KeyRoundIcon /> Reset password
                  </DropdownMenuItem>
                  {admin.id !== currentUserId && (
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(admin)}>
                      <Trash2Icon /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <AdminFormDialog
        admin={editing}
        branches={branches}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />

      {resetting && (
        <ResetPasswordDialog
          adminId={resetting.id}
          username={resetting.username}
          open
          onOpenChange={(open) => !open && setResetting(null)}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete ${deleting.username}?`}
          description="This immediately revokes their access. This can't be undone."
          onConfirm={() => deleteAdminAction(deleting.id)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
