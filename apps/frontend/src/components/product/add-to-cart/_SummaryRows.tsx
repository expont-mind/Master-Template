"use client";

// Row components used by AddToCartSummaryPhase: staged variant row,
// single-product row, and the shared quantity stepper.

import Image from "next/image";

import { Cancel, ChevronDownCart, Minus, Plus } from "@/components/svg";
import { PrimarySemiboldSm } from "@/components/ui/typography";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";

import type { StagedCartItem } from "./_addToCartTypes";
import type { OptionGroup, ProductWithDetails } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

export function QuantityStepper({
  quantity,
  canDecrease,
  canIncrease,
  onChange,
}: {
  quantity: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onChange(-1)}
        disabled={!canDecrease}
        className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
          canDecrease ? "border-text-primary cursor-pointer hover:bg-surface" : "border-border"
        }`}
      >
        <Minus color={canDecrease ? "#020617" : "#CBD5E1"} />
      </button>
      <span className="w-8 h-8 flex items-center justify-center text-text-primary font-semibold text-sm font-manrope">
        {quantity}
      </span>
      <button
        onClick={() => onChange(1)}
        disabled={!canIncrease}
        className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
          canIncrease ? "border-text-primary cursor-pointer hover:bg-surface" : "border-border"
        }`}
      >
        <Plus color={canIncrease ? "#020617" : "#CBD5E1"} />
      </button>
    </div>
  );
}

interface VariantRowPricing {
  itemPrice: number;
  itemDiscountPrice: number | null;
  itemSellingPrice: number;
  itemDiscount: number | null;
}

function computeVariantRowPricing(variant: ProductVariant): VariantRowPricing {
  const itemPrice = variant.price;
  const itemDiscountPrice = variant.discount_price;
  const itemSellingPrice =
    itemDiscountPrice != null && itemDiscountPrice < itemPrice ? itemDiscountPrice : itemPrice;
  const itemDiscount = getDiscountPercentage(itemPrice, itemDiscountPrice);
  return { itemPrice, itemDiscountPrice, itemSellingPrice, itemDiscount };
}

function VariantImage({ itemImage, alt }: { itemImage: string | undefined; alt: string }) {
  return (
    <div className="w-[72px] h-[72px] rounded-sm shrink-0 overflow-hidden">
      {itemImage ? (
        <Image
          src={itemImage}
          alt={alt}
          width={72}
          height={72}
          quality={90}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-border-light" />
      )}
    </div>
  );
}

function VariantPriceBlock({ pricing }: { pricing: VariantRowPricing }) {
  const { itemPrice, itemDiscountPrice, itemSellingPrice, itemDiscount } = pricing;
  return (
    <div className="flex flex-col">
      {itemDiscountPrice != null && itemDiscountPrice < itemPrice && (
        <p className="text-text-secondary font-normal text-xs font-manrope line-through">
          {formatPrice(itemPrice)}
        </p>
      )}
      <div className="flex items-center gap-1">
        {itemDiscount && (
          <p className="text-brand-primary font-semibold text-xs font-manrope">{itemDiscount}%</p>
        )}
        <p className="text-text-primary font-semibold text-xs font-manrope whitespace-nowrap">
          {formatPrice(itemSellingPrice)}
        </p>
      </div>
    </div>
  );
}

export function VariantRow({
  item,
  variants,
  resolvedProduct,
  hasOptionGroups,
  optionGroups,
  onEdit,
  onQuantityChange,
  onRemove,
}: {
  item: StagedCartItem;
  variants: ProductVariant[] | null | undefined;
  resolvedProduct: ProductWithDetails;
  hasOptionGroups: boolean;
  optionGroups: OptionGroup[] | undefined;
  onEdit: (variantId: string, options: Record<string, string>) => void;
  onQuantityChange: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const itemVariant = variants?.find((v) => v.id === item.variantId);
  if (!itemVariant) return null;
  const itemImage = itemVariant.images?.[0] ?? resolvedProduct.images?.[0];
  const pricing = computeVariantRowPricing(itemVariant);
  const itemStock = itemVariant.stock_quantity;
  const itemCanDecrease = item.quantity > 1;
  const itemCanIncrease = itemStock == null || item.quantity < itemStock;
  const itemOptionsText = hasOptionGroups
    ? optionGroups!
        .map((g) => item.options[g.type])
        .filter(Boolean)
        .join(" / ")
    : null;

  return (
    <div className="flex gap-4 items-start">
      <VariantImage itemImage={itemImage} alt={itemVariant.name || resolvedProduct.name} />

      <div className="flex gap-4 items-start flex-1 min-w-0">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <p className="text-text-primary font-normal text-xs font-manrope leading-5 line-clamp-1">
              {resolvedProduct.name}
            </p>
            {itemOptionsText && (
              <button
                onClick={() => onEdit(item.variantId, item.options)}
                className="inline-flex items-center justify-between gap-0.5 px-1 py-1.5 bg-surface rounded-sm cursor-pointer"
              >
                <span className="w-full text-text-secondary font-normal text-xs font-manrope line-clamp-1 text-left">
                  {itemOptionsText}
                </span>
                <div className="flex-1">
                  <ChevronDownCart />
                </div>
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <QuantityStepper
              quantity={item.quantity}
              canDecrease={itemCanDecrease}
              canIncrease={itemCanIncrease}
              onChange={(delta) => onQuantityChange(item.variantId, delta)}
            />
            <VariantPriceBlock pricing={pricing} />
          </div>
        </div>

        <button
          onClick={() => onRemove(item.variantId)}
          className="p-2 shrink-0 cursor-pointer"
          aria-label="Remove"
        >
          <Cancel />
        </button>
      </div>
    </div>
  );
}

export function SingleProductRow({
  displayImage,
  displayName,
  quantity,
  canDecrease,
  canIncrease,
  currentPrice,
  currentDiscountPrice,
  discount,
  sellingPrice,
  onQuantityChange,
  onClose,
}: {
  displayImage: string | undefined;
  displayName: string;
  quantity: number;
  canDecrease: boolean;
  canIncrease: boolean;
  currentPrice: number;
  currentDiscountPrice: number | null;
  discount: number | null;
  sellingPrice: number;
  onQuantityChange: (delta: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-[72px] h-[72px] rounded-lg border border-border-light shrink-0 overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayName}
            width={72}
            height={72}
            quality={90}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-border-light" />
        )}
      </div>

      <div className="flex gap-8 items-start">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <p className="text-text-primary font-medium text-sm font-manrope leading-5 line-clamp-2 flex-1">
              {displayName}
            </p>
          </div>

          <QuantityStepper
            quantity={quantity}
            canDecrease={canDecrease}
            canIncrease={canIncrease}
            onChange={onQuantityChange}
          />

          <div className="flex flex-col">
            {currentDiscountPrice != null && currentDiscountPrice < currentPrice && (
              <p className="text-text-secondary font-normal text-xs font-manrope line-through">
                {formatPrice(currentPrice)}
              </p>
            )}
            <div className="flex items-center gap-1">
              {discount && (
                <p className="text-brand-primary font-semibold text-sm font-manrope">{discount}%</p>
              )}
              <PrimarySemiboldSm>{formatPrice(sellingPrice)}</PrimarySemiboldSm>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="p-0.5 shrink-0 cursor-pointer" aria-label="Remove">
          <Cancel />
        </button>
      </div>
    </div>
  );
}
