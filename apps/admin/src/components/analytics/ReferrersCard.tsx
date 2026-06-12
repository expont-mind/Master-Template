"use client";

import { Globe } from "lucide-react";

import type { StatItem } from "./types";

interface ReferrersCardProps {
  data: StatItem[];
}

export function ReferrersCard({ data }: ReferrersCardProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">
        Мэдээлэл байхгүй
      </div>
    );
  }

  // Group by display name and sum totals
  const grouped = new Map<string, number>();
  for (const item of data) {
    const name = formatReferrer(item.key);
    grouped.set(name, (grouped.get(name) ?? 0) + item.total);
  }
  const merged = [...grouped.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const total = merged.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-2">
      {merged.slice(0, 5).map((item) => {
        const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;

        return (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="ml-2 shrink-0 font-medium">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}

function formatReferrer(referrer: string): string {
  if (!referrer || referrer === "(direct)") return "Шууд хандалт";
  if (referrer.includes("google")) return "Google";
  if (referrer.includes("facebook")) return "Facebook";
  if (referrer.includes("instagram")) return "Instagram";
  if (referrer.includes("twitter") || referrer.includes("x.com")) return "X (Twitter)";

  // Extract domain name
  try {
    const url = new URL(referrer.startsWith("http") ? referrer : `https://${referrer}`);
    return url.hostname.replace("www.", "");
  } catch {
    return referrer;
  }
}
