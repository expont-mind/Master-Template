// Private helpers split from cart-store.ts to keep the main create() body
// under max-lines-per-function. Each function takes `set` + `get` like a
// zustand slice creator. No business logic changes vs. the inlined versions.

import { addToServerCart, removeFromServerCart } from "@/lib/queries/cart";
import { log } from "@/lib/utils/logger";

import type { CartItem, ProductVariant } from "@/types/product";

interface UpdateVariantDeps {
  get: () => {
    items: CartItem[];
    userId: string | null;
  };
  set: (partial: { items: CartItem[] }) => void;
  itemId: string;
  newVariant: ProductVariant;
}

/**
 * Body of cart-store.updateVariant. Preserves the existing semantics:
 *   - If another cart entry already has (product, newVariant), merge their
 *     quantities and remove the original entry.
 *   - Otherwise update the variant in place.
 *   - Server sync: remove the old variant row, then add the new one. On
 *     failure, restore the local items to the pre-mutation snapshot so the
 *     UI matches what the server actually has.
 */
export function applyUpdateVariant({ get, set, itemId, newVariant }: UpdateVariantDeps): void {
  const state = get();
  const item = state.items.find((i) => i.id === itemId);
  if (!item) return;

  const oldVariantId = item.variant?.id ?? null;
  if (oldVariantId === newVariant.id) return;

  // Snapshot the local state before we mutate so we can roll back if
  // the server ops fail. Earlier code did fire-and-forget on both
  // server calls and could leave the server with neither variant when
  // the remove succeeded but the add failed.
  const previousItems = state.items;

  // Check if another cart item already has the same product + new variant
  const duplicateItem = state.items.find(
    (i) => i.id !== itemId && i.product.id === item.product.id && i.variant?.id === newVariant.id,
  );

  if (duplicateItem) {
    // Merge: add quantity to existing, remove old
    const mergedQty = duplicateItem.quantity + item.quantity;
    set({
      items: state.items
        .filter((i) => i.id !== itemId)
        .map((i) => (i.id === duplicateItem.id ? { ...i, quantity: mergedQty } : i)),
    });

    if (state.userId) {
      const userId = state.userId;
      void (async () => {
        try {
          // Sequence: remove old first, then add merged. If the add
          // fails, restore the old row so the server isn't left with
          // a missing item.
          await removeFromServerCart(userId, item.product.id, oldVariantId);
          await addToServerCart(userId, item.product.id, newVariant.id, mergedQty);
        } catch (err) {
          log.error("cart_update_variant_merge_sync_failed", err);
          set({ items: previousItems });
        }
      })();
    }
    return;
  }

  // Update variant in-place
  set({
    items: state.items.map((i) => (i.id === itemId ? { ...i, variant: newVariant } : i)),
  });

  if (state.userId) {
    const userId = state.userId;
    void (async () => {
      try {
        await removeFromServerCart(userId, item.product.id, oldVariantId);
        await addToServerCart(userId, item.product.id, newVariant.id, item.quantity);
      } catch (err) {
        log.error("cart_update_variant_in_place_sync_failed", err);
        set({ items: previousItems });
      }
    })();
  }
}

interface MergeFromServerDeps {
  localItems: CartItem[];
  serverItems: CartItem[];
}

/**
 * Pure merge used by loadFromServer.
 *
 * CRITICAL: when the server returns an empty result but local has items,
 * the merged result is `null` — the caller MUST refuse to overwrite the
 * local cart in that case. This guards against a failed server fetch
 * wiping a user's cart mid-checkout (race-condition guard).
 *
 * Otherwise: union by (productId, variantId). Server wins on quantity when
 * both sides have the key. Local-only entries (added offline) survive so
 * they aren't silently lost when a parallel tab loads from server first.
 */
export function mergeServerCart({
  localItems,
  serverItems,
}: MergeFromServerDeps): CartItem[] | null {
  if (serverItems.length === 0 && localItems.length > 0) {
    // Server is empty — keep local. Caller skips the set() call.
    return null;
  }

  const keyOf = (i: CartItem) => `${i.product.id}|${i.variant?.id ?? "null"}`;

  const merged = new Map<string, CartItem>();
  for (const item of localItems) merged.set(keyOf(item), item);
  for (const item of serverItems) {
    const k = keyOf(item);
    const existing = merged.get(k);
    if (existing) {
      merged.set(k, { ...existing, quantity: item.quantity });
    } else {
      merged.set(k, item);
    }
  }
  return [...merged.values()];
}
