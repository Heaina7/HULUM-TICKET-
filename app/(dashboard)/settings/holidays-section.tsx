"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { createHolidayAction, deleteHolidayAction } from "@/app/(dashboard)/settings/actions";
import type { Holiday } from "@/types";

export function HolidaysSection({ initialHolidays }: { initialHolidays: Holiday[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [ethDate, setEthDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createHolidayAction({ name, ethDate });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Holiday added");
        setDialogOpen(false);
        setName("");
        setEthDate("");
        router.refresh();
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteHolidayAction(id);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Holidays</CardTitle>
          <CardDescription>Company-wide holidays, shown across every branch.</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon /> Add holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add holiday</DialogTitle>
              <DialogDescription>Applies to all branches.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="holiday-name">Name</Label>
                <Input id="holiday-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="holiday-date">Ethiopian date</Label>
                <Input
                  id="holiday-date"
                  value={ethDate}
                  onChange={(e) => setEthDate(e.target.value)}
                  placeholder="e.g. 1 መስከረም 2018"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
                Add holiday
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {initialHolidays.length === 0 ? (
          <EmptyState icon={CalendarDaysIcon} title="No holidays added yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {initialHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className="flex items-center justify-between rounded-md border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{holiday.name}</p>
                  {holiday.eth_date && <p className="text-xs text-muted-foreground">{holiday.eth_date}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() => handleDelete(holiday.id)}
                  aria-label={`Delete ${holiday.name}`}
                >
                  <Trash2Icon className="text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
