import { parseAsUTC } from "@/lib/utils/formatters";

import type { CouponData } from "@/components/profile/CouponCard";

export type CouponStatus = "active" | "used" | "expired";

export type CouponEmbed = {
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

export type UserCouponEmbedded = {
  id: string;
  coupon_id: string;
  coupons: CouponEmbed | null;
};

export function buildUsageCountMap(
  usages: ReadonlyArray<{ coupon_id: string }> | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const u of usages ?? []) {
    map.set(u.coupon_id, (map.get(u.coupon_id) ?? 0) + 1);
  }
  return map;
}

function resolveStatus(coupon: CouponEmbed, userUsageCount: number, now: Date): CouponStatus {
  const perUserLimit = coupon.usage_limit_per_user ?? 1;
  if (userUsageCount >= perUserLimit) return "used";
  if (coupon.end_date && parseAsUTC(coupon.end_date) < now) return "expired";
  if (!coupon.is_active) return "expired";
  return "active";
}

export function mapUserCouponsToCouponData(
  userCoupons: ReadonlyArray<UserCouponEmbedded> | null | undefined,
  usageCountMap: Map<string, number>,
  now: Date = new Date(),
): CouponData[] {
  return (userCoupons ?? [])
    .filter((uc): uc is UserCouponEmbedded & { coupons: CouponEmbed } => uc.coupons !== null)
    .map((uc) => {
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
        status: resolveStatus(c, userUsageCount, now),
        scope: c.scope || "all",
        scope_item_names: [] as string[],
        max_applicable_qty: c.max_applicable_qty ? Number(c.max_applicable_qty) : null,
      };
    });
}
