"use client";

import { useEffect, useState } from "react";

import { validateCartItems } from "@/components/checkout/actions";
import { createClient } from "@/lib/supabase/client";

import type { OrderItemPayload } from "@/components/checkout/PaymentModal";
import type { DeliveryZone } from "@/types/database";
import type { CartItem as StoreCartItem } from "@/types/product";

interface UseCheckoutDataInput {
  cartItems: StoreCartItem[];
  orderItemsPayload: OrderItemPayload[];
}

interface UseCheckoutDataReturn {
  deliveryZones: DeliveryZone[];
  productCategoryMap: Record<string, string[]>;
  cartWarning: string | null;
}

/**
 * Fetches checkout-page side data from Supabase:
 *   - Active delivery zones (one-time on mount)
 *   - Product → category mapping for category-scope coupon evaluation
 *     (re-runs when cart items change; guards against stale fetches)
 *   - Cart validation (one-time on mount, after orderItemsPayload exists)
 *
 * Returns derived state only — no setters. The page treats these as read-only.
 */
export function useCheckoutData(input: UseCheckoutDataInput): UseCheckoutDataReturn {
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string[]>>({});
  const [cartWarning, setCartWarning] = useState<string | null>(null);

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

  // Re-fetch the product→categories map whenever cart items change.
  // The `cancelled` flag prevents a stale fetch (from a previous cartItems
  // snapshot) from overwriting the map after the user rapidly adds/removes
  // items — without it, an older in-flight request could resolve last and
  // replace the correct map.
  useEffect(() => {
    const productIds = input.cartItems.map((ci) => ci.product.id);
    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale map when cart empties; the data is derived from cart contents
      setProductCategoryMap({});
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const map: Record<string, string[]> = {};
        for (const row of data) {
          if (!map[row.product_id]) map[row.product_id] = [];
          map[row.product_id].push(row.category_id);
        }
        setProductCategoryMap(map);
      });
    return () => {
      cancelled = true;
    };
  }, [input.cartItems]);

  // Validate cart items once on mount only — products may have been
  // deactivated since they were added to the local-storage cart.
  useEffect(() => {
    if (input.orderItemsPayload.length === 0) return;
    validateCartItems(input.orderItemsPayload).then((result) => {
      if (!result.valid) {
        setCartWarning(result.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { deliveryZones, productCategoryMap, cartWarning };
}
