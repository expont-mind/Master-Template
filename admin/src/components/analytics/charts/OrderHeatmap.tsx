"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/analytics/shared/ChartCard";
import type { HeatmapCell } from "@/components/analytics/business/types";

interface OrderHeatmapProps {
  data: HeatmapCell[];
  isLoading: boolean;
}

const DAY_LABELS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}`);

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-muted";
  const intensity = value / max;
  if (intensity > 0.75) return "bg-emerald-600";
  if (intensity > 0.5) return "bg-emerald-500";
  if (intensity > 0.25) return "bg-emerald-400";
  if (intensity > 0.1) return "bg-emerald-300";
  return "bg-emerald-200";
}

export function OrderHeatmap({ data, isLoading }: OrderHeatmapProps) {
  const { grid, max } = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const cell of data) {
      if (cell.day_of_week >= 0 && cell.day_of_week < 7 && cell.hour_of_day >= 0 && cell.hour_of_day < 24) {
        grid[cell.day_of_week][cell.hour_of_day] = cell.order_count;
        if (cell.order_count > max) max = cell.order_count;
      }
    }
    return { grid, max };
  }, [data]);

  return (
    <ChartCard title="Захиалгын цагийн хуваарилалт" isLoading={isLoading} isEmpty={data.length === 0} height={280}>
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-8 shrink-0" />
            {HOUR_LABELS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                {Number(h) % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {grid.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-8 shrink-0 text-xs text-muted-foreground text-right pr-2">
                {DAY_LABELS[dayIdx]}
              </div>
              {row.map((count, hourIdx) => (
                <div
                  key={hourIdx}
                  className={`flex-1 aspect-square rounded-sm ${getColor(count, max)} transition-colors`}
                  title={`${DAY_LABELS[dayIdx]} ${hourIdx}:00 — ${count} захиалга`}
                />
              ))}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-muted-foreground">
            <span>Бага</span>
            <div className="h-3 w-3 rounded-sm bg-emerald-200" />
            <div className="h-3 w-3 rounded-sm bg-emerald-300" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400" />
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <div className="h-3 w-3 rounded-sm bg-emerald-600" />
            <span>Их</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
