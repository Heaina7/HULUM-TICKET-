import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/services/profile";
import { getBranch } from "@/services/branches";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentUser();

  const branch = profile.branch_id ? await getBranch(profile.branch_id) : null;

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar role={profile.role} branchName={branch?.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} branchName={branch?.name} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
