"use client";

import { Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MatchCountRowProps {
  matchCount: number;
  isCounting: boolean;
  isLoadingPreview: boolean;
  onPreview: () => void;
}

export function MatchCountRow({
  matchCount,
  isCounting,
  isLoadingPreview,
  onPreview,
}: MatchCountRowProps) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Тохирох хэрэглэгчид</span>
        {isCounting ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-sm font-semibold">{matchCount.toLocaleString()}</span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPreview}
        disabled={isCounting || matchCount === 0 || isLoadingPreview}
      >
        {isLoadingPreview ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Eye className="mr-1.5 h-3.5 w-3.5" />
        )}
        Харах
      </Button>
    </div>
  );
}
