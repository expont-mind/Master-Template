"use client";

import { useCallback, useEffect, useState } from "react";

import { type CouponData } from "@/components/profile/CouponCard";
import { createClient } from "@/lib/supabase/client";

import {
  buildUsageCountMap,
  mapUserCouponsToCouponData,
  type UserCouponEmbedded,
} from "./_couponMappers";
import { enrichCouponsWithScopeNames } from "./_couponScopeEnrichment";

interface UseCouponListResult {
  coupons: CouponData[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useCouponList(onCouponCountChange?: (count: number) => void): UseCouponListResult {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // The user_coupons→coupons relation isn't declared in our hand-rolled
    // Database type's Relationships array, so PostgREST embed inference
    // fails. Narrow the shape at the query boundary.
    const { data: userCoupons } = await supabase
      .from("user_coupons")
      .select(
        "id, coupon_id, coupons(id, code, type, discount_value, max_discount_amount, end_date, is_active, start_date, scope, max_applicable_qty, usage_limit_per_user)",
      )
      .eq("user_id", user.id)
      .returns<UserCouponEmbedded[]>();

    const { data: usages } = await supabase
      .from("coupon_usages")
      .select("coupon_id")
      .eq("user_id", user.id);

    const usageCountMap = buildUsageCountMap(usages);
    const mapped = mapUserCouponsToCouponData(userCoupons, usageCountMap);
    await enrichCouponsWithScopeNames(mapped, supabase);

    setCoupons(mapped);
    onCouponCountChange?.(mapped.filter((c) => c.status === "active").length);
    setLoading(false);
  }, [onCouponCountChange]);

  useEffect(() => {
    // Fetch-on-mount; setState calls inside fetchCoupons run after async awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCoupons();
  }, [fetchCoupons]);

  return { coupons, loading, refetch: fetchCoupons };
}
