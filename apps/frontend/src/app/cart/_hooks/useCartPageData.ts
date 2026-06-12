"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";

import type { DeliveryZone } from "@/types/database";

interface UseCartPageDataReturn {
  pointBalance: number | null;
  deliveryZones: DeliveryZone[];
  productCategoryMap: Record<string, string[]>;
}

/**
 * Fetches the supplementary data the cart page needs from Supabase:
 *   - User's point balance (sum of point_transactions amounts)
 *   - Active delivery zones (for fee calculation)
 *   - Product → categories mapping (for category-scope coupon evaluation)
 *
 * Also enforces a side-effect: removes cart items whose underlying product
 * has been deactivated since the user added it. Runs once on hydration.
 */
export function useCartPageData(): UseCartPageDataReturn {
  const items = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const removeItem = useCartStore((s) => s.removeItem);

  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchPointBalance = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("point_transactions")
        .select("amount")
        .eq("user_id", user.id);
      const total = (data ?? []).reduce((sum, t) => sum + t.amount, 0);
      setPointBalance(total);
    };
    fetchPointBalance();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setDeliveryZones(data);
      });
  }, []);

  // Remove cart items whose product is no longer active. Runs once after
  // hydration so the user sees the cleanup immediately on load.
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;
    const productIds = [...new Set(items.map((i) => i.product.id))];
    const supabase = createClient();
    supabase
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("is_active", true)
      .then(({ data }) => {
        const activeIds = new Set((data ?? []).map((p) => p.id));
        const inactiveItems = items.filter((i) => !activeIds.has(i.product.id));
        for (const item of inactiveItems) {
          removeItem(item.id);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  useEffect(() => {
    const productIds = items.map((i) => i.product.id);
    if (productIds.length === 0) return;
    const supabase = createClient();
    supabase
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string[]> = {};
        for (const row of data) {
          if (!map[row.product_id]) map[row.product_id] = [];
          map[row.product_id].push(row.category_id);
        }
        setProductCategoryMap(map);
      });
  }, [items]);

  return { pointBalance, deliveryZones, productCategoryMap };
}
