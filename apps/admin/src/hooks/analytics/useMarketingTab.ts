"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { AnalyticsDateRange } from "./useAnalyticsDateRange";
import type { CouponAnalyticsData } from "@/components/analytics/business/types";

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

interface SmsCampaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export function useMarketingTab(dr: AnalyticsDateRange, isActive: boolean) {
  const couponQuery = useQuery({
    queryKey: queryKeys.analytics.marketing(dr.fromIso, dr.toIso),
    queryFn: () =>
      adminApi.rpc<CouponAnalyticsData[]>("get_coupon_analytics", {
        p_date_from: dr.isAllTime ? null : dr.fromIso,
        p_date_to: dr.isAllTime ? null : dr.toIso,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const smsQuery = useQuery({
    queryKey: [...queryKeys.analytics.marketing(dr.fromIso, dr.toIso), "sms"],
    queryFn: () =>
      adminApi.getAll<SmsCampaign>("sms_campaigns", {
        select: "id,name,status,total_recipients,sent_count,failed_count,created_at",
        order: "created_at.desc",
        limit: 10,
      }),
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  // Use getAllPaginated with limit=1 to get count from X-Total-Count header
  const smsLogsQuery = useQuery({
    queryKey: [...queryKeys.analytics.marketing(dr.fromIso, dr.toIso), "sms_logs_count"],
    queryFn: async () => {
      const { totalCount } = await adminApi.getAllPaginated<{ id: string }>("sms_logs", {
        select: "id",
        filters: dr.isAllTime
          ? undefined
          : { "created_at.gte": dr.fromIso, "created_at.lt": dr.toIso },
        limit: 1,
      });
      return totalCount ?? 0;
    },
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const smsBalanceQuery = useQuery({
    queryKey: [...queryKeys.analytics.marketing(dr.fromIso, dr.toIso), "sms_balance"],
    queryFn: async () => {
      const data = await adminApi.getAll<{ key: string; value: string }>("settings", {
        filters: { "key.eq": "sms_balance" },
        limit: 1,
      });
      return data[0]?.value ? Number(data[0].value) : 0;
    },
    enabled: isActive,
    ...QUERY_CONFIG,
  });

  const couponData = couponQuery.data?.[0] ?? null;
  const smsCampaigns = smsQuery.data ?? [];
  const smsSent = smsLogsQuery.data ?? 0;
  const smsBalance = smsBalanceQuery.data ?? 0;

  const isLoading = couponQuery.isLoading;

  return {
    couponData,
    smsCampaigns,
    smsSent,
    smsBalance,
    smsLoading: smsQuery.isLoading,
    isLoading,
  };
}
