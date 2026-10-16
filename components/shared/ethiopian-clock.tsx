"use client";

import { useEffect, useState } from "react";
import { calcEthDate, calcEthTime } from "@/lib/ethiopian-calendar";
import { cn } from "@/lib/utils";

export function EthiopianClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => {
      setNow(new Date());
      setFlip((f) => !f);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className={cn("h-9 w-40 animate-pulse rounded-md bg-sidebar-accent/40", className)} />;
  }

  const date = calcEthDate(now);
  const time = calcEthTime(now);

  return (
    <div className={cn("flex items-center gap-2.5 font-display text-sidebar-foreground", className)}>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] tracking-wide text-sidebar-foreground/50">
          {date.dow}, {date.day} {date.month} {date.year}
        </span>
        <span
          key={now.getSeconds()}
          className={cn(
            "text-sm font-semibold tabular-nums text-gold",
            flip && "animate-board-flip"
          )}
        >
          {time.tod} {time.hm}:{time.sec}
        </span>
      </div>
    </div>
  );
}
