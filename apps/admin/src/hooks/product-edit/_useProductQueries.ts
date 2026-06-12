"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { queryKeys } from "@/lib/query-keys";

import { type ProductDetail } from "./_draft";

import type { Product } from "@/components/product/types";

const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price,
  discount_price,
  stock_quantity,
  status,
  brand_id,
  original_url,
  metadata,
  created_at,
  updated_at,
  brands (id, name),
  product_variants (id, sku, name, price, discount_price, stock_quantity, status),
  product_images (id, url, alt_text, is_primary, sort_order, variant_id),
  product_categories (category_id)
`;

type ProductDetailRow = {
  id: string;
  type: string;
  content: string;
  sort_order: number;
};

type RichDescriptionRow = {
  content: string | null;
  images: string[] | null;
};

async function fetchProductDetails(productId: string): Promise<ProductDetail[]> {
  try {
    const details = await adminApi.getAll<ProductDetailRow>("product_details", {
      filters: { "product_id.eq": productId },
      order: "sort_order.asc",
    });
    return details.map((d) => ({ id: d.id, type: d.type, content: d.content }));
  } catch {
    return [];
  }
}

async function fetchRichDescription(
  productId: string,
  logErrors: boolean,
): Promise<{ richDesc: string; richImgs: string[] }> {
  try {
    const rows = await adminApi.getAll<RichDescriptionRow>("product_rich_descriptions", {
      filters: { "product_id.eq": productId },
    });
    if (rows.length === 0) return { richDesc: "", richImgs: [] };
    return {
      richDesc: rows[0].content ?? "",
      richImgs: Array.isArray(rows[0].images) ? rows[0].images : [],
    };
  } catch (err) {
    if (logErrors) log.error("rich_descriptions_fetch_failed", err);
    return { richDesc: "", richImgs: [] };
  }
}

async function fetchProductWithExtras(
  productId: string,
  logErrors: boolean,
): Promise<{
  product: Product;
  productDetailsData: ProductDetail[];
  richDesc: string;
  richImgs: string[];
}> {
  const product = await adminApi.getById<Product>("products", productId, {
    select: PRODUCT_SELECT,
  });
  const productDetailsData = await fetchProductDetails(product.id);
  const { richDesc, richImgs } = await fetchRichDescription(product.id, logErrors);
  return { product, productDetailsData, richDesc, richImgs };
}

export function useProductDetailQuery(id: string, isNew: boolean) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProductWithExtras(id, true),
    enabled: !isNew,
  });
}

export function useDuplicateProductQuery(duplicateId: string | undefined, isNew: boolean) {
  return useQuery({
    queryKey: queryKeys.products.detail(duplicateId ?? ""),
    queryFn: () => fetchProductWithExtras(duplicateId!, false),
    enabled: isNew && !!duplicateId,
  });
}
