"use client";

import { useTransition } from "react";
import { MoreVerticalIcon, PencilIcon, PowerIcon, PowerOffIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setEmployeeActiveAction } from "@/app/(dashboard)/employees/actions";
import type { Employee } from "@/types";

export function EmployeeRow({
  employee,
  onEdit,
  onChanged,
}: {
  employee: Employee;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setEmployeeActiveAction(employee.id, employee.branch_id, !employee.active);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(employee.active ? "Employee deactivated" : "Employee reactivated");
        onChanged();
      }
    });
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRoundIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{employee.name}</p>
          <p className="truncate text-xs text-muted-foreground">{employee.position || "Staff"}</p>
        </div>
        {!employee.active && <Badge variant="outline">Inactive</Badge>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} aria-label={`Actions for ${employee.name}`}>
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive} variant={employee.active ? "destructive" : "default"}>
            {employee.active ? (
              <>
                <PowerOffIcon /> Deactivate
              </>
            ) : (
              <>
                <PowerIcon /> Reactivate
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Card>
  );
}
