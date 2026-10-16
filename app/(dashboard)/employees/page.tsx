import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/services/profile";
import { getBranches } from "@/services/branches";
import { getEmployees } from "@/services/employees";
import { EmployeesPageView } from "@/app/(dashboard)/employees/employees-page-view";

export const metadata = { title: "Employees" };

export default async function EmployeesPage() {
  const { profile } = await getCurrentUser();

  // Branch admins only ever operate on their own branch, so the switcher
  // (which only renders when branches.length > 1) never appears for them.
  const branches = profile.role === "super_admin" ? await getBranches() : [];
  const initialBranchId = profile.role === "super_admin" ? (branches[0]?.id ?? 0) : profile.branch_id!;
  const initialEmployees = initialBranchId ? await getEmployees(initialBranchId) : [];

  return (
    <div>
      <PageHeader title="Employees" description="Everyone who checks in at this branch." />
      <EmployeesPageView
        branches={branches}
        initialBranchId={initialBranchId}
        initialEmployees={initialEmployees}
      />
    </div>
  );
}
