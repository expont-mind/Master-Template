"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { getCartProducts, syncLocalToServerCart } from "@/lib/queries/cart";

async function handleSignIn(userId: string) {
  const store = useCartStore.getState();
  store.setUser(userId);

  // Wait for store hydration if it hasn't happened yet
  if (!store.isHydrated) {
    await new Promise<void>((resolve) => {
      const unsub = useCartStore.subscribe((state) => {
        if (state.isHydrated) {
          unsub();
          resolve();
        }
      });
    });
  }

  try {
    const localItems = useCartStore.getState().items;

    if (localItems.length > 0) {
      // Local has items → local is source of truth.
      // Full sync: push local to server AND delete server items not in local.
      const itemsToSync = localItems.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id ?? null,
        quantity: item.quantity,
      }));
      await syncLocalToServerCart(userId, itemsToSync);
      // No need to loadFromServer — local is already correct
    } else {
      // Local is empty → load from server (new device / cleared browser)
      const serverCartItems = await getCartProducts(userId);
      useCartStore.getState().loadFromServer(serverCartItems);
    }
  } catch {
    // Keep local data on sync failure
  }
}

// Validate the persisted selectedCoupon against the server. If the coupon
// was deleted, expired, or otherwise invalidated, clear it from the store
// so the checkout page doesn't try to apply a stale one.
async function validateSelectedCoupon() {
  const { selectedCoupon, setSelectedCoupon } = useCartStore.getState();
  if (!selectedCoupon) return;

  try {
    const supabase = createClient();
    // We type-cast to `any` to avoid coupling to the generated DB types here;
    // the Coupons table shape is independently maintained by admin migrations.
    const { data, error } = await (supabase as any)
      .from("coupons")
      .select("id, is_active, valid_until")
      .eq("id", selectedCoupon.coupon_id)
      .maybeSingle();

    if (error) {
      // Don't clear on a transient error; the user can still try to apply,
      // and the server-side checkout flow will reject if invalid.
      return;
    }

    const stillValid =
      data &&
      data.is_active !== false &&
      (!data.valid_until || new Date(data.valid_until).getTime() > Date.now());

    if (!stillValid) setSelectedCoupon(null);
  } catch {
    // Network/transient — don't punish the user.
  }
}

export function CartSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard against handleSignIn racing with itself when the initial getUser()
  // resolves at the same time as the SIGNED_IN event fires (page refresh
  // while logged in is the common trigger). Without this, two parallel
  // syncs can step on each other.
  const signInInFlightRef = useRef<Promise<void> | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const runSignIn = async (userId: string) => {
      // De-dup by user id — if a second event fires for the same user
      // while the first is still resolving, just wait for the first to
      // finish.
      if (
        signInInFlightRef.current !== null &&
        lastUserIdRef.current === userId
      ) {
        return signInInFlightRef.current;
      }
      lastUserIdRef.current = userId;
      const promise = handleSignIn(userId).finally(() => {
        if (signInInFlightRef.current === promise) {
          signInInFlightRef.current = null;
        }
      });
      signInInFlightRef.current = promise;
      return promise;
    };

    // Check initial auth state
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        runSignIn(data.user.id).then(() => {
          if (!cancelled) void validateSelectedCoupon();
        });
      } else {
        // Not signed in — still validate any persisted coupon so we don't
        // carry a stale one into the next session.
        void validateSelectedCoupon();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        runSignIn(session.user.id).then(() => {
          if (!cancelled) void validateSelectedCoupon();
        });
      } else if (event === "SIGNED_OUT") {
        useCartStore.getState().setUser(null);
        lastUserIdRef.current = null;
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
