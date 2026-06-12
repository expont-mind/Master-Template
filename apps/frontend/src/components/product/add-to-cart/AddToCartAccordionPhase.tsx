"use client";

// Phase 1 of the mobile bottom-sheet for AddToCartModal:
//   - Renders an accordion variant/option picker when the product has
//     option groups, OR
//   - Renders a flat variant list when the product has variants but no
//     option groups (fallback path).
//
// Driven purely by props from useAddToCartState — no local state.

import { Check } from "lucide-react";
import Image from "next/image";

import { ChevronDownBlack } from "@/components/svg";

import type { OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

interface AddToCartAccordionPhaseProps {
  contentVisible: boolean;
  getDrawerStyle: () => React.CSSProperties;
  drawerTouchProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  hasVariants: boolean;
  hasOptionGroups: boolean;
  allAccordionGroups: OptionGroup[];
  variants: ProductVariant[] | null | undefined;
  selectedOptions: Record<string, string>;
  selectedVariantId: string | undefined;
  expandedGroupIndex: number;
  setExpandedGroupIndex: (index: number) => void;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  getOptionImage: (groupType: string, value: string) => string | null;
  handleAccordionOptionSelect: (groupType: string, value: string) => void;
  handleSkipOptionalGroup: (groupIndex: number) => void;
  handleAccordionVariantSelect: (variantId: string) => void;
}

function AccordionGroupCard({
  group,
  groupIndex,
  isExpanded,
  selectedOptions,
  setExpandedGroupIndex,
  isOptionOutOfStock,
  getOptionImage,
  handleAccordionOptionSelect,
  handleSkipOptionalGroup,
}: {
  group: OptionGroup;
  groupIndex: number;
  isExpanded: boolean;
  selectedOptions: Record<string, string>;
  setExpandedGroupIndex: (index: number) => void;
  isOptionOutOfStock: (groupType: string, value: string) => boolean;
  getOptionImage: (groupType: string, value: string) => string | null;
  handleAccordionOptionSelect: (groupType: string, value: string) => void;
  handleSkipOptionalGroup: (groupIndex: number) => void;
}) {
  const selectedValue = selectedOptions[group.type];
  const isOptionalGroup = group.is_required === false;

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => setExpandedGroupIndex(isExpanded ? -1 : groupIndex)}
        className="w-full bg-surface flex items-center justify-between h-12 pl-3 pr-0.5 cursor-pointer"
      >
        <span
          className={`font-manrope text-base ${
            isExpanded || selectedValue
              ? "text-text-primary font-semibold"
              : "text-text-muted font-medium"
          }`}
        >
          {selectedValue ? `${selectedValue}` : `${group.type} сонгох`}
          {isOptionalGroup && (
            <span className="text-text-muted font-normal text-sm ml-1">(заавал биш)</span>
          )}
        </span>
        <div
          className="transition-transform duration-300 p-1.5"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ChevronDownBlack />
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col">
            {isOptionalGroup && (
              <button
                onClick={() => handleSkipOptionalGroup(groupIndex)}
                className="w-full flex items-center h-12 justify-start pl-3 border-t border-border text-text-secondary text-sm font-manrope font-medium cursor-pointer active:bg-surface"
              >
                Алгасах
              </button>
            )}
            {group.values.map((value) => (
              <OptionRow
                key={value}
                group={group}
                value={value}
                isSelected={selectedOptions[group.type] === value}
                outOfStock={isOptionOutOfStock(group.type, value)}
                optionImage={getOptionImage(group.type, value)}
                onSelect={handleAccordionOptionSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  group,
  value,
  isSelected,
  outOfStock,
  optionImage,
  onSelect,
}: {
  group: OptionGroup;
  value: string;
  isSelected: boolean;
  outOfStock: boolean;
  optionImage: string | null;
  onSelect: (groupType: string, value: string) => void;
}) {
  return (
    <button
      onClick={() => !outOfStock && onSelect(group.type, value)}
      disabled={outOfStock}
      className={`w-full flex items-center h-14 justify-between pl-3 pr-6 py-3 border-t border-border transition-all duration-300`}
    >
      <div className="flex items-center gap-3">
        {optionImage && (
          <Image
            src={optionImage}
            alt={value}
            width={32}
            height={32}
            quality={90}
            className="w-8 h-8 rounded-sm object-cover shrink-0"
          />
        )}
        <span
          className={`text-sm text-text-primary font-manrope ${
            outOfStock
              ? "opacity-40 cursor-not-allowed"
              : isSelected
                ? "font-semibold"
                : "cursor-pointer active:text-normal"
          }`}
        >
          {value}
        </span>
      </div>
      {outOfStock ? (
        <span className="pt-0.5 pb-1 px-1.5 bg-border-light rounded-full text-text-muted text-xs font-medium font-manrope">
          Дууссан
        </span>
      ) : isSelected ? (
        <Check size={16} strokeWidth={1.5} className="text-text-primary" />
      ) : null}
    </button>
  );
}

function VariantFlatList({
  variants,
  selectedVariantId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedVariantId: string | undefined;
  onSelect: (variantId: string) => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {variants.map((variant, index) => {
        const isOutOfStock = variant.stock_quantity <= 0;
        return (
          <button
            key={variant.id}
            onClick={() => !isOutOfStock && onSelect(variant.id)}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors duration-150 ${
              index > 0 ? "border-t border-border" : ""
            } ${
              isOutOfStock ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              {variant.images?.[0] && (
                <Image
                  src={variant.images[0]}
                  alt={variant.name || "Variant"}
                  width={36}
                  height={36}
                  quality={90}
                  className="w-9 h-9 rounded-sm object-cover shrink-0"
                />
              )}
              <span
                className={`text-base font-manrope ${
                  selectedVariantId === variant.id
                    ? "text-text-primary font-semibold"
                    : "text-text-primary font-normal"
                }`}
              >
                {variant.name || variant.sku || "Variant"}
              </span>
            </div>
            {isOutOfStock && (
              <span className="text-brand-primary text-xs font-medium font-manrope">Дууссан</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AddToCartAccordionPhase({
  contentVisible,
  getDrawerStyle,
  drawerTouchProps,
  hasVariants,
  hasOptionGroups,
  allAccordionGroups,
  variants,
  selectedOptions,
  selectedVariantId,
  expandedGroupIndex,
  setExpandedGroupIndex,
  isOptionOutOfStock,
  getOptionImage,
  handleAccordionOptionSelect,
  handleSkipOptionalGroup,
  handleAccordionVariantSelect,
}: AddToCartAccordionPhaseProps) {
  return (
    <div
      className="relative bg-white rounded-t-2xl flex flex-col"
      style={{ height: "60vh", ...getDrawerStyle() }}
      {...drawerTouchProps}
    >
      <div
        data-scrollable
        className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5"
        style={{
          opacity: contentVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        {hasOptionGroups ? (
          <div className="flex flex-col gap-6">
            {allAccordionGroups.map((group, groupIndex) => (
              <AccordionGroupCard
                key={group.type}
                group={group}
                groupIndex={groupIndex}
                isExpanded={expandedGroupIndex === groupIndex}
                selectedOptions={selectedOptions}
                setExpandedGroupIndex={setExpandedGroupIndex}
                isOptionOutOfStock={isOptionOutOfStock}
                getOptionImage={getOptionImage}
                handleAccordionOptionSelect={handleAccordionOptionSelect}
                handleSkipOptionalGroup={handleSkipOptionalGroup}
              />
            ))}
          </div>
        ) : hasVariants && variants ? (
          <VariantFlatList
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelect={handleAccordionVariantSelect}
          />
        ) : null}
      </div>
    </div>
  );
}
