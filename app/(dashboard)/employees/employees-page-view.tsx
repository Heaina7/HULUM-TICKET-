"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeesList } from "@/app/(dashboard)/employees/employees-list";
import type { Branch, Employee } from "@/types";

export function EmployeesPageView({
  branches,
  initialBranchId,
  initialEmployees,
}: {
  branches: Branch[];
  initialBranchId: number;
  initialEmployees: Employee[];
}) {
  const [branchId, setBranchId] = useState(initialBranchId);

  return (
    <div>
      {branches.length > 1 && (
        <div className="mb-4">
          <Select value={String(branchId)} onValueChange={(v) => setBranchId(Number(v))}>
            <SelectTrigger className="w-56">
              <SelectValue />
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

      <EmployeesList
        branchId={branchId}
        initialEmployees={branchId === initialBranchId ? initialEmployees : []}
      />
    </div>
  );
}
