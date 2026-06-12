"use client";

import { useMemo, useState, useCallback } from "react";

import { parseMonthRange, getCurrentMonth } from "@/lib/utils/date-range";

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function useAnalyticsDateRange() {
  const [initialMonth] = useState(() => getCurrentMonth());
  const [period, setPeriodRaw] = useState<string>(initialMonth);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(
    () => parseMonthRange(initialMonth)!,
  );

  const setPeriod = useCallback((value: string) => {
    setPeriodRaw(value);
    if (value === "all") {
      setDateRange({ from: new Date("2020-01-01T00:00:00Z"), to: new Date() });
      return;
    }
    const monthRange = parseMonthRange(value);
    if (monthRange) {
      setDateRange(monthRange);
    }
  }, []);

  const setCustomDateRange = useCallback((range: { from: Date; to: Date }) => {
    setPeriodRaw("custom");
    setDateRange(range);
  }, []);

  const { from, to } = dateRange;
  const periodDays = daysBetween(from, to);
  const isAllTime = period === "all";

  const prevFrom = useMemo(() => {
    const d = new Date(from);
    d.setDate(d.getDate() - periodDays);
    return d;
  }, [from, periodDays]);

  const fromIso = useMemo(() => from.toISOString(), [from]);
  const toIso = useMemo(() => to.toISOString(), [to]);
  const prevFromIso = useMemo(() => prevFrom.toISOString(), [prevFrom]);

  return {
    period,
    setPeriod,
    dateRange,
    setCustomDateRange,
    from,
    to,
    fromIso,
    toIso,
    prevFromIso,
    prevFrom,
    periodDays,
    isAllTime,
  };
}

export type AnalyticsDateRange = ReturnType<typeof useAnalyticsDateRange>;
