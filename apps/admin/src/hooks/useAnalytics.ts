"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { AnalyticsData, DateRange } from "@/components/analytics/types";

async function fetchAnalytics(days: string): Promise<AnalyticsData> {
  const response = await fetch(`/api/admin/analytics?days=${days}`);
  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
}

export function useAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", dateRange],
    queryFn: () => fetchAnalytics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    error,
    dateRange,
    setDateRange,
  };
}
