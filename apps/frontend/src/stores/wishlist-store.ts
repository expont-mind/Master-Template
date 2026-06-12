import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  addToServerWishlist,
  removeFromServerWishlist,
  clearServerWishlist as clearServerWishlistApi,
} from "@/lib/queries/wishlist";

import type { Product } from "@/types/database";

interface WishlistStore {
  items: Product[];
  isHydrated: boolean;
  userId: string | null;

  // Actions
  addItem: (product: Product) => void;
  insertItemAt: (product: Product, index: number) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setHydrated: (state: boolean) => void;

  // Server sync
  setUser: (userId: string | null) => void;
  loadFromServer: (products: Product[]) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      userId: null,

      addItem: (product) => {
        const state = get();
        if (state.items.some((item) => item.id === product.id)) return;
        set({ items: [...state.items, product] });
        if (state.userId) {
          addToServerWishlist(state.userId, product.id).catch(() => {});
        }
      },

      insertItemAt: (product, index) => {
        const state = get();
        if (state.items.some((item) => item.id === product.id)) return;
        const newItems = [...state.items];
        newItems.splice(Math.min(index, newItems.length), 0, product);
        set({ items: newItems });
        if (state.userId) {
          addToServerWishlist(state.userId, product.id).catch(() => {});
        }
      },

      removeItem: (productId) => {
        const state = get();
        set({ items: state.items.filter((item) => item.id !== productId) });
        if (state.userId) {
          removeFromServerWishlist(state.userId, productId).catch(() => {});
        }
      },

      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: () => {
        const state = get();
        set({ items: [] });
        if (state.userId) {
          clearServerWishlistApi(state.userId).catch(() => {});
        }
      },

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      setUser: (userId) => set({ userId }),

      loadFromServer: (products) => set({ items: products }),
    }),
    {
      name: "wishlist-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
