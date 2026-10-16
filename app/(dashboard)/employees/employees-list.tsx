"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusIcon, SearchIcon, UsersIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { EmployeeRow } from "@/app/(dashboard)/employees/employee-row";
import { EmployeeFormDialog } from "@/app/(dashboard)/employees/employee-form-dialog";
import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/types";

export function EmployeesList({
  branchId,
  initialEmployees,
}: {
  branchId: number;
  initialEmployees: Employee[];
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("branch_id", branchId)
      .order("active", { ascending: false })
      .order("name");
    if (data) setEmployees(data);
  }

  // Re-fetch whenever the selected branch changes (super admin switching
  // branches). Harmless minor double-fetch on first mount in exchange for
  // not needing a separate "did the branch change" ref.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? employees.filter((e) => e.name.toLowerCase().includes(q)) : employees;
    return {
      active: list.filter((e) => e.active),
      inactive: list.filter((e) => !e.active),
    };
  }, [employees, search]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon /> Add employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No employees yet"
          description="Add your first employee to start tracking attendance."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <PlusIcon /> Add employee
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Active ({filtered.active.length})
            </h2>
            {filtered.active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              filtered.active.map((e) => (
                <EmployeeRow
                  key={e.id}
                  employee={e}
                  onEdit={() => {
                    setEditing(e);
                    setFormOpen(true);
                  }}
                  onChanged={refresh}
                />
              ))
            )}
          </section>

          {filtered.inactive.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Inactive ({filtered.inactive.length})
              </h2>
              {filtered.inactive.map((e) => (
                <EmployeeRow
                  key={e.id}
                  employee={e}
                  onEdit={() => {
                    setEditing(e);
                    setFormOpen(true);
                  }}
                  onChanged={refresh}
                />
              ))}
            </section>
          )}
        </div>
      )}

      <EmployeeFormDialog
        branchId={branchId}
        employee={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />
    </div>
  );
}
