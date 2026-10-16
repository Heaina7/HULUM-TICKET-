"use client";

import { useMemo, useState } from "react";
import { ArrowLeftIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { Branch, Employee } from "@/types";

export function EmployeePicker({
  branch,
  employees,
  loading,
  onSelect,
  onChangeBranch,
}: {
  branch: Branch;
  employees: Employee[];
  loading: boolean;
  onSelect: (employee: Employee) => void;
  onChangeBranch: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.name.toLowerCase().includes(q));
  }, [employees, query]);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-10">
      <button
        onClick={onChangeBranch}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> {branch.name}
      </button>

      <h1 className="mb-4 font-display text-xl font-semibold text-foreground">Who's checking in?</h1>

      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your name…"
          className="pl-9"
          autoFocus
        />
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={UserRoundIcon}
          title={query ? "No matching names" : "No active employees yet"}
          description={
            query
              ? "Check the spelling, or ask your branch admin to add you."
              : "Ask your branch admin to add employees in the dashboard."
          }
        />
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {filtered.map((employee) => (
            <Button
              key={employee.id}
              variant="outline"
              onClick={() => onSelect(employee)}
              className="h-auto justify-start gap-3 px-4 py-3 text-left"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRoundIcon className="size-4" />
              </div>
              <span className="min-w-0 flex-1 truncate font-medium">{employee.name}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
