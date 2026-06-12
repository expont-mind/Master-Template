"use client";

import { createPortal } from "react-dom";

import { useProductDetail } from "@/lib/hooks/useProductDetail";
import { useCartStore } from "@/stores/cart-store";

import { useVariantEditState } from "./_useVariantEditState";
import { VariantFlatList } from "./_VariantFlatList";
import { VariantOptionsGrid } from "./_VariantOptionsGrid";

import type { OptionGroup } from "@/lib/queries/products";

interface VariantEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productSlug: string;
  currentVariantId: string;
  cartItemId: string;
}

export const VariantEditSheet = ({
  isOpen,
  onClose,
  productSlug,
  currentVariantId,
  cartItemId,
}: VariantEditSheetProps) => {
  const updateVariant = useCartStore((s) => s.updateVariant);

  const { data: product, isLoading } = useProductDetail(isOpen ? productSlug : "");

  const variants = product?.variants;
  const optionGroups = product?.option_groups as OptionGroup[] | undefined;
  const hasOptionGroups = optionGroups && optionGroups.length > 0;

  const {
    visible,
    animate,
    selectedOptions,
    expandedGroupIndex,
    setExpandedGroupIndex,
    isOptionOutOfStock,
    handleOptionSelect,
    handleFlatVariantSelect,
  } = useVariantEditState({
    isOpen,
    onClose,
    currentVariantId,
    variants,
    optionGroups,
    updateVariant,
    cartItemId,
  });

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-overlay touch-none"
        style={{
          opacity: animate ? 1 : 0,
          transition: "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative bg-white rounded-t-2xl flex flex-col"
        style={{
          maxHeight: "85vh",
          transform: animate ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
      >
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5">
          <SheetContent
            isLoading={isLoading}
            hasOptionGroups={!!hasOptionGroups}
            optionGroups={optionGroups}
            variants={variants}
            currentVariantId={currentVariantId}
            expandedGroupIndex={expandedGroupIndex}
            selectedOptions={selectedOptions}
            isOptionOutOfStock={isOptionOutOfStock}
            setExpandedGroupIndex={setExpandedGroupIndex}
            handleOptionSelect={handleOptionSelect}
            handleFlatVariantSelect={handleFlatVariantSelect}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

function SheetContent({
  isLoading,
  hasOptionGroups,
  optionGroups,
  variants,
  currentVariantId,
  expandedGroupIndex,
  selectedOptions,
  isOptionOutOfStock,
  setExpandedGroupIndex,
  handleOptionSelect,
  handleFlatVariantSelect,
}: {
  isLoading: boolean;
  hasOptionGroups: boolean;
  optionGroups: OptionGroup[] | undefined;
  variants: import("@/types/product").ProductVariant[] | undefined;
  currentVariantId: string;
  expandedGroupIndex: number;
  selectedOptions: Record<string, string>;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  setExpandedGroupIndex: (i: number) => void;
  handleOptionSelect: (groupType: string, value: string) => void;
  handleFlatVariantSelect: (variant: import("@/types/product").ProductVariant) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-12 skeleton rounded-sm" />
        <div className="h-12 skeleton rounded-sm" />
      </div>
    );
  }
  if (hasOptionGroups && optionGroups) {
    return (
      <VariantOptionsGrid
        optionGroups={optionGroups}
        expandedGroupIndex={expandedGroupIndex}
        selectedOptions={selectedOptions}
        isOptionOutOfStock={isOptionOutOfStock}
        onToggleGroup={setExpandedGroupIndex}
        onOptionSelect={handleOptionSelect}
      />
    );
  }
  if (variants && variants.length > 0) {
    return (
      <VariantFlatList
        variants={variants}
        currentVariantId={currentVariantId}
        onSelect={handleFlatVariantSelect}
      />
    );
  }
  return null;
}
