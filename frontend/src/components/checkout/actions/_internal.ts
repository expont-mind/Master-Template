// Internal async helpers shared across the checkout server actions.
// These take an admin Supabase client as a parameter — they are NOT
// server actions themselves, so this file has no `"use server"` directive.

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";
import type { OrderItemPayload } from "./_shared";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Ensure a public.users row exists for the given auth user.
 * Fixes rare cases where the auth trigger silently fails,
 * causing FK violations on orders.user_id -> public.users(id).
 */
export async function ensurePublicUser(
  admin: AdminClient,
  user: User,
): Promise<void> {
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    const meta = user.user_metadata ?? {};
    await admin.from("users").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        first_name:
          meta.first_name ?? meta.given_name ??
          ((meta.full_name || meta.name || "").split(" ")[0] || null),
        last_name:
          meta.last_name ?? meta.family_name ??
          ((meta.full_name || meta.name || "").split(" ").slice(1).join(" ") || null),
        primary_phone: user.phone?.replace(/^\+?976/, "") ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      },
      { onConflict: "id" },
    );
  }
}

export async function validateOrderItems(
  admin: AdminClient,
  items: OrderItemPayload[],
): Promise<{ valid: true } | { valid: false; error: string }> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => id != null);
  const uniqueVariantIds = [...new Set(variantIds)];

  const [productsResult, variantsResult, activeVariantsResult] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, is_active, stock_quantity")
        .in("id", productIds),
      uniqueVariantIds.length > 0
        ? admin
            .from("product_variants")
            .select("id, product_id, name, stock_quantity, status")
            .in("id", uniqueVariantIds)
        : Promise.resolve({ data: [] as { id: string; product_id: string; name: string | null; stock_quantity: number; status: string }[] }),
      admin
        .from("product_variants")
        .select("product_id")
        .in("product_id", productIds)
        .eq("status", "active"),
    ]);

  const productMap = new Map(
    (productsResult.data ?? []).map((p) => [p.id, p]),
  );
  const variantMap = new Map(
    (variantsResult.data ?? []).map((v) => [v.id, v]),
  );
  const productsWithVariants = new Set(
    (activeVariantsResult.data ?? []).map((v) => v.product_id),
  );

  const errors: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product || !product.is_active) {
      errors.push(`"${item.name}" бүтээгдэхүүн олдсонгүй эсвэл идэвхгүй байна`);
      continue;
    }

    if (productsWithVariants.has(item.productId) && !item.variantId) {
      errors.push(`"${item.name}" бүтээгдэхүүний хувилбар сонгогдоогүй байна`);
      continue;
    }

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.status !== "active") {
        errors.push(`"${item.name}" бүтээгдэхүүний сонгосон хувилбар олдсонгүй`);
        continue;
      }
      if (variant.stock_quantity <= 0) {
        errors.push(`"${item.name}" дууссан байна`);
      } else if (variant.stock_quantity < item.quantity) {
        errors.push(
          `"${item.name}" ${variant.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        );
      }
    } else {
      if (product.stock_quantity <= 0) {
        errors.push(`"${item.name}" дууссан байна`);
      } else if (product.stock_quantity < item.quantity) {
        errors.push(
          `"${item.name}" ${product.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join(". ") };
  }

  return { valid: true };
}

export async function calculateDeliveryFee(
  admin: AdminClient,
  city: string,
  itemsTotal: number,
): Promise<number> {
  const { data: zones } = await admin
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true);

  if (!zones || zones.length === 0) return 0;

  const activeZone =
    city === DELIVERY_ZONES_CONFIG.capital
      ? zones.find((z) => z.name === DELIVERY_ZONES_CONFIG.capital)
      : zones.find((z) => z.name === DELIVERY_ZONES_CONFIG.rural);

  if (!activeZone) return 0;

  if (
    activeZone.is_free_delivery_enabled &&
    activeZone.free_delivery_threshold != null &&
    itemsTotal >= activeZone.free_delivery_threshold
  ) {
    return 0;
  }

  return activeZone.delivery_fee;
}

export async function recordCouponUsage(
  admin: AdminClient,
  userId: string,
  orderId: string,
  couponId: string,
  discountAmount: number,
) {
  try {
    const { data: coupon } = await admin
      .from("coupons")
      .select("usage_count, usage_limit, usage_limit_per_user")
      .eq("id", couponId)
      .single();

    if (coupon) {
      if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
        console.warn("[recordCouponUsage] Global usage limit reached");
        return;
      }

      const perUserLimit = coupon.usage_limit_per_user ?? 1;
      const { count } = await admin
        .from("coupon_usages")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", couponId)
        .eq("user_id", userId);

      if ((count ?? 0) >= perUserLimit) {
        console.warn("[recordCouponUsage] Per-user usage limit reached");
        return;
      }
    }

    await admin.from("coupon_usages").insert({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });

    if (coupon) {
      await admin
        .from("coupons")
        .update({ usage_count: (coupon.usage_count ?? 0) + 1 })
        .eq("id", couponId);
    }
  } catch (err) {
    console.error("[recordCouponUsage] Error:", err);
  }
}

export async function recordPointUsage(
  admin: AdminClient,
  userId: string,
  orderId: string,
  orderNumber: string,
  pointsUsed: number,
) {
  try {
    const { data: existing } = await admin
      .from("point_transactions")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "used")
      .maybeSingle();

    if (existing) return;

    const { data } = await admin
      .from("point_transactions")
      .select("amount")
      .eq("user_id", userId);

    const balance = (data ?? []).reduce((sum, t) => sum + t.amount, 0);

    if (balance < pointsUsed) {
      console.warn("[recordPointUsage] Insufficient point balance");
      return;
    }

    await admin.from("point_transactions").insert({
      user_id: userId,
      order_id: orderId,
      type: "used",
      amount: -pointsUsed,
      description: `Захиалга #${orderNumber}`,
    });
  } catch (err) {
    console.error("[recordPointUsage] Error:", err);
  }
}

export async function awardPointsForOrder(
  admin: AdminClient,
  userId: string,
  orderId: string,
  orderNumber: string,
  orderTotal: number,
) {
  try {
    const pointsEarned = Math.floor(orderTotal * 0.02);
    if (pointsEarned <= 0) return;

    const { data: existing } = await admin
      .from("point_transactions")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "earned")
      .maybeSingle();

    if (existing) return;

    await admin.from("point_transactions").insert({
      user_id: userId,
      order_id: orderId,
      type: "earned",
      amount: pointsEarned,
      description: `Захиалга #${orderNumber}`,
    });
  } catch (err) {
    console.error("[awardPointsForOrder] Error:", err);
  }
}
