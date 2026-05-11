"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CalendarDays } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getMonthOptions } from "@/lib/utils/date-range";

export function MonthSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Determine current selection from URL
  const monthParam = searchParams.get("month");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const currentValue = monthParam || (fromParam && toParam ? "custom" : "all");

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    fromParam ? new Date(fromParam) : undefined,
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    toParam ? new Date(toParam) : undefined,
  );

  const monthOptions = getMonthOptions();

  function handleChange(value: string) {
    const params = new URLSearchParams();
    if (value === "all") {
      // No params
    } else if (value === "custom") {
      // Keep existing date range or set defaults
      if (dateFrom && dateTo) {
        params.set("from", formatDate(dateFrom));
        params.set("to", formatDate(dateTo));
      }
    } else {
      // Month value
      params.set("month", value);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  function handleDateRangeChange(range: {
    from: Date | undefined;
    to: Date | undefined;
  }) {
    setDateFrom(range.from);
    setDateTo(range.to);
    if (range.from && range.to) {
      const params = new URLSearchParams();
      params.set("from", formatDate(range.from));
      params.set("to", formatDate(range.to));
      router.push(`/dashboard?${params.toString()}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Сар сонгох" />
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
      {currentValue === "custom" && (
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={handleDateRangeChange}
          className="w-[280px]"
        />
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
