import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/services/profile";
import { getBranches } from "@/services/branches";
import { getAdmins } from "@/services/admins";
import { AdminsList } from "@/app/(dashboard)/admins/admins-list";

export const metadata = { title: "Admins" };

export default async function AdminsPage() {
  const { id, profile } = await getCurrentUser();
  if (profile.role !== "super_admin") redirect("/dashboard");

  const [admins, branches] = await Promise.all([getAdmins(), getBranches()]);

  return (
    <div>
      <PageHeader title="Admins" description="Branch and super admin accounts." />
      <AdminsList initialAdmins={admins} branches={branches} currentUserId={id} />
    </div>
  );
}
