"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/stores/wishlist-store";
import {
  getWishlistProducts,
  syncLocalToServer,
  clearWishlistIdCache,
} from "@/lib/queries/wishlist";

async function handleSignIn(userId: string) {
  const store = useWishlistStore.getState();
  store.setUser(userId);

  // Wait for store hydration if it hasn't happened yet
  if (!store.isHydrated) {
    await new Promise<void>((resolve) => {
      const unsub = useWishlistStore.subscribe((state) => {
        if (state.isHydrated) {
          unsub();
          resolve();
        }
      });
    });
  }

  try {
    const localProductIds = useWishlistStore
      .getState()
      .items.map((item) => item.id);

    // Push local items to server (upsert — safe for duplicates)
    if (localProductIds.length > 0) {
      await syncLocalToServer(userId, localProductIds);
    }

    // Load fresh product data from server (union of local + server items)
    const serverProducts = await getWishlistProducts(userId);
    useWishlistStore.getState().loadFromServer(serverProducts);
  } catch {
    // Keep local data on sync failure
  }
}

export function WishlistSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const supabase = createClient();

    // Check initial auth state
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        handleSignIn(data.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        handleSignIn(session.user.id);
      } else if (event === "SIGNED_OUT") {
        useWishlistStore.getState().setUser(null);
        clearWishlistIdCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
