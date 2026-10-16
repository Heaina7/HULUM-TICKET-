"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ShiftFormDialog } from "@/app/(dashboard)/settings/shift-form-dialog";
import { deleteShiftAction, setCheckoutEnabledAction } from "@/app/(dashboard)/settings/actions";
import type { Shift } from "@/types";

export function ShiftsSection({
  branchId,
  initialShifts,
  initialCheckoutEnabled,
}: {
  branchId: number;
  initialShifts: Shift[];
  initialCheckoutEnabled: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState<Shift | null>(null);
  const [checkoutEnabled, setCheckoutEnabledState] = useState(initialCheckoutEnabled);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleToggleCheckout(next: boolean) {
    setCheckoutEnabledState(next);
    startTransition(async () => {
      const result = await setCheckoutEnabledAction(branchId, next);
      if (result.error) {
        toast.error(result.error);
        setCheckoutEnabledState(!next);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Check-out</CardTitle>
          <CardDescription>Whether employees can submit a check-out request at the kiosk.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="checkout-enabled"
              checked={checkoutEnabled}
              disabled={isPending}
              onCheckedChange={handleToggleCheckout}
            />
            <Label htmlFor="checkout-enabled" className="cursor-pointer">
              Check-out {checkoutEnabled ? "enabled" : "disabled"}
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Shifts</CardTitle>
            <CardDescription>Working hours and grace periods for this branch.</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon /> Add shift
          </Button>
        </CardHeader>
        <CardContent>
          {initialShifts.length === 0 ? (
            <EmptyState icon={ClockIcon} title="No shifts configured" />
          ) : (
            <div className="flex flex-col gap-2">
              {initialShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{shift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)} · {shift.grace_minutes}min
                      grace
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(shift);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${shift.name}`}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(shift)}
                      aria-label={`Delete ${shift.name}`}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShiftFormDialog
        branchId={branchId}
        shift={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />

      {deleting && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete ${deleting.name}?`}
          description="Existing attendance records referencing this shift are kept; only the shift definition is removed."
          onConfirm={() => deleteShiftAction(deleting.id, branchId)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
