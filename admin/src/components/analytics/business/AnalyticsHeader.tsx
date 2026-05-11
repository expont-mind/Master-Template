"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getMonthOptions } from "@/lib/utils/date-range";

interface AnalyticsHeaderProps {
  period: string;
  onPeriodChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function AnalyticsHeader({
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
}: AnalyticsHeaderProps) {
  const monthOptions = getMonthOptions();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Аналитик</h1>
        <p className="text-muted-foreground text-sm">
          Бизнесийн гүйцэтгэлийн дэлгэрэнгүй тайлан
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх хугацаа</SelectItem>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Сараар</SelectLabel>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="custom">Өөр хугацаа</SelectItem>
          </SelectContent>
        </Select>
        {period === "custom" && (
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(range) => {
              if (range.from && range.to) {
                onDateRangeChange({ from: range.from, to: range.to });
              }
            }}
            className="w-[280px]"
          />
        )}
      </div>
    </div>
  );
}
