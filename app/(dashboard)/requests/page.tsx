import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/services/profile";
import { RequestsQueue } from "@/app/(dashboard)/requests/requests-queue";

export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  const { profile } = await getCurrentUser();

  // Super admins operate across branches and don't have one branch's queue
  // to approve — mirrors the original app's tab visibility.
  if (profile.role !== "branch_admin" || !profile.branch_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: records } = await supabase
    .from("attendance")
    .select("*")
    .eq("branch_id", profile.branch_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Requests"
        description="Check-in and check-out requests waiting for your approval."
      />
      <RequestsQueue branchId={profile.branch_id} initialRecords={records ?? []} />
    </div>
  );
}
