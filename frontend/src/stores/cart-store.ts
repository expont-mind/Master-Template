import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, ProductVariant } from "@/types/product";
import type { Product } from "@/types/database";
import { log } from "@/lib/utils/logger";
import {
  addToServerCart,
  removeFromServerCart,
  updateServerCartQuantity,
  clearServerCart as clearServerCartApi,
} from "@/lib/queries/cart";

export interface SelectedCoupon {
  coupon_id: string;
  code: string;
  type: string;
  discount_value: number;
  max_discount_amount: number | null;
  scope: string;
  scope_item_ids: string[];
  max_applicable_qty: number | null;
}

interface CartStore {
  items: CartItem[];
  isHydrated: boolean;
  userId: string | null;
  selectedCoupon: SelectedCoupon | null;
  selectedPoints: number | null;

  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant | null,
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateVariant: (itemId: string, newVariant: ProductVariant) => void;
  clearCart: () => void;
  setHydrated: (state: boolean) => void;
  setSelectedCoupon: (coupon: SelectedCoupon | null) => void;
  setSelectedPoints: (points: number | null) => void;

  // Server sync
  setUser: (userId: string | null) => void;
  loadFromServer: (items: CartItem[]) => void;

  // Computed (as functions since Zustand doesn't have computed)
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      userId: null,
      selectedCoupon: null,
      selectedPoints: null,

      addItem: (product, quantity = 1, variant = null) => {
        set((state) => {
          // Check if item already exists (same product and variant)
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.variant?.id === variant?.id,
          );

          if (existingIndex > -1) {
            // Update quantity if exists
            const newItems = [...state.items];
            const newQty = newItems[existingIndex].quantity + quantity;
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newQty,
            };

            const { userId } = get();
            if (userId) {
              addToServerCart(
                userId,
                product.id,
                variant?.id ?? null,
                newQty,
              ).catch(() => {});
            }

            return { items: newItems };
          }

          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${variant?.id || "default"}-${Date.now()}`,
            product,
            quantity,
            variant,
          };

          const { userId } = get();
          if (userId) {
            addToServerCart(
              userId,
              product.id,
              variant?.id ?? null,
              quantity,
            ).catch(() => {});
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        const state = get();
        const item = state.items.find((i) => i.id === itemId);
        set({ items: state.items.filter((i) => i.id !== itemId) });

        if (state.userId && item) {
          removeFromServerCart(
            state.userId,
            item.product.id,
            item.variant?.id ?? null,
          ).catch(() => {});
        }
      },

      updateQuantity: (itemId, quantity) => {
        const state = get();
        const item = state.items.find((i) => i.id === itemId);
        const newQty = Math.max(1, quantity);

        set({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity: newQty } : i,
          ),
        });

        if (state.userId && item) {
          updateServerCartQuantity(
            state.userId,
            item.product.id,
            item.variant?.id ?? null,
            newQty,
          ).catch(() => {});
        }
      },

      updateVariant: (itemId, newVariant) => {
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
          (i) =>
            i.id !== itemId &&
            i.product.id === item.product.id &&
            i.variant?.id === newVariant.id,
        );

        if (duplicateItem) {
          // Merge: add quantity to existing, remove old
          const mergedQty = duplicateItem.quantity + item.quantity;
          set({
            items: state.items
              .filter((i) => i.id !== itemId)
              .map((i) =>
                i.id === duplicateItem.id ? { ...i, quantity: mergedQty } : i,
              ),
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
        } else {
          // Update variant in-place
          set({
            items: state.items.map((i) =>
              i.id === itemId ? { ...i, variant: newVariant } : i,
            ),
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
      },

      clearCart: () => {
        const state = get();
        set({ items: [], selectedCoupon: null, selectedPoints: null });
        if (state.userId) {
          clearServerCartApi(state.userId).catch(() => {});
        }
      },

      setSelectedCoupon: (coupon) => set({ selectedCoupon: coupon }),

      setSelectedPoints: (points) => set({ selectedPoints: points }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      setUser: (userId) => set({ userId }),

      loadFromServer: (serverItems) => {
        // Multi-tab safe merge: union local + server by (productId, variantId).
        // Server wins on quantity when both have an entry. Pure local-only
        // entries (added offline) survive so they aren't silently lost when
        // a parallel tab loads from server first.
        const localItems = get().items;
        if (serverItems.length === 0 && localItems.length > 0) {
          // Server is empty — keep local. Avoids wiping items on a failed
          // fetch or first-time sync where local is the source of truth.
          return;
        }

        const keyOf = (i: CartItem) =>
          `${i.product.id}|${i.variant?.id ?? "null"}`;

        const merged = new Map<string, CartItem>();
        // Local first, then server overrides quantity if same key exists.
        for (const item of localItems) merged.set(keyOf(item), item);
        for (const item of serverItems) {
          const k = keyOf(item);
          const existing = merged.get(k);
          if (existing) {
            // Server is authoritative for quantity once both sides agree.
            merged.set(k, { ...existing, quantity: item.quantity });
          } else {
            merged.set(k, item);
          }
        }
        set({ items: [...merged.values()] });
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          // Use variant price if available, otherwise product price
          // Also check for discount_price
          let price: number;
          if (item.variant) {
            price = item.variant.discount_price ?? item.variant.price;
          } else {
            price = item.product.discount_price ?? item.product.price;
          }
          return total + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, selectedCoupon: state.selectedCoupon, selectedPoints: state.selectedPoints }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
