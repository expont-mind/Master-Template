"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { log } from "@/lib/observability/log";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to our observability pipeline. Switching to
    // Sentry/Axiom later is a single-file change in lib/observability/log.ts.
    log.error("admin_route_error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="size-12 text-amber-500" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Хуудсыг ачааллахад алдаа гарлаа. Дахин оролдоно уу. Асуудал үргэлжилбэл техникийн багтай
          холбогдоно уу.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground/70">Алдааны код: {error.digest}</p>
        ) : null}
      </div>
      <Button onClick={() => reset()} variant="default">
        <RefreshCw className="mr-2 size-4" />
        Дахин оролдох
      </Button>
    </div>
  );
}
