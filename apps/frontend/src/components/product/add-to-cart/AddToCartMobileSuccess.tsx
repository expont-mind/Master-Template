"use client";

// Mobile success view: shown inside AddToCartModal after the user finalizes
// adding to cart. Renders a bottom drawer with the added item(s) summary and
// two CTAs (go to cart / keep shopping).

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Cancel } from "@/components/svg";
import { MutedMediumSm, PrimaryHeading, PrimarySemiboldSm } from "@/components/ui/typography";
import { ROUTES } from "@/lib/utils/constants";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";

import type { ProductWithDetails, OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface MobileCartItem {
  variantId: string;
  options: Record<string, string>;
  quantity: number;
}

interface AddToCartMobileSuccessProps {
  getDrawerStyle: () => React.CSSProperties;
  drawerTouchProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  contentVisible: boolean;
  onClose: () => void;
  hasVariants: boolean | undefined;
  cartItems: MobileCartItem[];
  variants: ProductVariant[] | null | undefined;
  resolvedProduct: ProductWithDetails;
  hasOptionGroups: boolean | undefined;
  optionGroups: OptionGroup[] | undefined;
  selectedVariant: ProductVariant | null;
  displayImage: string | undefined;
  displayName: string;
  currentPrice: number;
  currentDiscountPrice: number | null;
  discount: number | null;
  sellingPrice: number;
}

function ItemImage({ src, alt }: { src: string | undefined; alt: string }) {
  return (
    <div className="w-[86px] h-[86px] rounded-sm border border-border-light shrink-0 overflow-hidden">
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={86}
          height={86}
          quality={90}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-border-light" />
      )}
    </div>
  );
}

function PriceBlock({
  listPrice,
  discountPrice,
  discount,
  sellingPrice,
}: {
  listPrice: number;
  discountPrice: number | null;
  discount: number | null;
  sellingPrice: number;
}) {
  const hasDiscount = discountPrice != null && discountPrice < listPrice;
  return (
    <div className="flex flex-col">
      {hasDiscount && (
        <p className="text-text-secondary font-normal text-xs font-manrope line-through">
          {formatPrice(listPrice)}
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

interface VariantRowProps {
  item: MobileCartItem;
  variants: ProductVariant[] | null | undefined;
  resolvedProduct: ProductWithDetails;
  hasOptionGroups: boolean | undefined;
  optionGroups: OptionGroup[] | undefined;
}

function VariantRow({
  item,
  variants,
  resolvedProduct,
  hasOptionGroups,
  optionGroups,
}: VariantRowProps) {
  const itemVariant = variants?.find((v) => v.id === item.variantId);
  if (!itemVariant) return null;
  const itemImage = itemVariant.images?.[0] ?? resolvedProduct.images?.[0];
  const itemName = itemVariant.name ?? resolvedProduct.name;
  const itemPrice = itemVariant.price;
  const itemDiscountPrice = itemVariant.discount_price;
  const itemSellingPrice =
    itemDiscountPrice != null && itemDiscountPrice < itemPrice ? itemDiscountPrice : itemPrice;
  const itemDiscount = getDiscountPercentage(itemPrice, itemDiscountPrice);
  const itemOptionsText = hasOptionGroups
    ? optionGroups!
        .map((g) => item.options[g.type])
        .filter(Boolean)
        .join(" / ")
    : null;

  return (
    <div className="flex gap-5">
      <ItemImage src={itemImage} alt={itemName} />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex flex-col">
          {itemOptionsText && (
            <p className="text-text-secondary font-medium text-sm font-manrope line-clamp-1">
              {itemOptionsText}
            </p>
          )}
          <p className="text-text-primary font-semibold text-sm font-manrope line-clamp-1 leading-5">
            {itemName}
          </p>
        </div>
        <PriceBlock
          listPrice={itemPrice}
          discountPrice={itemDiscountPrice}
          discount={itemDiscount}
          sellingPrice={itemSellingPrice}
        />
      </div>
    </div>
  );
}

interface SingleSuccessRowProps {
  selectedVariant: ProductVariant | null;
  resolvedProduct: ProductWithDetails;
  displayImage: string | undefined;
  displayName: string;
  currentPrice: number;
  currentDiscountPrice: number | null;
  discount: number | null;
  sellingPrice: number;
}

function SingleSuccessRow({
  selectedVariant,
  resolvedProduct,
  displayImage,
  displayName,
  currentPrice,
  currentDiscountPrice,
  discount,
  sellingPrice,
}: SingleSuccessRowProps) {
  const sku = selectedVariant?.sku ?? resolvedProduct.sku;
  return (
    <div className="flex gap-3 pb-2">
      <ItemImage src={displayImage} alt={displayName} />
      <div className="flex flex-col gap-1">
        <div className="flex flex-col">
          {sku && <MutedMediumSm>{sku}</MutedMediumSm>}
          <p className="text-text-primary font-semibold text-sm font-manrope line-clamp-1 leading-5">
            {displayName}
          </p>
        </div>
        <PriceBlock
          listPrice={currentPrice}
          discountPrice={currentDiscountPrice}
          discount={discount}
          sellingPrice={sellingPrice}
        />
      </div>
    </div>
  );
}

export function AddToCartMobileSuccess({
  getDrawerStyle,
  drawerTouchProps,
  contentVisible,
  onClose,
  hasVariants,
  cartItems,
  variants,
  resolvedProduct,
  hasOptionGroups,
  optionGroups,
  selectedVariant,
  displayImage,
  displayName,
  currentPrice,
  currentDiscountPrice,
  discount,
  sellingPrice,
}: AddToCartMobileSuccessProps) {
  const router = useRouter();
  const showMultiVariant = hasVariants && cartItems.length > 0;

  return (
    <div
      className="relative bg-white rounded-t-2xl flex flex-col"
      style={getDrawerStyle()}
      {...drawerTouchProps}
    >
      <div
        className="flex flex-col gap-6 p-6"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <div className="flex items-center justify-between">
          <PrimaryHeading>Сагсанд нэмэгдлээ</PrimaryHeading>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Close">
            <Cancel />
          </button>
        </div>

        {showMultiVariant ? (
          <div className="flex flex-col gap-6 pb-4">
            {cartItems.map((item) => (
              <VariantRow
                key={item.variantId}
                item={item}
                variants={variants}
                resolvedProduct={resolvedProduct}
                hasOptionGroups={hasOptionGroups}
                optionGroups={optionGroups}
              />
            ))}
          </div>
        ) : (
          <SingleSuccessRow
            selectedVariant={selectedVariant}
            resolvedProduct={resolvedProduct}
            displayImage={displayImage}
            displayName={displayName}
            currentPrice={currentPrice}
            currentDiscountPrice={currentDiscountPrice}
            discount={discount}
            sellingPrice={sellingPrice}
          />
        )}

        <div
          className="flex items-center gap-2"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => {
              onClose();
              router.push(ROUTES.CART);
            }}
            className="flex-1 px-3 py-3 h-11 border border-border rounded-sm text-text-primary font-normal text-base font-manrope flex items-center justify-center hover:bg-surface transition-colors duration-200 cursor-pointer"
          >
            Сагсруу очих
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-3 h-11 bg-text-primary rounded-sm text-white font-normal text-base font-manrope flex items-center justify-center hover:bg-surface-dark transition-colors duration-200 cursor-pointer"
          >
            Өөр бараа үзэх
          </button>
        </div>
      </div>
    </div>
  );
}
