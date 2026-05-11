"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Minus, Plus, ChevronRight16 } from "../svg";
import type { ProductVariant, OptionGroup } from "@/lib/queries/products";
import { formatPrice } from "@/lib/utils/formatters";
import Image from "next/image";

const ITEM_WIDTH = 140; // approx button width + gap

function OptionGroupRow({
  group,
  selectedOptions,
  getVariantImageForValue,
  onOptionSelect,
  isValueOutOfStock,
  isOptional = false,
}: {
  group: OptionGroup;
  selectedOptions: Record<string, string>;
  getVariantImageForValue: (value: string) => string | null;
  onOptionSelect: (groupType: string, value: string) => void;
  isValueOutOfStock: (value: string) => boolean;
  isOptional?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -ITEM_WIDTH : ITEM_WIDTH,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[#020617] font-medium text-sm px-0.5 font-manrope">
        {group.type}
        {isOptional && (
          <span className="text-[#94A3B8] font-normal text-xs ml-1">
            (заавал биш)
          </span>
        )}
      </p>
      <div className="relative group/scroll">
        {/* Left Arrow - Hidden on mobile */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-[#F8FAFC]"
            aria-label="Scroll left"
          >
            <div className="rotate-180">
              <ChevronRight16 />
            </div>
          </button>
        )}

        {/* Right Arrow - Hidden on mobile */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] cursor-pointer opacity-0 group-hover/scroll:opacity-100 transition-all hover:bg-[#F8FAFC]"
            aria-label="Scroll right"
          >
            <ChevronRight16 />
          </button>
        )}

        {/* Right Gradient - Hidden on mobile */}
        {canScrollRight && (
          <div
            className="hidden md:block absolute right-0 top-0 bottom-0 w-10 z-5 pointer-events-none"
            style={{
              background:
                "linear-gradient(270deg, #FFF 0%, rgba(255,255,255,0) 100%)",
            }}
          />
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
          <div className="flex flex-col gap-2 w-max">
            {(() => {
              const total = group.values.length;
              const rowCount = total <= 3 ? 1 : total <= 6 ? 2 : 3;
              const itemsPerRow = Math.ceil(total / rowCount);

              return Array.from({ length: rowCount }, (_, rowIndex) => {
                const rowValues = group.values.slice(
                  rowIndex * itemsPerRow,
                  (rowIndex + 1) * itemsPerRow,
                );
                if (rowValues.length === 0) return null;
                return (
                  <div key={rowIndex} className="flex gap-2">
                    {rowValues.map((value) => {
                      const isSelected = selectedOptions[group.type] === value;
                      const variantImage = getVariantImageForValue(value);
                      const outOfStock = isValueOutOfStock(value);

                      return (
                        <button
                          key={value}
                          onClick={() => !outOfStock && onOptionSelect(group.type, value)}
                          disabled={outOfStock}
                          className={`p-0.5 border rounded-lg flex items-center gap-2 transition-all duration-200 ${
                            outOfStock
                              ? "opacity-40 cursor-not-allowed"
                              : isSelected
                                ? "border-[#020617] bg-white shadow-sm cursor-pointer"
                                : "border-transparent bg-white hover:border-[#CBD5E1] cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center border border-[#E2E8F0] rounded-[6px] h-[30px] overflow-hidden">
                            {variantImage ? (
                              <Image
                                src={variantImage}
                                alt={value}
                                width={32}
                                height={32}
                                quality={75}
                                className="w-7 h-7 object-cover object-center"
                              />
                            ) : null}
                            <div
                              className={`text-xs font-normal min-w-[45px] ${
                                variantImage ? "pl-1" : "pl-2"
                              } pr-2 py-1.5 text-[#020617]`}
                            >
                              <span>{value}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantsSkeleton({ hasOptionGroups }: { hasOptionGroups?: boolean }) {
  if (hasOptionGroups) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2].map((group) => (
          <div key={group} className="flex flex-col gap-1.5">
            <div className="h-4 w-14 skeleton rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[34px] w-[90px] skeleton rounded-lg"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="h-4 w-10 skeleton rounded" />
      <div className="grid grid-cols-2 gap-2 pt-3 px-0.5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-12 w-full skeleton rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

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

  // Separate required and optional groups (option_values is stored required-first)
  const requiredGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required !== false) ?? [],
    [optionGroups],
  );
  const optionalGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required === false) ?? [],
    [optionGroups],
  );

  // Precompute position index for each group type (required first, then optional)
  const groupPositions = useMemo(() => {
    const positions = new Map<string, number>();
    requiredGroups.forEach((g, i) => positions.set(g.type, i));
    optionalGroups.forEach((g, i) => positions.set(g.type, requiredGroups.length + i));
    return positions;
  }, [requiredGroups, optionalGroups]);

  // Track user-selected options (null = use defaults derived from variant)
  const [userSelectedOptions, setUserSelectedOptions] = useState<
    Record<string, string> | null
  >(null);

  // Build variant name from selected options: required values + selected optional values (in order)
  const buildVariantName = useCallback(
    (options: Record<string, string>): string | null => {
      const parts = requiredGroups.map((g) => options[g.type]);
      if (parts.some((v) => !v)) return null;
      for (const og of optionalGroups) {
        if (options[og.type]) parts.push(options[og.type]);
      }
      return parts.join(" / ");
    },
    [requiredGroups, optionalGroups],
  );

  // Compute selected options synchronously: use user overrides if any, otherwise derive from variant data
  const selectedOptions = useMemo(() => {
    if (userSelectedOptions !== null) return userSelectedOptions;
    if (!optionGroups || optionGroups.length === 0 || !variants) return {};

    const selectedVariant = variants.find((v) => v.id === selectedVariantId);
    const options: Record<string, string> = {};

    if (
      selectedVariant?.option_values &&
      selectedVariant.option_values.length > 0
    ) {
      requiredGroups.forEach((group, idx) => {
        if (
          selectedVariant.option_values &&
          selectedVariant.option_values[idx]
        ) {
          options[group.type] = selectedVariant.option_values[idx];
        }
      });
    } else {
      requiredGroups.forEach((group) => {
        if (group.values.length > 0) {
          options[group.type] = group.values[0];
        }
      });
    }

    return options;
  }, [userSelectedOptions, optionGroups, variants, selectedVariantId, requiredGroups]);

  // Find matching variant when user selects options
  const handleOptionSelect = (groupType: string, value: string) => {
    // Allow toggling optional groups off by clicking the same value
    const isOptional = optionalGroups.some((g) => g.type === groupType);
    const newOptions = { ...selectedOptions };
    if (isOptional && selectedOptions[groupType] === value) {
      delete newOptions[groupType];
    } else {
      newOptions[groupType] = value;
    }

    // Find matching variant by name
    if (!variants) {
      setUserSelectedOptions(newOptions);
      return;
    }

    const expectedName = buildVariantName(newOptions);
    if (!expectedName) {
      setUserSelectedOptions(newOptions);
      return;
    }

    const matchingVariant = variants.find((v) => v.name === expectedName);

    if (matchingVariant && matchingVariant.stock_quantity > 0) {
      // In stock - proceed normally
      setUserSelectedOptions(newOptions);
      if (matchingVariant.id !== selectedVariantId) {
        onVariantChange?.(matchingVariant.id);
      }
    } else {
      // Out of stock or no match - try to find an in-stock alternative
      // Keep the newly selected option, try different values for other required groups
      let found = false;
      const adjustedOptions = { ...newOptions };

      for (const rg of requiredGroups) {
        if (rg.type === groupType) continue;
        for (const altValue of rg.values) {
          if (altValue === newOptions[rg.type]) continue;
          adjustedOptions[rg.type] = altValue;
          const altName = buildVariantName(adjustedOptions);
          if (!altName) continue;
          const altVariant = variants.find((v) => v.name === altName);
          if (altVariant && altVariant.stock_quantity > 0) {
            setUserSelectedOptions(adjustedOptions);
            if (altVariant.id !== selectedVariantId) {
              onVariantChange?.(altVariant.id);
            }
            found = true;
            break;
          }
        }
        if (found) break;
        adjustedOptions[rg.type] = newOptions[rg.type]; // reset if no match
      }

      if (!found) {
        // All combinations out of stock for this option - select anyway (shows "Дууссан")
        setUserSelectedOptions(newOptions);
        if (matchingVariant && matchingVariant.id !== selectedVariantId) {
          onVariantChange?.(matchingVariant.id);
        }
      }
    }
  };

  const handleQuantityChange = (delta: number) => {
    let next = quantity + delta;
    next = Math.max(1, next);
    if (maxQuantity != null) next = Math.min(maxQuantity, next);
    onQuantityChange(next);
  };

  const hasVariants = variants && variants.length > 0;
  const hasOptionGroups = optionGroups && optionGroups.length > 0;

  if (loading) {
    return (
      <div className="hidden md:flex flex-col gap-6">
        <VariantsSkeleton hasOptionGroups={hasOptionGroups} />
        {/* Quantity skeleton */}
        <div className="flex items-center gap-5 pt-1">
          <div className="h-4 w-16 skeleton rounded" />
          <div className="flex items-center gap-0.5">
            <div className="w-8 h-8 skeleton rounded-sm" />
            <div className="w-8 h-8" />
            <div className="w-8 h-8 skeleton rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex flex-col gap-6">
      {/* Option Groups (Өнгө, Хэмжээ, etc.) */}
      {hasOptionGroups && (
        <div className="flex flex-col gap-5">
          {optionGroups.map((group) => {
            // Determine the correct position in option_values
            // option_values is ordered: required groups first, then optional groups
            const isOptional = group.is_required === false;
            const posIndex = isOptional
              ? requiredGroups.length + optionalGroups.findIndex((g) => g.type === group.type)
              : requiredGroups.findIndex((g) => g.type === group.type);

            // Find variant image for each option value
            const getVariantImageForValue = (value: string): string | null => {
              if (!variants) return null;
              const matchingVariant = variants.find((v) => {
                if (!v.option_values || v.option_values.length <= posIndex) return false;
                return v.option_values[posIndex] === value;
              });
              return matchingVariant?.images?.[0] ?? null;
            };

            const isValueOutOfStock = (value: string): boolean => {
              if (!variants) return false;
              // Filter variants matching this value at this position
              let matching = variants.filter((v) => {
                if (!v.option_values || v.option_values.length <= posIndex) return false;
                return v.option_values[posIndex] === value;
              });

              // Context-aware: also filter by selected options from OTHER groups
              for (const [otherType, otherValue] of Object.entries(selectedOptions)) {
                if (otherType === group.type) continue;
                const otherPos = groupPositions.get(otherType);
                if (otherPos === undefined) continue;
                matching = matching.filter((v) => {
                  if (!v.option_values || v.option_values.length <= otherPos) return false;
                  return v.option_values[otherPos] === otherValue;
                });
              }

              return matching.length > 0 && matching.every((v) => v.stock_quantity <= 0);
            };

            return (
              <OptionGroupRow
                key={group.type}
                group={group}
                selectedOptions={selectedOptions}
                getVariantImageForValue={getVariantImageForValue}
                onOptionSelect={handleOptionSelect}
                isValueOutOfStock={isValueOutOfStock}
                isOptional={isOptional}
              />
            );
          })}
        </div>
      )}

      {/* Original variant selector (fallback when no option_groups) */}
      {hasVariants && !hasOptionGroups && (
        <div className="flex flex-col">
          <p className="text-[#020617] font-medium text-sm font-manrope px-0.5">
            Төрөл
          </p>
          <div className="grid grid-cols-2 gap-2 pt-3 px-0.5">
            {variants.map((variant, index) => {
              const isOutOfStock = variant.stock_quantity <= 0;
              const hasDiscount =
                variant.discount_price != null &&
                variant.discount_price < variant.price;
              const discount = hasDiscount
                ? Math.round(
                    ((variant.price - variant.discount_price!) /
                      variant.price) *
                      100,
                  )
                : null;
              const sellingPrice = hasDiscount
                ? variant.discount_price!
                : variant.price;

              // First variant uses main product name and image
              const isFirstVariant = index === 0;
              const displayName =
                isFirstVariant && productName
                  ? productName
                  : variant.name || variant.sku || "Variant";
              const displayImage =
                isFirstVariant && productImage
                  ? productImage
                  : variant.images?.[0];

              return (
                <button
                  key={variant.id}
                  onClick={() => !isOutOfStock && onVariantChange?.(variant.id)}
                  disabled={isOutOfStock}
                  className={`w-full p-0.5 border-[1.2px] rounded-lg flex items-center transition-all duration-300 ${
                    isOutOfStock
                      ? "opacity-40 cursor-not-allowed"
                      : selectedVariantId === variant.id
                        ? "border-[#020617] bg-white shadow-sm cursor-pointer"
                        : "border-transparent bg-white hover:border-[#CBD5E1] cursor-pointer"
                  }`}
                >
                  <div className="flex items-center border border-[#F8FAFC] rounded-md w-full">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={displayName}
                        width={44}
                        height={44}
                        quality={75}
                        className="w-11 h-11 object-cover object-center rounded-l-md"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-[#F8FAFC] rounded-l-md"></div>
                    )}

                    <div className="flex flex-col items-start px-2 py-0.5">
                      <p className="text-[#020617] font-normal text-xs font-manrope line-clamp-1">
                        {displayName}
                      </p>
                      {isOutOfStock ? (
                        <p className="text-[#F43F5E] font-medium text-[10px] font-manrope">
                          Дууссан
                        </p>
                      ) : (
                      <div className="flex gap-0.5">
                        <div className="flex gap-0.5 min-w-[68px]">
                          {discount && (
                            <p className="text-[#F43F5E] pt-px font-medium text-[10px] font-manrope">
                              {discount}%
                            </p>
                          )}
                          <p className="text-[#020617] font-medium text-xs font-manrope tracking-tight">
                            {formatPrice(sellingPrice)}
                          </p>
                        </div>
                        {discount && (
                          <span className="text-[#64748B] pt-px text-[10px] font-manrope line-through tracking-[-0.4px]">
                            {formatPrice(variant.price)}
                          </span>
                        )}
                      </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div className="flex items-center gap-5 pt-1">
        <p className="text-[#020617] font-medium text-sm font-manrope">
          Тоо ширхэг
        </p>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={!canDecrease}
            className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
              canDecrease
                ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                : "border-[#CBD5E1]"
            }`}
          >
            <Minus color={canDecrease ? "#020617" : "#CBD5E1"} />
          </button>
          <span className="w-8 h-8 flex items-center justify-center text-[#020617] font-semibold text-sm">
            {quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={!canIncrease}
            className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
              canIncrease
                ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                : "border-[#CBD5E1]"
            }`}
          >
            <Plus color={canIncrease ? "#020617" : "#CBD5E1"} />
          </button>
        </div>
      </div>
    </div>
  );
};
