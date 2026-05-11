"use client";

import type { StatItem } from "./types";

interface TopPagesTableProps {
  data: StatItem[];
}

export function TopPagesTable({ data }: TopPagesTableProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        Мэдээлэл байхгүй
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((item) => {
        const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate font-medium" title={item.key}>
                {formatPath(item.key)}
              </span>
              <span className="ml-2 shrink-0 text-muted-foreground">
                {item.total.toLocaleString()} ({percentage}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatPath(path: string): string {
  if (path === "/") return "Нүүр хуудас";
  return path;
}
