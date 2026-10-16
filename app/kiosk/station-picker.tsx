"use client";

import Image from "next/image";
import { Building2Icon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Branch } from "@/types";

export function StationPicker({
  branches,
  onSelect,
}: {
  branches: Branch[];
  onSelect: (branch: Branch) => void;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="Hulum Ticket" width={56} height={64} className="h-14 w-auto" priority />
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Hulum Ticket</h1>
          <p className="text-sm text-muted-foreground">Which station is this?</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(branch)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(branch);
            }}
            className="flex cursor-pointer items-center gap-3 p-5 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Building2Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{branch.name}</p>
              {branch.country && <p className="text-xs text-muted-foreground">{branch.country}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
