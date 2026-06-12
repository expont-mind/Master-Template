"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

import type { ReactNode } from "react";

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  resultCount?: number;
  resultLabel?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Хайх...",
  resultCount,
  resultLabel = "бичлэг",
  children,
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
      <div className="relative flex-1 w-full md:w-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-10"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {children && <div className="flex gap-2 w-full md:w-auto">{children}</div>}
      {actions}
      {resultCount !== undefined && (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} {resultLabel}
        </div>
      )}
    </div>
  );
}
