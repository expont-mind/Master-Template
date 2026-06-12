"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { ClearCartModal } from "@/components/cart/ClearCartModal";
import { CouponSelectModal } from "@/components/cart/CouponSelectModal";
import { getCartCalculations } from "@/components/cart/getCartCalculations";
import { PointSelectModal } from "@/components/cart/PointSelectModal";
import { VariantEditSheet } from "@/components/cart/VariantEditSheet";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";

import { CartDesktop } from "./_components/CartDesktop";
import { CartMobile } from "./_components/CartMobile";
import { useCartPageData } from "./_hooks/useCartPageData";

import type { CouponData } from "@/components/profile/CouponCard";

interface EditingVariantInfo {
  cartItemId: string;
  productSlug: string;
  currentVariantId: string;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  const selectedCoupon = useCartStore((s) => s.selectedCoupon);
  const setSelectedCoupon = useCartStore((s) => s.setSelectedCoupon);
  const selectedPoints = useCartStore((s) => s.selectedPoints);
  const setSelectedPoints = useCartStore((s) => s.setSelectedPoints);
  const openLogin = useUIStore((s) => s.openLogin);
  const router = useRouter();

  const [showClearModal, setShowClearModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<EditingVariantInfo | null>(null);

  const { pointBalance, deliveryZones, productCategoryMap } = useCartPageData();

  const handleCheckout = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/checkout");
        return;
      }
    } catch {}
    openLogin("/checkout");
  };

  if (!isHydrated) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  const {
    totalCount,
    subtotal,
    totalDiscount,
    deliveryFee,
    couponDiscount,
    pointDiscount,
    totalPayable,
  } = getCartCalculations({
    items,
    deliveryZones,
    selectedCoupon,
    selectedPoints,
    productCategoryMap,
  });

  const openClearModal = () => setShowClearModal(true);

  return (
    <>
      <div className="md:hidden">
        <CartMobile
          totalCount={totalCount}
          subtotal={subtotal}
          totalDiscount={totalDiscount}
          deliveryFee={deliveryFee}
          totalPayable={totalPayable}
          onCheckout={handleCheckout}
          onClearCart={openClearModal}
          onEditVariant={setEditingVariant}
        />
      </div>
      <div className="hidden md:block">
        <CartDesktop
          totalCount={totalCount}
          subtotal={subtotal}
          totalDiscount={totalDiscount}
          deliveryFee={deliveryFee}
          couponDiscount={couponDiscount}
          pointDiscount={pointDiscount}
          totalPayable={totalPayable}
          pointBalance={pointBalance}
          onCheckout={handleCheckout}
          onClearCart={openClearModal}
          onOpenCouponModal={() => setShowCouponModal(true)}
          onOpenPointModal={() => setShowPointModal(true)}
        />
      </div>
      <ClearCartModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          clearCart();
          setShowClearModal(false);
        }}
      />
      <CouponSelectModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        selectedCouponId={selectedCoupon?.coupon_id ?? null}
        onSelect={(coupon: CouponData | null) => {
          if (coupon) {
            setSelectedCoupon({
              coupon_id: coupon.coupon_id,
              code: coupon.code,
              type: coupon.type,
              discount_value: coupon.discount_value,
              max_discount_amount: coupon.max_discount_amount,
              scope: coupon.scope || "all",
              scope_item_ids: coupon.scope_item_ids || [],
              max_applicable_qty: coupon.max_applicable_qty ?? null,
            });
          } else {
            setSelectedCoupon(null);
          }
        }}
      />
      <PointSelectModal
        isOpen={showPointModal}
        onClose={() => setShowPointModal(false)}
        onSelect={setSelectedPoints}
      />
      <VariantEditSheet
        isOpen={!!editingVariant}
        onClose={() => setEditingVariant(null)}
        productSlug={editingVariant?.productSlug ?? ""}
        currentVariantId={editingVariant?.currentVariantId ?? ""}
        cartItemId={editingVariant?.cartItemId ?? ""}
      />
    </>
  );
}
