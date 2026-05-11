import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/database";
import type { CartItem, ProductVariant } from "@/types/product";

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;

  const supabase = createClient();
  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  const BATCH_SIZE = 50;
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const batchIds = productIds.slice(i, i + BATCH_SIZE);
    const { data: images } = await supabase
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", batchIds)
      .is("variant_id", null)
      .order("sort_order", { ascending: true });

    for (const img of images ?? []) {
      const existing = imageMap.get(img.product_id) || [];
      existing.push(img.url);
      imageMap.set(img.product_id, existing);
    }
  }

  if (imageMap.size === 0) return products;

  return products.map((p) => {
    const productImages = imageMap.get(p.id);
    return productImages && productImages.length > 0
      ? { ...p, images: productImages }
      : p;
  });
}

// Helper to upsert a cart item, handling NULL variant_id correctly
async function upsertCartItem(
  supabase: ReturnType<typeof createClient>,
  row: {
    user_id: string;
    product_id: string;
    variant_id: string | null;
    quantity: number;
  },
): Promise<boolean> {
  // Partial unique indexes don't work with Supabase .upsert() onConflict,
  // so always use check-then-insert/update pattern.
  let query = supabase
    .from("cart_items")
    .select("id")
    .eq("user_id", row.user_id)
    .eq("product_id", row.product_id);

  if (row.variant_id !== null) {
    query = query.eq("variant_id", row.variant_id);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: row.quantity })
      .eq("id", existing.id);
    if (error) {
      console.error("[upsertCartItem] update error:", error.message);
      return false;
    }
  } else {
    const { error } = await supabase.from("cart_items").insert(row);
    if (error) {
      // Race condition: another call inserted between our SELECT and INSERT
      if (error.code === "23505") {
        let retryQuery = supabase
          .from("cart_items")
          .update({ quantity: row.quantity })
          .eq("user_id", row.user_id)
          .eq("product_id", row.product_id);
        if (row.variant_id !== null) {
          retryQuery = retryQuery.eq("variant_id", row.variant_id);
        } else {
          retryQuery = retryQuery.is("variant_id", null);
        }
        const { error: retryError } = await retryQuery;
        if (retryError) {
          console.error("[upsertCartItem] retry update error:", retryError.message);
          return false;
        }
      } else {
        console.error("[upsertCartItem] insert error:", error.message);
        return false;
      }
    }
  }
  return true;
}

// Fetch server cart items and hydrate into full CartItem objects
export async function getCartProducts(userId: string): Promise<CartItem[]> {
  const supabase = createClient();

  const { data: cartRows } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity")
    .eq("user_id", userId);

  if (!cartRows || cartRows.length === 0) return [];

  const productIds = [...new Set(cartRows.map((r) => r.product_id))];
  const variantIds = cartRows
    .map((r) => r.variant_id)
    .filter((id): id is string => id !== null);
  const uniqueVariantIds = [...new Set(variantIds)];

  // Fetch products and variants in parallel
  const [productsResult, variantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("is_active", true),
    uniqueVariantIds.length > 0
      ? supabase
          .from("product_variants")
          .select(
            "id, name, sku, price, discount_price, stock_quantity, is_default, option_values",
          )
          .in("id", uniqueVariantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const products = await attachProductImages(
    (productsResult.data ?? []) as Product[],
  );

  // Fetch variant images
  const variantImageMap = new Map<string, string[]>();
  if (uniqueVariantIds.length > 0) {
    const { data: variantImages } = await supabase
      .from("product_images")
      .select("variant_id, url, sort_order")
      .in("variant_id", uniqueVariantIds)
      .order("sort_order", { ascending: true });
    for (const img of variantImages ?? []) {
      if (!img.variant_id) continue;
      const existing = variantImageMap.get(img.variant_id) || [];
      existing.push(img.url);
      variantImageMap.set(img.variant_id, existing);
    }
  }

  // Build lookup maps
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map<string, ProductVariant>();
  for (const v of (variantsResult.data ?? []) as unknown as Array<{
    id: string;
    name: string | null;
    sku: string | null;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    is_default: boolean;
    option_values: string[] | null;
  }>) {
    variantMap.set(v.id, {
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      discount_price: v.discount_price,
      stock_quantity: v.stock_quantity,
      is_default: v.is_default,
      images: variantImageMap.get(v.id),
      option_values: v.option_values,
    });
  }

  // Assemble CartItem[] with regenerated client-side IDs
  const cartItems: CartItem[] = [];
  for (const row of cartRows) {
    const product = productMap.get(row.product_id);
    if (!product) continue; // product deactivated/deleted

    const variant = row.variant_id
      ? (variantMap.get(row.variant_id) ?? null)
      : null;

    cartItems.push({
      id: `${row.product_id}-${row.variant_id || "default"}-${Date.now()}`,
      product,
      quantity: row.quantity,
      variant,
    });
  }

  return cartItems;
}

export async function addToServerCart(
  userId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<void> {
  const supabase = createClient();
  await upsertCartItem(supabase, {
    user_id: userId,
    product_id: productId,
    variant_id: variantId,
    quantity,
  });
}

export async function updateServerCartQuantity(
  userId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<void> {
  const supabase = createClient();

  let query = supabase
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  await query;
}

export async function removeFromServerCart(
  userId: string,
  productId: string,
  variantId: string | null,
): Promise<void> {
  const supabase = createClient();

  let query = supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  await query;
}

export async function clearServerCart(userId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("cart_items").delete().eq("user_id", userId);
}

// Full two-way sync: push local items to server AND remove server items not in local.
// Local cart is the source of truth when the user has local items.
//
// Previous version did per-item DELETE inside a for-loop, which left the cart
// in an inconsistent state if the network dropped mid-loop. This version
// batches the DELETE into one .in() query so it's atomic from the client's
// view, then upserts the local items in parallel.
export async function syncLocalToServerCart(
  userId: string,
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
  }>,
): Promise<void> {
  const supabase = createClient();

  // Get existing server items
  const { data: existingItems } = await supabase
    .from("cart_items")
    .select("id, product_id, variant_id, quantity")
    .eq("user_id", userId);

  const localKeys = new Set<string>();
  for (const item of items) {
    localKeys.add(`${item.product_id}|${item.variant_id ?? "null"}`);
  }

  // Collect server-only IDs to delete in a single query.
  const idsToDelete: string[] = [];
  for (const serverItem of existingItems ?? []) {
    const key = `${serverItem.product_id}|${serverItem.variant_id ?? "null"}`;
    if (!localKeys.has(key)) idsToDelete.push(serverItem.id);
  }

  if (idsToDelete.length > 0) {
    await supabase.from("cart_items").delete().in("id", idsToDelete);
  }

  // Upsert local items to server in parallel. Each upsertCartItem call is
  // independent (different (product_id, variant_id) keys), so they can fan
  // out without ordering risk. Errors inside upsertCartItem are logged and
  // swallowed, so Promise.all won't reject.
  await Promise.all(
    items.map((item) =>
      upsertCartItem(supabase, {
        user_id: userId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }),
    ),
  );
}
