"use client";

import { useEffect } from "react";
import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-6 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangleIcon className="size-6" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {error.message || "This page couldn't load. Try again."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcwIcon /> Try again
      </Button>
    </div>
  );
}
