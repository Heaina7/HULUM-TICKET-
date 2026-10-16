"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navItemsForRole } from "@/components/layout/nav-items";
import type { UserRole } from "@/types";

export function MobileNav({ role, branchName }: { role: UserRole; branchName?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle asChild>
            <div className="flex items-center gap-2.5 text-sidebar-foreground">
              <Image src="/logo.png" alt="" width={28} height={32} className="h-7 w-auto shrink-0" />
              <div className="min-w-0 text-left">
                <p className="truncate font-display text-sm leading-tight font-semibold">
                  Hulum Ticket
                </p>
                <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
                  {role === "super_admin" ? "Super Admin" : (branchName ?? "Branch Admin")}
                </p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2.5 text-sm font-medium",
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
      </SheetContent>
    </Sheet>
  );
}
