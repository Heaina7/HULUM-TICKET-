import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/services/profile";
import { getBranch, getBranches } from "@/services/branches";
import { AttendanceView } from "@/app/(dashboard)/attendance/attendance-view";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const { profile } = await getCurrentUser();

  const branches =
    profile.role === "super_admin"
      ? await getBranches()
      : profile.branch_id
        ? [await getBranch(profile.branch_id)].filter((b) => b !== null)
        : [];

  const initialBranchId =
    profile.role === "super_admin" ? (branches[0]?.id ?? 0) : (profile.branch_id ?? 0);

  return (
    <div>
      <PageHeader title="Attendance" description="Monthly attendance by employee." />
      <AttendanceView branches={branches} initialBranchId={initialBranchId} />
    </div>
  );
}
