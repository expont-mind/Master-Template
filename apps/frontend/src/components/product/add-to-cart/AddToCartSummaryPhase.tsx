"use client";

// Phase 2 of the mobile bottom-sheet for AddToCartModal: cart summary.
// Lists each staged variant with quantity controls + price, or a single
// product card for non-variant products. Bottom CTA adds everything to
// the cart (or shows "Дууссан" when nothing buyable is staged).

import { ChevronDownBlack } from "@/components/svg";
import { formatPrice } from "@/lib/utils/formatters";

import { SingleProductRow, VariantRow } from "./_SummaryRows";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface AddToCartSummaryPhaseProps {
  contentVisible: boolean;
  getDrawerStyle: () => React.CSSProperties;
  drawerTouchProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  hasVariants: boolean;
  hasOptionGroups: boolean;
  optionGroups: OptionGroup[] | undefined;
  variants: ProductVariant[] | null | undefined;
  resolvedProduct: ProductWithDetails;
  cartItems: StagedCartItem[];
  quantity: number;
  canDecrease: boolean;
  canIncrease: boolean;
  currentPrice: number;
  currentDiscountPrice: number | null;
  currentStock: number | null | undefined;
  discount: number | null;
  sellingPrice: number;
  displayImage: string | undefined;
  displayName: string;
  totalPrice: number;
  onBackToAccordion: () => void;
  onEditCartItem: (variantId: string, options: Record<string, string>) => void;
  onCartItemQuantityChange: (variantId: string, delta: number) => void;
  onRemoveCartItem: (variantId: string) => void;
  onQuantityChange: (delta: number) => void;
  onClose: () => void;
  onAddToCart: () => void;
}

function CtaButton({
  hasVariants,
  cartItems,
  variants,
  currentStock,
  onAddToCart,
}: {
  hasVariants: boolean;
  cartItems: StagedCartItem[];
  variants: ProductVariant[] | null | undefined;
  currentStock: number | null | undefined;
  onAddToCart: () => void;
}) {
  // Resolve whether at least one staged line is actually buyable.
  const stagedBuyable = hasVariants
    ? cartItems.some((item) => {
        const v = variants?.find((x) => x.id === item.variantId);
        return !!v && v.stock_quantity > 0;
      })
    : (currentStock ?? 0) > 0;
  const disabled = hasVariants
    ? cartItems.length === 0 || !stagedBuyable
    : currentStock != null && currentStock <= 0;
  const showOutOfStockLabel = !stagedBuyable && (hasVariants ? cartItems.length > 0 : true);

  return (
    <button
      onClick={onAddToCart}
      disabled={disabled}
      className={`w-full px-4 py-3.5 rounded-sm text-white font-normal text-lg font-manrope flex items-center justify-center gap-1 transition-colors ${
        disabled
          ? "bg-text-primary/30 cursor-not-allowed"
          : "bg-text-primary hover:bg-surface-dark cursor-pointer"
      }`}
    >
      {showOutOfStockLabel ? "Дууссан" : "Сагслах"}
    </button>
  );
}

function ChangeVariantButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white flex items-center justify-between min-h-12 pl-3 pr-0.5 cursor-pointer border border-border rounded-sm"
    >
      <span className="text-text-primary font-semibold text-base font-manrope">
        Өөр төрлөөс нэмэх
      </span>
      <div className="p-1.5">
        <ChevronDownBlack />
      </div>
    </button>
  );
}

export function AddToCartSummaryPhase({
  contentVisible,
  getDrawerStyle,
  drawerTouchProps,
  hasVariants,
  hasOptionGroups,
  optionGroups,
  variants,
  resolvedProduct,
  cartItems,
  quantity,
  canDecrease,
  canIncrease,
  currentPrice,
  currentDiscountPrice,
  currentStock,
  discount,
  sellingPrice,
  displayImage,
  displayName,
  totalPrice,
  onBackToAccordion,
  onEditCartItem,
  onCartItemQuantityChange,
  onRemoveCartItem,
  onQuantityChange,
  onClose,
  onAddToCart,
}: AddToCartSummaryPhaseProps) {
  return (
    <div
      className="relative bg-white rounded-t-2xl flex flex-col"
      style={{ height: "60vh", ...getDrawerStyle() }}
      {...drawerTouchProps}
    >
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <div
          data-scrollable
          className="flex-1 flex flex-col gap-6 w-full overflow-y-auto overscroll-y-contain px-4 py-5"
        >
          {hasVariants && <ChangeVariantButton onClick={onBackToAccordion} />}

          {hasVariants && cartItems.length > 0 ? (
            <div className="flex flex-col gap-6">
              {cartItems.map((item) => (
                <VariantRow
                  key={item.variantId}
                  item={item}
                  variants={variants}
                  resolvedProduct={resolvedProduct}
                  hasOptionGroups={hasOptionGroups}
                  optionGroups={optionGroups}
                  onEdit={onEditCartItem}
                  onQuantityChange={onCartItemQuantityChange}
                  onRemove={onRemoveCartItem}
                />
              ))}
            </div>
          ) : !hasVariants ? (
            <SingleProductRow
              displayImage={displayImage}
              displayName={displayName}
              quantity={quantity}
              canDecrease={canDecrease}
              canIncrease={canIncrease}
              currentPrice={currentPrice}
              currentDiscountPrice={currentDiscountPrice}
              discount={discount}
              sellingPrice={sellingPrice}
              onQuantityChange={onQuantityChange}
              onClose={onClose}
            />
          ) : null}
        </div>

        <div
          className="border-t border-border-light px-4 py-3"
          style={{
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center justify-end gap-3 mb-3 px-0.5">
            <span className="text-text-primary font-medium text-sm font-manrope">
              Сонгосон хувилбаруудын үнэ:
            </span>
            <span className="text-text-primary font-bold text-2xl leading-8 font-manrope tracking-[-0.6px]">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <CtaButton
            hasVariants={hasVariants}
            cartItems={cartItems}
            variants={variants}
            currentStock={currentStock}
            onAddToCart={onAddToCart}
          />
        </div>
      </div>
    </div>
  );
}
