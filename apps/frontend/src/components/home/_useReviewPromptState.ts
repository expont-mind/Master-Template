"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export interface OrderItem {
  id: string;
  product_id: string;
  products: {
    name: string;
    slug: string;
    description: string | null;
    images: string[];
  } | null;
}

export interface ReviewableOrder {
  id: string;
  created_at: string;
  items: OrderItem[];
}

interface RawOrderItem {
  id: string;
  product_id: string;
  products: {
    name: string;
    slug: string;
    description: string | null;
  } | null;
}

interface RawOrder {
  id: string;
  created_at: string;
  order_items: RawOrderItem[];
}

async function fetchLatestDeliveredOrder(): Promise<RawOrder | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, order_items(id, product_id, products(name, slug, description))")
    .eq("user_id", user.id)
    .eq("delivery_status", "delivered")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!orders || orders.length === 0) return null;
  return orders[0] as unknown as RawOrder;
}

async function fetchProductImagesMap(productIds: string[]): Promise<Map<string, string[]>> {
  const supabase = createClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url, sort_order")
    .in("product_id", productIds)
    .is("variant_id", null)
    .order("sort_order", { ascending: true });

  const imageMap = new Map<string, string[]>();
  for (const img of images ?? []) {
    const existing = imageMap.get(img.product_id) || [];
    existing.push(img.url);
    imageMap.set(img.product_id, existing);
  }
  return imageMap;
}

async function fetchReviewedProductIds(userId: string, productIds: string[]): Promise<Set<string>> {
  const supabase = createClient();
  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", productIds);

  return new Set((existingReviews ?? []).map((r) => r.product_id));
}

function attachImages(item: RawOrderItem, imageMap: Map<string, string[]>): OrderItem {
  return {
    id: item.id,
    product_id: item.product_id,
    products: item.products
      ? {
          ...item.products,
          images: imageMap.get(item.product_id) || [],
        }
      : null,
  };
}

export function useReviewPromptState() {
  const [order, setOrder] = useState<ReviewableOrder | null>(null);
  const [reviewableItems, setReviewableItems] = useState<OrderItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const fetchOrder = useCallback(async () => {
    const rawOrder = await fetchLatestDeliveredOrder();
    if (!rawOrder) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check localStorage for dismissed
    const dismissKey = `review-prompt-dismissed-${rawOrder.id}`;
    if (localStorage.getItem(dismissKey)) return;

    const productIds = rawOrder.order_items.map((item) => item.product_id).filter(Boolean);

    const [imageMap, reviewedProductIds] = await Promise.all([
      fetchProductImagesMap(productIds),
      fetchReviewedProductIds(user.id, productIds),
    ]);

    const items: OrderItem[] = rawOrder.order_items
      .filter((item) => !reviewedProductIds.has(item.product_id))
      .map((item) => attachImages(item, imageMap));

    if (items.length === 0) return;

    setOrder({
      id: rawOrder.id,
      created_at: rawOrder.created_at,
      items: rawOrder.order_items.map((item) => attachImages(item, imageMap)),
    });
    setReviewableItems(items);
  }, []);

  useEffect(() => {
    // Fetch-on-mount; setState calls inside fetchOrder run after async awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [fetchOrder]);

  const handleDismiss = useCallback(() => {
    if (order) {
      localStorage.setItem(`review-prompt-dismissed-${order.id}`, "true");
    }
    setDismissed(true);
  }, [order]);

  const finishReviewing = useCallback(() => {
    setReviewableItems([]);
  }, []);

  return {
    order,
    reviewableItems,
    dismissed,
    handleDismiss,
    finishReviewing,
  };
}
