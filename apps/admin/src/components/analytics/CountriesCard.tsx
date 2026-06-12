"use client";

import { COUNTRY_NAMES } from "./types";

import type { StatItem } from "./types";

interface CountriesCardProps {
  data: StatItem[];
}

export function CountriesCard({ data }: CountriesCardProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-sm text-muted-foreground">
        Мэдээлэл байхгүй
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item) => {
        const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0;
        const countryName = COUNTRY_NAMES[item.key] || item.key;

        return (
          <div key={item.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{getFlagEmoji(item.key)}</span>
              <span>{countryName}</span>
            </div>
            <span className="font-medium">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
