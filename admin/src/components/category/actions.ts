"use server";

import { redis } from "@/lib/redis";
import { createAdminClient } from "@/lib/supabase/server";

// Wildcard delete via SCAN-emulating `keys()` + batched `del()`. Upstash
// `redis.keys(pattern)` is O(N) over keyspace; safe here because the
// touched keysets are small (per-product detail blobs and a single
// tree key) and admin runs this only on category state changes.
async function deleteByPattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.warn(`Redis del ${pattern} failed:`, error);
    return 0;
  }
}

// Bust frontend Redis caches that might surface stale category data.
// Called after admin toggles a category's is_active state (delete or edit).
// Keys mirror `frontend/src/lib/redis/client.ts` cacheKeys.
export async function invalidateCategoryCaches(): Promise<void> {
  await Promise.all([
    deleteByPattern("products:detail:*"),
    deleteByPattern("products:list:*"),
    deleteByPattern("home:category-products:*"),
    redis.del("categories:tree").catch(() => {}),
    redis.del("homepage:banners:carousel").catch(() => {}),
    redis.del("homepage:banners:promo").catch(() => {}),
  ]);
}

// Server-side cascade deactivation. Walks the category tree from the
// supplied root using a fresh DB read (avoids stale React state and the
// 1000-row default fetch cap on the admin's client snapshot), then
// flips is_active=false on the entire subtree in one bulk update.
// Returns the number of categories deactivated, including the root.
export async function deactivateCategorySubtree(
  rootId: string
): Promise<{ updated: number }> {
  const supabase = createAdminClient();

  // Pull every category's id/parent_id via paginated batches so we
  // don't get cut off at Postgrest's default ~1000-row limit on big
  // catalogs (the BFS needs to see the entire forest).
  const all: { id: string; parent_id: string | null }[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from("categories")
      .select("id, parent_id")
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as { id: string; parent_id: string | null }[]));
    if (data.length < PAGE) break;
  }

  // BFS the subtree under rootId.
  const ids = new Set<string>([rootId]);
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const c of all) {
      if (c.parent_id === current && !ids.has(c.id)) {
        ids.add(c.id);
        queue.push(c.id);
      }
    }
  }

  const idArray = Array.from(ids);

  // Single bulk UPDATE — atomic from PostgREST's perspective.
  // `as never` works around TS instantiation depth on the typed client.
  const { error: updateError } = await supabase
    .from("categories")
    .update({ is_active: false } as never)
    .in("id", idArray);
  if (updateError) throw updateError;

  await invalidateCategoryCaches();

  return { updated: idArray.length };
}
