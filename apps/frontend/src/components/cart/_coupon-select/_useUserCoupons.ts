"use client";

import { useCallback, useState } from "react";

import { type CouponData } from "@/components/profile/CouponCard";
import { createClient } from "@/lib/supabase/client";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { SupabaseClient } from "@supabase/supabase-js";

const SCOPE_TABLE_MAP: Record<string, string> = {
  product: "coupon_products",
  category: "coupon_categories",
  brand: "coupon_brands",
};

const SCOPE_ID_FIELD_MAP: Record<string, string> = {
  product: "product_id",
  category: "category_id",
  brand: "brand_id",
};

type CouponEmbed = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  max_discount_amount: number | null;
  end_date: string | null;
  is_active: boolean;
  start_date: string | null;
  scope: "all" | "product" | "category" | "brand";
  max_applicable_qty: number | null;
  usage_limit_per_user: number | null;
};

type UserCouponEmbedded = {
  id: string;
  coupon_id: string;
  coupons: CouponEmbed | null;
};

function computeCouponStatus(
  coupon: CouponEmbed,
  userUsageCount: number,
  now: Date,
): "active" | "used" | "expired" {
  const perUserLimit = coupon.usage_limit_per_user ?? 1;
  if (userUsageCount >= perUserLimit) return "used";
  if (coupon.end_date && parseAsUTC(coupon.end_date) < now) return "expired";
  if (!coupon.is_active) return "expired";
  return "active";
}

function mapUserCouponToData(
  uc: UserCouponEmbedded & { coupons: CouponEmbed },
  usageCountMap: Map<string, number>,
  now: Date,
): CouponData {
  const c = uc.coupons;
  const userUsageCount = usageCountMap.get(c.id) ?? 0;
  return {
    id: uc.id,
    coupon_id: c.id,
    code: c.code,
    type: c.type,
    discount_value: Number(c.discount_value),
    max_discount_amount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
    end_date: c.end_date,
    is_active: c.is_active,
    status: computeCouponStatus(c, userUsageCount, now),
    scope: c.scope || "all",
    scope_item_ids: [] as string[],
    max_applicable_qty: c.max_applicable_qty ? Number(c.max_applicable_qty) : null,
  };
}

interface ScopeQuery {
  idField: string;
  couponIds: string[];
}

function groupCouponsByScopeTable(coupons: CouponData[]): Map<string, ScopeQuery> {
  const byTable = new Map<string, ScopeQuery>();
  for (const coupon of coupons) {
    if (!coupon.scope || coupon.scope === "all") continue;
    const table = SCOPE_TABLE_MAP[coupon.scope];
    const idField = SCOPE_ID_FIELD_MAP[coupon.scope];
    if (!table || !idField) continue;
    const bucket = byTable.get(table);
    if (bucket) bucket.couponIds.push(coupon.coupon_id);
    else byTable.set(table, { idField, couponIds: [coupon.coupon_id] });
  }
  return byTable;
}

async function fetchScopeItems(
  supabase: SupabaseClient,
  scopedByTable: Map<string, ScopeQuery>,
): Promise<Map<string, string[]>> {
  const untypedFrom = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        in: (
          col: string,
          vals: string[],
        ) => PromiseLike<{
          data: Array<Record<string, string>> | null;
        }>;
      };
    };
  };
  const tableQueries = await Promise.all(
    [...scopedByTable.entries()].map(async ([table, { idField, couponIds }]) => {
      const { data } = await untypedFrom
        .from(table)
        .select(`coupon_id, ${idField}`)
        .in("coupon_id", couponIds);
      return { idField, rows: data ?? [] };
    }),
  );

  const scopeItemsByCoupon = new Map<string, string[]>();
  for (const { idField, rows } of tableQueries) {
    for (const row of rows) {
      const couponId = row.coupon_id;
      const itemId = row[idField];
      if (!couponId || !itemId) continue;
      const existing = scopeItemsByCoupon.get(couponId);
      if (existing) existing.push(itemId);
      else scopeItemsByCoupon.set(couponId, [itemId]);
    }
  }
  return scopeItemsByCoupon;
}

async function fetchUserCouponData(
  supabase: SupabaseClient,
  userId: string,
): Promise<CouponData[]> {
  const { data: userCoupons } = await supabase
    .from("user_coupons")
    .select(
      "id, coupon_id, coupons(id, code, type, discount_value, max_discount_amount, end_date, is_active, start_date, scope, max_applicable_qty, usage_limit_per_user)",
    )
    .eq("user_id", userId)
    .returns<UserCouponEmbedded[]>();

  const { data: usages } = await supabase
    .from("coupon_usages")
    .select("coupon_id")
    .eq("user_id", userId);

  const usageCountMap = new Map<string, number>();
  for (const u of usages ?? []) {
    usageCountMap.set(u.coupon_id, (usageCountMap.get(u.coupon_id) ?? 0) + 1);
  }

  const now = new Date();
  const activeCoupons = (userCoupons ?? [])
    .filter((uc): uc is UserCouponEmbedded & { coupons: CouponEmbed } => uc.coupons !== null)
    .map((uc) => mapUserCouponToData(uc, usageCountMap, now))
    .filter((c) => c.status === "active");

  const scopedByTable = groupCouponsByScopeTable(activeCoupons);
  if (scopedByTable.size > 0) {
    const scopeItemsByCoupon = await fetchScopeItems(supabase, scopedByTable);
    for (const coupon of activeCoupons) {
      if (coupon.scope && coupon.scope !== "all") {
        coupon.scope_item_ids = scopeItemsByCoupon.get(coupon.coupon_id) ?? [];
      }
    }
  }
  return activeCoupons;
}

export function useUserCoupons() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await fetchUserCouponData(supabase, user.id);
    setCoupons(data);
    setLoading(false);
  }, []);

  return { coupons, loading, fetchCoupons };
}
