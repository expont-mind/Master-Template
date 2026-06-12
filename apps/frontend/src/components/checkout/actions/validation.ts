"use server";

import { createAdminClient } from "@/lib/supabase/admin";

import type { OrderItemPayload } from "./_shared";

type ProductRow = {
  id: string;
  name: string;
  is_active: boolean;
  stock_quantity: number;
};
type VariantRow = { id: string; stock_quantity: number; status: string };

function isItemAvailable(
  item: OrderItemPayload,
  productMap: Map<string, ProductRow>,
  variantMap: Map<string, VariantRow>,
): boolean {
  const product = productMap.get(item.productId);
  if (!product || !product.is_active) return false;
  if (item.variantId) {
    const variant = variantMap.get(item.variantId);
    return !!variant && variant.status === "active" && variant.stock_quantity >= item.quantity;
  }
  return product.stock_quantity >= item.quantity;
}

export async function validateCartItems(
  items: OrderItemPayload[],
): Promise<{ valid: true } | { valid: false; unavailableItems: string[]; error: string }> {
  if (!items || items.length === 0) {
    return { valid: false, unavailableItems: [], error: "Сагс хоосон байна" };
  }

  const admin = createAdminClient();
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items.map((i) => i.variantId).filter((id): id is string => id != null);
  const uniqueVariantIds = [...new Set(variantIds)];

  // Previously this only checked `is_active`, letting users land on
  // the checkout page with stock-0 items and only discover the
  // problem after filling the address and hitting "pay". Now it
  // mirrors the full validateOrderItems check (product active +
  // variant active + stock ≥ requested qty) so the warning surfaces
  // the moment the page loads.
  const [productsResult, variantsResult] = await Promise.all([
    admin.from("products").select("id, name, is_active, stock_quantity").in("id", productIds),
    uniqueVariantIds.length > 0
      ? admin
          .from("product_variants")
          .select("id, stock_quantity, status")
          .in("id", uniqueVariantIds)
      : Promise.resolve({ data: [] as VariantRow[] }),
  ]);

  const productMap = new Map((productsResult.data ?? []).map((p) => [p.id, p]));
  const variantMap = new Map((variantsResult.data ?? []).map((v) => [v.id, v]));

  const unavailable: string[] = [];
  for (const item of items) {
    if (!isItemAvailable(item, productMap, variantMap)) {
      unavailable.push(item.name);
    }
  }

  if (unavailable.length > 0) {
    return {
      valid: false,
      unavailableItems: unavailable,
      error: `Дараах бүтээгдэхүүн нөөц хүрэлцэхгүй эсвэл идэвхгүй: ${unavailable.join(", ")}`,
    };
  }
  return { valid: true };
}
