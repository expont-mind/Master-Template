"use client";

// Flat-list variant picker used when a product has no option_groups
// (i.e. no Size/Color taxonomy, just bare variants). Renders each variant
// as a single row.

import { Check } from "lucide-react";

import type { ProductVariant } from "@/types/product";

interface VariantFlatListProps {
  variants: ProductVariant[];
  currentVariantId: string;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantFlatList({ variants, currentVariantId, onSelect }: VariantFlatListProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {variants.map((variant, index) => {
        const isOutOfStock = variant.stock_quantity <= 0;
        return (
          <button
            key={variant.id}
            onClick={() => !isOutOfStock && onSelect(variant)}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors duration-150 ${
              index > 0 ? "border-t border-border" : ""
            } ${
              isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:bg-surface"
            }`}
          >
            <span
              className={`text-base font-manrope ${
                currentVariantId === variant.id
                  ? "text-text-primary font-semibold"
                  : "text-text-primary font-normal"
              }`}
            >
              {variant.name || variant.sku || "Variant"}
            </span>
            {isOutOfStock ? (
              <span className="text-brand-primary text-xs font-medium font-manrope">Дууссан</span>
            ) : currentVariantId === variant.id ? (
              <Check size={16} className="text-text-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
