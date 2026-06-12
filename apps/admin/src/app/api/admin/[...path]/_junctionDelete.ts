import { NextResponse } from "next/server";

import type { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

const JUNCTION_TABLES = new Set([
  "product_categories",
  "wishlist_items",
  "coupon_products",
  "coupon_categories",
  "coupon_brands",
]);

const COUPON_JUNCTION_TABLES = new Set(["coupon_products", "coupon_categories", "coupon_brands"]);

export function isJunctionTable(table: string): boolean {
  return JUNCTION_TABLES.has(table);
}

/**
 * Composite-key delete for junction tables. The plain `?id=...` delete
 * doesn't work on tables where the primary key spans two columns (e.g.
 * product_categories uses product_id + category_id). This handles those
 * shapes by reading the relevant ids off the query string.
 *
 * Returns the response when a junction delete was performed, or null when
 * the caller should fall through to the standard delete-by-id flow.
 */
export async function handleJunctionDelete(input: {
  supabase: AdminClient;
  table: string;
  searchParams: URLSearchParams;
}): Promise<NextResponse | null> {
  const { supabase, table, searchParams } = input;
  const productId = searchParams.get("product_id");
  const categoryId = searchParams.get("category_id");
  const couponId = searchParams.get("coupon_id");

  if (table === "product_categories" && productId && categoryId) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("product_id", productId)
      .eq("category_id", categoryId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (table === "product_categories" && productId) {
    const { error } = await supabase.from(table).delete().eq("product_id", productId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (COUPON_JUNCTION_TABLES.has(table) && couponId) {
    const { error } = await supabase.from(table).delete().eq("coupon_id", couponId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return null;
}
