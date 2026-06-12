"use client";

import { QuantityControl, VariantsLoadingState } from "./_ProductVariantsParts";
import {
  getVariantImageForValue,
  isValueOutOfStock,
  useVariantOptions,
} from "./_useVariantOptions";
import { OptionGroupRow } from "./OptionGroupRow";
import { VariantFallbackList } from "./VariantFallbackList";

import type { OptionGroup, ProductVariant } from "@/lib/queries/products";

interface ProductVariantsProps {
  quantity: number;
  onQuantityChange: (q: number) => void;
  maxQuantity?: number;
  variants?: ProductVariant[];
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  productName?: string;
  productImage?: string;
  optionGroups?: OptionGroup[];
  loading?: boolean;
}

export const ProductVariants = ({
  quantity,
  onQuantityChange,
  maxQuantity,
  variants,
  selectedVariantId,
  onVariantChange,
  productName,
  productImage,
  optionGroups,
  loading,
}: ProductVariantsProps) => {
  const canDecrease = quantity > 1;
  const canIncrease = maxQuantity == null || quantity < maxQuantity;

  const { requiredGroups, optionalGroups, groupPositions, selectedOptions, handleOptionSelect } =
    useVariantOptions({
      optionGroups,
      variants,
      selectedVariantId,
      onVariantChange,
    });

  const handleQuantityChange = (delta: number) => {
    let next = quantity + delta;
    next = Math.max(1, next);
    if (maxQuantity != null) next = Math.min(maxQuantity, next);
    onQuantityChange(next);
  };

  const hasVariants = variants && variants.length > 0;
  const hasOptionGroups = optionGroups && optionGroups.length > 0;

  if (loading) {
    return <VariantsLoadingState hasOptionGroups={hasOptionGroups} />;
  }

  return (
    <div className="hidden md:flex flex-col gap-6">
      {hasOptionGroups && (
        <div className="flex flex-col gap-5">
          {optionGroups.map((group) => (
            <OptionGroupRow
              key={group.type}
              group={group}
              selectedOptions={selectedOptions}
              isOptional={group.is_required === false}
              getVariantImageForValue={(value) =>
                getVariantImageForValue(value, group, variants, requiredGroups, optionalGroups)
              }
              isValueOutOfStock={(value) =>
                isValueOutOfStock(
                  value,
                  group,
                  variants,
                  selectedOptions,
                  groupPositions,
                  requiredGroups,
                  optionalGroups,
                )
              }
              onOptionSelect={handleOptionSelect}
            />
          ))}
        </div>
      )}

      {hasVariants && !hasOptionGroups && (
        <VariantFallbackList
          variants={variants}
          selectedVariantId={selectedVariantId}
          productName={productName}
          productImage={productImage}
          onVariantChange={onVariantChange}
        />
      )}

      <QuantityControl
        quantity={quantity}
        canDecrease={canDecrease}
        canIncrease={canIncrease}
        onChange={handleQuantityChange}
      />
    </div>
  );
};
