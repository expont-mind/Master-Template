"use client";

import { SITE } from "@repo/config-site";
import { notFound } from "next/navigation";
import { useState } from "react";

import { useWishlistStore } from "@/stores/wishlist-store";

import { EmptyWishlist } from "./_components/EmptyWishlist";
import { LoadingSkeleton } from "./_components/LoadingSkeleton";
import { LoginPrompt } from "./_components/LoginPrompt";
import { UndoSnackbar } from "./_components/UndoSnackbar";
import { WishlistGrid } from "./_components/WishlistGrid";
import { useUndoSnackbar } from "./_hooks/useUndoSnackbar";
import { useWishlistAuth } from "./_hooks/useWishlistAuth";

export default function WishlistPage() {
  if (!SITE.features.wishlist) notFound();

  const items = useWishlistStore((s) => s.items);
  const isHydrated = useWishlistStore((s) => s.isHydrated);
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const auth = useWishlistAuth();
  const snackbar = useUndoSnackbar();
  const [showClearModal, setShowClearModal] = useState(false);

  if (!isHydrated || !auth.authChecked) {
    return <LoadingSkeleton />;
  }

  if (!auth.user) {
    return <LoginPrompt auth={auth} />;
  }

  if (items.length === 0 && !snackbar.removedProduct) {
    return <EmptyWishlist itemsLength={items.length} />;
  }

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <WishlistGrid
        items={items}
        showClearModal={showClearModal}
        onOpenClearModal={() => setShowClearModal(true)}
        onCloseClearModal={() => setShowClearModal(false)}
        onClearWishlist={() => {
          clearWishlist();
          setShowClearModal(false);
        }}
      />
      <UndoSnackbar snackbar={snackbar} />
    </div>
  );
}
