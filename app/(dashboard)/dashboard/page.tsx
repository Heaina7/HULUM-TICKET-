import Link from "next/link";
import { CheckCircle2Icon, ClockIcon, InboxIcon, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/services/profile";
import { getBranch, getBranches } from "@/services/branches";
import { getAllBranchesTodaySummary, getBranchTodaySummary } from "@/services/dashboard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile } = await getCurrentUser();

  if (profile.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  return <BranchAdminDashboard branchId={profile.branch_id!} />;
}

async function BranchAdminDashboard({ branchId }: { branchId: number }) {
  const [branch, summary] = await Promise.all([
    getBranch(branchId),
    getBranchTodaySummary(branchId),
  ]);

  return (
    <div>
      <PageHeader
        title={`Good to see you${branch ? ` — ${branch.name}` : ""}`}
        description="Today's attendance at a glance."
        actions={
          summary.pending > 0 ? (
            <Button asChild>
              <Link href="/requests">
                <InboxIcon /> Review {summary.pending} pending
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active employees" value={summary.totalActive} icon={UsersIcon} />
        <StatCard label="Present today" value={summary.present} icon={CheckCircle2Icon} tone="success" />
        <StatCard label="Late today" value={summary.late} icon={ClockIcon} tone="warning" />
        <StatCard label="Pending requests" value={summary.pending} icon={InboxIcon} tone="destructive" />
      </div>
    </div>
  );
}

async function SuperAdminDashboard() {
  const branches = await getBranches();
  const summaries = await getAllBranchesTodaySummary(branches.map((b) => b.id));

  const totals = branches.reduce(
    (acc, b) => {
      const s = summaries[b.id];
      return {
        totalActive: acc.totalActive + (s?.totalActive ?? 0),
        present: acc.present + (s?.present ?? 0),
        late: acc.late + (s?.late ?? 0),
        pending: acc.pending + (s?.pending ?? 0),
      };
    },
    { totalActive: 0, present: 0, late: 0, pending: 0 }
  );

  return (
    <div>
      <PageHeader title="System overview" description={`Across all ${branches.length} branches, today.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active employees" value={totals.totalActive} icon={UsersIcon} />
        <StatCard label="Present today" value={totals.present} icon={CheckCircle2Icon} tone="success" />
        <StatCard label="Late today" value={totals.late} icon={ClockIcon} tone="warning" />
        <StatCard label="Pending across branches" value={totals.pending} icon={InboxIcon} tone="destructive" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>By branch</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Branch</th>
                  <th className="px-5 py-2.5 font-medium">Active</th>
                  <th className="px-5 py-2.5 font-medium">Present</th>
                  <th className="px-5 py-2.5 font-medium">Late</th>
                  <th className="px-5 py-2.5 font-medium">Pending</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => {
                  const s = summaries[b.id];
                  return (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{b.name}</td>
                      <td className="px-5 py-3 tabular-nums text-muted-foreground">{s?.totalActive ?? 0}</td>
                      <td className="px-5 py-3 tabular-nums text-muted-foreground">{s?.present ?? 0}</td>
                      <td className="px-5 py-3">
                        {s && s.late > 0 ? (
                          <Badge variant="warning">{s.late} late</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {s && s.pending > 0 ? (
                          <Badge variant="destructive">{s.pending}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
