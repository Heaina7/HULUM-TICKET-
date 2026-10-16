import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/services/profile";
import { getBranches } from "@/services/branches";
import { BranchesList } from "@/app/(dashboard)/branches/branches-list";

export const metadata = { title: "Branches" };

export default async function BranchesPage() {
  const { profile } = await getCurrentUser();
  if (profile.role !== "super_admin") redirect("/dashboard");

  const branches = await getBranches();

  return (
    <div>
      <PageHeader title="Branches" description="Every station in the system." />
      <BranchesList initialBranches={branches} />
    </div>
  );
}
