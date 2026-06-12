"use client";

import Image from "next/image";
import Link from "next/link";

import { Minus, Plus, Trash } from "@/components/svg";
import { MutedTextSm, PrimaryMediumBase, PrimarySemiboldSm } from "@/components/ui/typography";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/formatters";

import type { CartItem } from "@/types/product";

interface CartItemRowDesktopProps {
  item: CartItem;
  showDivider: boolean;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

interface CartItemPriceInfo {
  price: number;
  sellingPrice: number;
  discount: number | null;
  hasDiscount: boolean;
}

interface CartItemDisplay extends CartItemPriceInfo {
  image: string | undefined;
  stockQuantity: number;
  variantInfo: string | undefined;
}

function getCartItemPriceInfo(item: CartItem): CartItemPriceInfo {
  const price = item.variant ? item.variant.price : item.product.price;
  const discountPrice = item.variant ? item.variant.discount_price : item.product.discount_price;
  const hasDiscount = discountPrice != null && discountPrice < price;
  if (!hasDiscount) {
    return { price, sellingPrice: price, discount: null, hasDiscount: false };
  }
  const discount = Math.round(((price - discountPrice!) / price) * 100);
  return { price, sellingPrice: discountPrice!, discount, hasDiscount: true };
}

function getCartItemVariantInfo(item: CartItem): string | undefined {
  const options = item.variant?.option_values;
  if (options && options.length > 0) return options.join(", ");
  return item.variant?.name ?? undefined;
}

function computeCartItemDisplay(item: CartItem): CartItemDisplay {
  const priceInfo = getCartItemPriceInfo(item);
  const image = item.variant?.images?.[0] ?? item.product.images?.[0];
  const stockQuantity = item.variant?.stock_quantity ?? item.product.stock_quantity;
  const variantInfo = getCartItemVariantInfo(item);
  return { ...priceInfo, image, stockQuantity, variantInfo };
}

function PriceColumn({
  price,
  sellingPrice,
  discount,
  hasDiscount,
}: Pick<CartItemDisplay, "price" | "sellingPrice" | "discount" | "hasDiscount">) {
  return (
    <div className="flex flex-col gap-0.5 items-end shrink-0">
      {hasDiscount && (
        <p className="text-text-secondary font-normal text-xs font-manrope line-through">
          {formatPrice(price)}
        </p>
      )}
      <div className="flex items-center gap-1">
        {discount && (
          <p className="text-brand-primary font-semibold text-sm font-manrope">{discount}%</p>
        )}
        <PrimarySemiboldSm>{formatPrice(sellingPrice)}</PrimarySemiboldSm>
      </div>
    </div>
  );
}

function QuantityStepper({
  quantity,
  stockQuantity,
  onChange,
}: {
  quantity: number;
  stockQuantity: number;
  onChange: (next: number) => void;
}) {
  const canDecrement = quantity > 1;
  const canIncrement = quantity < stockQuantity;

  const decrementClass = canDecrement
    ? "cursor-pointer bg-border-light hover:bg-border"
    : "bg-surface";
  const incrementClass = canIncrement
    ? "cursor-pointer bg-border-light hover:bg-border"
    : "bg-surface";

  return (
    <div className="flex items-center">
      <button
        onClick={() => onChange(quantity - 1)}
        disabled={!canDecrement}
        className={`p-[5px] rounded-sm transition-colors duration-200 ${decrementClass}`}
      >
        <Minus color={canDecrement ? "#020617" : "#CBD5E1"} />
      </button>
      <div className="w-11 flex items-center justify-center">
        <PrimaryMediumBase>{quantity}</PrimaryMediumBase>
      </div>
      <button
        onClick={() => onChange(Math.min(quantity + 1, stockQuantity))}
        disabled={!canIncrement}
        className={`p-[5px] rounded-sm transition-colors duration-200 ${incrementClass}`}
      >
        <Plus color={canIncrement ? "#020617" : "#CBD5E1"} />
      </button>
    </div>
  );
}

export function CartItemRowDesktop({
  item,
  showDivider,
  onQuantityChange,
  onRemove,
}: CartItemRowDesktopProps) {
  const display = computeCartItemDisplay(item);

  return (
    <div>
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-5 items-center">
          <Link
            href={ROUTES.PRODUCT(item.product.slug)}
            className="w-[104px] h-[104px] rounded-sm border border-border-light bg-border-light shrink-0 overflow-hidden block"
          >
            {display.image && (
              <Image
                src={display.image}
                alt={item.product.name}
                width={104}
                height={104}
                quality={90}
                className="w-full h-full object-cover"
              />
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col max-w-[380px]">
                <Link
                  href={ROUTES.PRODUCT(item.product.slug)}
                  className="text-text-primary font-medium text-base font-manrope leading-6 hover:underline"
                >
                  {item.product.name}
                </Link>
                {display.variantInfo && <MutedTextSm>{display.variantInfo}</MutedTextSm>}
              </div>

              <PriceColumn
                price={display.price}
                sellingPrice={display.sellingPrice}
                discount={display.discount}
                hasDiscount={display.hasDiscount}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <QuantityStepper
            quantity={item.quantity}
            stockQuantity={display.stockQuantity}
            onChange={(next) => onQuantityChange(item.id, next)}
          />
          <button
            onClick={() => onRemove(item.id)}
            className="p-[5px] cursor-pointer hover:opacity-70 transition-opacity duration-200"
          >
            <Trash />
          </button>
        </div>
      </div>
      {showDivider && (
        <div className="py-2 mt-4">
          <div className="w-full h-px bg-border" />
        </div>
      )}
    </div>
  );
}
