import { createClient } from "@/lib/supabase/client";

import type { Product } from "@/types/database";

// Helper to fetch and attach product images from product_images table (with batching)
async function attachProductImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;

  const supabase = createClient();
  const productIds = products.map((p) => p.id);
  const imageMap = new Map<string, string[]>();

  // Fetch in parallel batches (URL length safe + low latency).
  const BATCH_SIZE = 50;
  const batches: string[][] = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    batches.push(productIds.slice(i, i + BATCH_SIZE));
  }
  const batchResults = await Promise.all(
    batches.map((batchIds) =>
      supabase
        .from("product_images")
        .select("product_id, url, sort_order")
        .in("product_id", batchIds)
        .is("variant_id", null)
        .order("sort_order", { ascending: true }),
    ),
  );
  for (const { data: images } of batchResults) {
    for (const img of images ?? []) {
      const existing = imageMap.get(img.product_id) || [];
      existing.push(img.url);
      imageMap.set(img.product_id, existing);
    }
  }

  if (imageMap.size === 0) return products;

  // Merge images into products
  return products.map((p) => {
    const productImages = imageMap.get(p.id);
    return productImages && productImages.length > 0 ? { ...p, images: productImages } : p;
  });
}

// Cache wishlist ID per user to avoid repeated lookups
const wishlistIdCache = new Map<string, string>();

async function getOrCreateDefaultWishlist(userId: string): Promise<string> {
  const cached = wishlistIdCache.get(userId);
  if (cached) return cached;

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Default")
    .maybeSingle();

  if (existing) {
    wishlistIdCache.set(userId, existing.id);
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("wishlists")
    .insert({ user_id: userId, name: "Default" })
    .select("id")
    .single();

  if (error) throw error;
  wishlistIdCache.set(userId, created!.id);
  return created!.id;
}

export async function getWishlistProducts(userId: string): Promise<Product[]> {
  const supabase = createClient();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Default")
    .maybeSingle();

  if (!wishlist) return [];

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("wishlist_id", wishlist.id);

  if (!items || items.length === 0) return [];

  const productIds = items.map((i) => i.product_id);

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_active", true);

  // Attach images from product_images table
  return attachProductImages((products ?? []) as Product[]);
}

export async function addToServerWishlist(userId: string, productId: string): Promise<void> {
  const wishlistId = await getOrCreateDefaultWishlist(userId);
  const supabase = createClient();

  await supabase.from("wishlist_items").upsert({ wishlist_id: wishlistId, product_id: productId });
}

export async function removeFromServerWishlist(userId: string, productId: string): Promise<void> {
  const supabase = createClient();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Default")
    .maybeSingle();

  if (!wishlist) return;

  await supabase
    .from("wishlist_items")
    .delete()
    .eq("wishlist_id", wishlist.id)
    .eq("product_id", productId);
}

export async function clearServerWishlist(userId: string): Promise<void> {
  const supabase = createClient();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Default")
    .maybeSingle();

  if (!wishlist) return;

  await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlist.id);
}

export async function syncLocalToServer(userId: string, productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const wishlistId = await getOrCreateDefaultWishlist(userId);
  const supabase = createClient();

  const items = productIds.map((productId) => ({
    wishlist_id: wishlistId,
    product_id: productId,
  }));

  await supabase.from("wishlist_items").upsert(items);
}

export function clearWishlistIdCache() {
  wishlistIdCache.clear();
}
