import { adminApi } from "@/lib/admin-api";

import { saveScopeItems } from "./_couponScope";

import type { CouponFormData } from "@/components/coupon/types";

export function generateCouponName(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н купон`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н купон`;
  return "Үнэгүй хүргэлт купон";
}

export function validateCouponForm(
  formData: CouponFormData,
  scopeItemIds: string[],
): string | null {
  if (!formData.code.trim()) {
    return "Купоны кодыг заавал оруулна уу.";
  }
  if (formData.discount_value <= 0) {
    return "Хөнгөлөлтийн утгыг зөв оруулна уу. (0-ээс их байх ёстой)";
  }
  if (formData.scope !== "all" && scopeItemIds.length === 0) {
    return "Хамрах хүрээний зүйл сонгоно уу";
  }
  return null;
}

export async function persistCoupon(
  id: string | undefined,
  formData: CouponFormData,
  scopeItemIds: string[],
): Promise<void> {
  const name = generateCouponName(formData.type, formData.discount_value);
  let couponId: string;

  if (id) {
    const result = await adminApi.update("coupons", id, {
      ...formData,
      name,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    couponId = (result as { id: string }).id ?? id;
  } else {
    const result = await adminApi.insert("coupons", {
      ...formData,
      name,
      usage_count: 0,
    } as Record<string, unknown>);
    couponId = (result as { id: string }).id;
  }

  await saveScopeItems(couponId, formData.scope, scopeItemIds);
}

export function randomCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
