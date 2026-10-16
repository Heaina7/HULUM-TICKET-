"use client";

import { CalendarDaysIcon, ClockIcon, HistoryIcon, MegaphoneIcon, ShieldIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShiftsSection } from "@/app/(dashboard)/settings/shifts-section";
import { PasswordSection } from "@/app/(dashboard)/settings/password-section";
import { HolidaysSection } from "@/app/(dashboard)/settings/holidays-section";
import { AnnouncementsSection } from "@/app/(dashboard)/settings/announcements-section";
import { AuditLogSection } from "@/app/(dashboard)/settings/audit-log-section";
import type { Announcement, AuditLog, Holiday, Shift } from "@/types";

interface BranchAdminData {
  role: "branch_admin";
  branchId: number;
  shifts: Shift[];
  checkoutEnabled: boolean;
}

interface SuperAdminData {
  role: "super_admin";
  holidays: Holiday[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
}

export function SettingsView({ data }: { data: BranchAdminData | SuperAdminData }) {
  if (data.role === "branch_admin") {
    return (
      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts">
            <ClockIcon /> Shifts
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldIcon /> Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="shifts">
          <ShiftsSection
            branchId={data.branchId}
            initialShifts={data.shifts}
            initialCheckoutEnabled={data.checkoutEnabled}
          />
        </TabsContent>
        <TabsContent value="security">
          <PasswordSection />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Tabs defaultValue="holidays">
      <TabsList>
        <TabsTrigger value="holidays">
          <CalendarDaysIcon /> Holidays
        </TabsTrigger>
        <TabsTrigger value="announcements">
          <MegaphoneIcon /> Announcements
        </TabsTrigger>
        <TabsTrigger value="audit">
          <HistoryIcon /> Audit log
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldIcon /> Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="holidays">
        <HolidaysSection initialHolidays={data.holidays} />
      </TabsContent>
      <TabsContent value="announcements">
        <AnnouncementsSection initialAnnouncements={data.announcements} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLogSection logs={data.auditLogs} />
      </TabsContent>
      <TabsContent value="security">
        <PasswordSection />
      </TabsContent>
    </Tabs>
  );
}
