"use client";

import { Loader2, Package } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";

import type { OrderWithUser } from "@/components/order/types";

const IMAGE_CACHE_MAX = 200;
const imageCache = new Map<string, { url: string; is_primary: boolean }[]>();

function imageCacheSet(key: string, value: { url: string; is_primary: boolean }[]) {
  if (imageCache.has(key)) imageCache.delete(key);
  imageCache.set(key, value);
  while (imageCache.size > IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value;
    if (oldest === undefined) break;
    imageCache.delete(oldest);
  }
}

async function fetchProductImages(orderItemIds: string[]) {
  return adminApi.getAll<{
    id: string;
    products: { product_images: { url: string; is_primary: boolean }[] } | null;
  }>("order_items", {
    select: "id, products(product_images(url, is_primary))",
    filters: { "id.in": orderItemIds.join(",") },
  });
}

function readCachedImages(items: { id: string }[]) {
  const cached = new Map<string, { url: string; is_primary: boolean }[]>();
  for (const item of items) {
    const c = imageCache.get(item.id);
    if (c) cached.set(item.id, c);
  }
  return cached;
}

function useProductImages(items: OrderWithUser["order_items"], enabled: boolean) {
  const [images, setImages] = useState<Map<string, { url: string; is_primary: boolean }[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || loading || items.length === 0) return;
    const itemIds = items.map((item) => item.id);
    const needsFetch = itemIds.some((id) => !imageCache.has(id));
    if (!needsFetch) {
      // Module-level cache hit — populate state from cache instead of a fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImages(readCachedImages(items));
      return;
    }
    setLoading(true);
    fetchProductImages(itemIds)
      .then((data) => {
        const result = new Map<string, { url: string; is_primary: boolean }[]>();
        for (const item of data) {
          const imgs = item.products?.product_images ?? [];
          imageCacheSet(item.id, imgs);
          result.set(item.id, imgs);
        }
        setImages(result);
      })
      .catch((err) => {
        log.warn("order_product_images_fetch_failed", {
          error: err instanceof Error ? err.message : String(err),
          itemCount: items.length,
        });
      })
      .finally(() => setLoading(false));
  }, [enabled, items, loading]);

  return { images, loading };
}

interface TooltipItemProps {
  item: OrderWithUser["order_items"][number];
  itemImages: { url: string; is_primary: boolean }[];
  loading: boolean;
}

function TooltipItem({ item, itemImages, loading }: TooltipItemProps) {
  const primaryImage = itemImages.find((img) => img.is_primary);
  const image = primaryImage || itemImages[0];
  return (
    <div className="flex items-center gap-2">
      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {loading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={item.products?.name || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm whitespace-normal line-clamp-1">{item.products?.name}</div>
        {item.variant_name && (
          <div className="text-xs text-muted-foreground">{item.variant_name}</div>
        )}
        <div className="text-xs text-muted-foreground">x{item.quantity}</div>
      </div>
    </div>
  );
}

export const ProductHoverTooltip = memo(function ProductHoverTooltip({
  items,
}: {
  items: OrderWithUser["order_items"];
}) {
  const [hovered, setHovered] = useState(false);
  const { images, loading } = useProductImages(items, hovered);

  const productItems = [...items]
    .filter((item) => item.products?.name)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (productItems.length === 0) return <span className="text-muted-foreground">-</span>;

  const displayText = productItems
    .map((item) => `${item.products?.name} x${item.quantity}`)
    .join(", ");

  return (
    // Hover-only tooltip wrapper inside a clickable table row: onClick stops the
    // row navigation; mouseenter triggers lazy image fetch. Not an interactive element itself.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="relative max-w-[320px] group/products"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
    >
      <div className="text-sm truncate">{displayText}</div>
      <div className="cursor-default absolute left-0 top-full z-50 hidden group-hover/products:block bg-popover border rounded-md shadow-md p-2 text-sm w-[320px] max-h-[280px] overflow-y-auto">
        <div className="space-y-2">
          {productItems.map((item) => (
            <TooltipItem
              key={item.id}
              item={item}
              itemImages={images.get(item.id) ?? []}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
