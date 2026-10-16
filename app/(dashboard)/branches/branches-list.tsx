"use client";

import { useState } from "react";
import { Building2Icon, MoreVerticalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { BranchFormDialog } from "@/app/(dashboard)/branches/branch-form-dialog";
import { deleteBranchAction } from "@/app/(dashboard)/branches/actions";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/types";

export function BranchesList({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState(initialBranches);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.from("branches").select("*").order("name");
    if (data) setBranches(data);
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
          <PlusIcon /> New branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState
          icon={Building2Icon}
          title="No branches yet"
          description="Create your first branch to start onboarding employees."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <PlusIcon /> New branch
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="flex items-start justify-between gap-3 p-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{branch.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {branch.country || "—"} · {branch.timezone}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${branch.name}`}>
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(branch);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(branch)}>
                    <Trash2Icon /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}

      <BranchFormDialog branch={editing} open={formOpen} onOpenChange={setFormOpen} onSaved={refresh} />

      {deleting && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete ${deleting.name}?`}
          description="This can't be undone. Branches with existing employees or admins can't be deleted until those are moved or removed."
          onConfirm={() => deleteBranchAction(deleting.id)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
