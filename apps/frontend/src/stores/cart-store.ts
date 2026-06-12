import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  addToServerCart,
  removeFromServerCart,
  updateServerCartQuantity,
  clearServerCart as clearServerCartApi,
} from "@/lib/queries/cart";

import { applyUpdateVariant, mergeServerCart } from "./_cartActions";

import type { Product } from "@/types/database";
import type { CartItem, ProductVariant } from "@/types/product";

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
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
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
            (item) => item.product.id === product.id && item.variant?.id === variant?.id,
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            const newQty = newItems[existingIndex].quantity + quantity;
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newQty,
            };

            const { userId } = get();
            if (userId) {
              addToServerCart(userId, product.id, variant?.id ?? null, newQty).catch(() => {});
            }
            return { items: newItems };
          }

          const newItem: CartItem = {
            id: `${product.id}-${variant?.id || "default"}-${Date.now()}`,
            product,
            quantity,
            variant,
          };

          const { userId } = get();
          if (userId) {
            addToServerCart(userId, product.id, variant?.id ?? null, quantity).catch(() => {});
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        const state = get();
        const item = state.items.find((i) => i.id === itemId);
        set({ items: state.items.filter((i) => i.id !== itemId) });

        if (state.userId && item) {
          removeFromServerCart(state.userId, item.product.id, item.variant?.id ?? null).catch(
            () => {},
          );
        }
      },

      updateQuantity: (itemId, quantity) => {
        const state = get();
        const item = state.items.find((i) => i.id === itemId);
        const newQty = Math.max(1, quantity);

        set({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)),
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

      updateVariant: (itemId, newVariant) => applyUpdateVariant({ get, set, itemId, newVariant }),

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
        // Multi-tab safe merge. CRITICAL: mergeServerCart returns null when
        // the server returns empty but local has items — we MUST NOT
        // overwrite local in that case (race-condition guard). See
        // mergeServerCart docstring.
        const merged = mergeServerCart({ localItems: get().items, serverItems });
        if (merged === null) return;
        set({ items: merged });
      },

      getItemCount: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((total, item) => {
          // Use variant price if available, otherwise product price
          // Also check for discount_price
          let price: number;
          if (item.variant) {
            price = item.variant.discount_price ?? item.variant.price;
          } else {
            price = item.product.discount_price ?? item.product.price;
          }
          return total + price * item.quantity;
        }, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        selectedCoupon: state.selectedCoupon,
        selectedPoints: state.selectedPoints,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
