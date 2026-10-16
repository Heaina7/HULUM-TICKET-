import { PageHeader } from "@/components/shared/page-header";
import { getCurrentUser } from "@/services/profile";
import { getAnnouncements, getAuditLogs, getCheckoutEnabled, getHolidays, getShifts } from "@/services/settings";
import { SettingsView } from "@/app/(dashboard)/settings/settings-view";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await getCurrentUser();

  if (profile.role === "branch_admin") {
    const branchId = profile.branch_id!;
    const [shifts, checkoutEnabled] = await Promise.all([
      getShifts(branchId),
      getCheckoutEnabled(branchId),
    ]);

    return (
      <div>
        <PageHeader title="Settings" description="Shifts, check-out, and account security." />
        <SettingsView data={{ role: "branch_admin", branchId, shifts, checkoutEnabled }} />
      </div>
    );
  }

  const [holidays, announcements, auditLogs] = await Promise.all([
    getHolidays(),
    getAnnouncements(),
    getAuditLogs(),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="System-wide configuration and account security." />
      <SettingsView data={{ role: "super_admin", holidays, announcements, auditLogs }} />
    </div>
  );
}
