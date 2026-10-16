"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItemsForRole } from "@/components/layout/nav-items";
import { EthiopianClock } from "@/components/shared/ethiopian-clock";
import type { UserRole } from "@/types";

export function Sidebar({ role, branchName }: { role: UserRole; branchName?: string }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <Image src="/logo.png" alt="" width={28} height={32} className="h-7 w-auto shrink-0" priority />
        <div className="min-w-0">
          <p className="truncate font-display text-sm leading-tight font-semibold">Hulum Ticket</p>
          <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
            {role === "super_admin" ? "Super Admin" : (branchName ?? "Branch Admin")}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium",
                "text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3.5">
        <EthiopianClock />
      </div>
    </aside>
  );
}
