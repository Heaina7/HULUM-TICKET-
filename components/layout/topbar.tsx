import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import type { Profile } from "@/types";

export function Topbar({ profile, branchName }: { profile: Profile; branchName?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <MobileNav role={profile.role} branchName={branchName} />

      <div className="flex-1" />

      <UserMenu
        username={profile.username}
        fullName={profile.full_name}
        roleLabel={profile.role === "super_admin" ? "Super Admin" : `Branch Admin · ${branchName ?? ""}`}
      />
    </header>
  );
}
