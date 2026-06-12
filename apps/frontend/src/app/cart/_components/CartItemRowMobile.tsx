"use client";

import Image from "next/image";
import Link from "next/link";

import { Cancel, ChevronDownCart, Minus, Plus } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/formatters";

import { resolveCartItemPricing } from "./_cartItemPricing";

import type { CartItem } from "@/types/product";

interface EditingVariantInfo {
  cartItemId: string;
  productSlug: string;
  currentVariantId: string;
}

interface CartItemRowMobileProps {
  item: CartItem;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onEditVariant: (info: EditingVariantInfo) => void;
}

function CartItemImage({
  image,
  name,
  slug,
}: {
  image: string | undefined;
  name: string;
  slug: string;
}) {
  return (
    <Link
      href={ROUTES.PRODUCT(slug)}
      className="w-[72px] h-[72px] rounded-sm shrink-0 overflow-hidden block"
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={72}
          height={72}
          quality={90}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-border-light" />
      )}
    </Link>
  );
}

function VariantPicker({ label, onEdit }: { label: string; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="inline-flex w-full items-center justify-between gap-0.5 px-1 py-1.5 bg-surface rounded-sm cursor-pointer self-start"
    >
      <span className="text-text-secondary font-normal text-xs font-manrope line-clamp-1 text-left">
        {label}
      </span>
      <div className="shrink-0">
        <ChevronDownCart />
      </div>
    </button>
  );
}

function QuantityStepper({
  quantity,
  stockQuantity,
  onChange,
}: {
  quantity: number;
  stockQuantity: number;
  onChange: (qty: number) => void;
}) {
  const canDecrement = quantity > 1;
  const canIncrement = quantity < stockQuantity;
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onChange(quantity - 1)}
        disabled={!canDecrement}
        className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
          canDecrement ? "border-text-primary cursor-pointer hover:bg-surface" : "border-border"
        }`}
      >
        <Minus color={canDecrement ? "#020617" : "#CBD5E1"} />
      </button>
      <span className="w-8 h-8 flex items-center justify-center text-text-primary font-semibold text-sm font-manrope">
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(quantity + 1, stockQuantity))}
        disabled={!canIncrement}
        className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
          canIncrement ? "border-text-primary cursor-pointer hover:bg-surface" : "border-border"
        }`}
      >
        <Plus color={canIncrement ? "#020617" : "#CBD5E1"} />
      </button>
    </div>
  );
}

function PriceBlock({
  price,
  sellingPrice,
  hasDiscount,
  discount,
}: {
  price: number;
  sellingPrice: number;
  hasDiscount: boolean;
  discount: number | null;
}) {
  return (
    <div className="flex flex-col">
      {hasDiscount && (
        <p className="text-text-secondary font-normal text-xs font-manrope line-through">
          {formatPrice(price)}
        </p>
      )}
      <div className="flex items-center gap-1">
        {discount && (
          <p className="text-brand-primary font-semibold text-xs font-manrope">{discount}%</p>
        )}
        <p className="text-text-primary font-semibold text-xs font-manrope whitespace-nowrap">
          {formatPrice(sellingPrice)}
        </p>
      </div>
    </div>
  );
}

export function CartItemRowMobile({
  item,
  onQuantityChange,
  onRemove,
  onEditVariant,
}: CartItemRowMobileProps) {
  const pricing = resolveCartItemPricing(item);

  const handleEditVariant = () => {
    if (!item.variant) return;
    onEditVariant({
      cartItemId: item.id,
      productSlug: item.product.slug,
      currentVariantId: item.variant.id,
    });
  };

  return (
    <div className="flex gap-4 items-start">
      <CartItemImage image={pricing.image} name={item.product.name} slug={item.product.slug} />

      <div className="flex gap-4 items-start flex-1 min-w-0">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <Link
              href={ROUTES.PRODUCT(item.product.slug)}
              className="text-text-primary font-normal text-xs font-manrope leading-5 line-clamp-1"
            >
              {item.product.name}
            </Link>
            {pricing.variantLabel && item.variant && (
              <VariantPicker label={pricing.variantLabel} onEdit={handleEditVariant} />
            )}
          </div>

          <div className="flex items-center gap-6">
            <QuantityStepper
              quantity={item.quantity}
              stockQuantity={pricing.stockQuantity}
              onChange={(qty) => onQuantityChange(item.id, qty)}
            />
            <PriceBlock
              price={pricing.price}
              sellingPrice={pricing.sellingPrice}
              hasDiscount={pricing.hasDiscount}
              discount={pricing.discount}
            />
          </div>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 shrink-0 cursor-pointer"
          aria-label="Remove"
        >
          <Cancel />
        </button>
      </div>
    </div>
  );
}
