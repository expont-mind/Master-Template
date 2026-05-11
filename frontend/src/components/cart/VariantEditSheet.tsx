"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDownBlack } from "../svg";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { useProductDetail } from "@/lib/hooks/useProductDetail";
import { useCartStore } from "@/stores/cart-store";
import { Check } from "lucide-react";
import type { OptionGroup } from "@/lib/queries/products";
import type { ProductVariant } from "@/types/product";

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
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const updateVariant = useCartStore((s) => s.updateVariant);

  const { data: product, isLoading } = useProductDetail(
    isOpen ? productSlug : "",
  );

  const variants = product?.variants;
  const optionGroups = product?.option_groups as OptionGroup[] | undefined;
  const hasOptionGroups = optionGroups && optionGroups.length > 0;

  useScrollLock(visible);

  // Initialize selected options from current variant
  useEffect(() => {
    if (!isOpen || !variants || !optionGroups) return;

    const currentVariant = variants.find((v) => v.id === currentVariantId);
    if (!currentVariant?.option_values) return;

    const options: Record<string, string> = {};
    optionGroups.forEach((group, idx) => {
      if (currentVariant.option_values && currentVariant.option_values[idx]) {
        options[group.type] = currentVariant.option_values[idx];
      }
    });
    setSelectedOptions(options);
    setExpandedGroupIndex(0);
  }, [isOpen, variants, optionGroups, currentVariantId]);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else if (visible) {
      setAnimate(false);
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, visible]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);

  const isOptionOutOfStock = useCallback(
    (groupType: string, value: string): boolean => {
      if (!optionGroups || !variants) return false;
      const groupIndex = optionGroups.findIndex((g) => g.type === groupType);
      if (groupIndex === -1) return false;
      const matching = variants.filter((v) => {
        if (!v.option_values || v.option_values.length <= groupIndex)
          return false;
        return v.option_values[groupIndex] === value;
      });
      return (
        matching.length > 0 && matching.every((v) => v.stock_quantity <= 0)
      );
    },
    [optionGroups, variants],
  );

  const handleOptionSelect = useCallback(
    (groupType: string, value: string) => {
      const newOptions = { ...selectedOptions, [groupType]: value };
      setSelectedOptions(newOptions);

      if (!optionGroups || !variants) return;

      const currentIndex = optionGroups.findIndex((g) => g.type === groupType);
      if (currentIndex < optionGroups.length - 1) {
        setTimeout(() => setExpandedGroupIndex(currentIndex + 1), 200);
      } else {
        // Last group — find matching variant and apply
        const expectedValues = optionGroups.map(
          (group) => newOptions[group.type],
        );
        if (expectedValues.some((v) => !v)) return;

        const matchingVariant = variants.find((v) => {
          if (
            !v.option_values ||
            v.option_values.length !== expectedValues.length
          )
            return false;
          return v.option_values.every(
            (val, idx) => val === expectedValues[idx],
          );
        });

        if (matchingVariant && matchingVariant.id !== currentVariantId) {
          updateVariant(cartItemId, matchingVariant);
        }
        setTimeout(() => onClose(), 300);
      }
    },
    [
      selectedOptions,
      optionGroups,
      variants,
      currentVariantId,
      cartItemId,
      updateVariant,
      onClose,
    ],
  );

  const handleFlatVariantSelect = useCallback(
    (variant: ProductVariant) => {
      if (variant.id !== currentVariantId) {
        updateVariant(cartItemId, variant);
      }
      setTimeout(() => onClose(), 300);
    },
    [currentVariantId, cartItemId, updateVariant, onClose],
  );

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] touch-none"
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
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <div className="h-12 skeleton rounded-sm" />
              <div className="h-12 skeleton rounded-sm" />
            </div>
          ) : hasOptionGroups ? (
            <div className="flex flex-col gap-6">
              {optionGroups.map((group, groupIndex) => {
                const isExpanded = expandedGroupIndex === groupIndex;
                const selectedValue = selectedOptions[group.type];

                return (
                  <div
                    key={group.type}
                    className="border border-[#E2E8F0] rounded-sm overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedGroupIndex(isExpanded ? -1 : groupIndex)
                      }
                      className="w-full bg-[#F8FAFC] flex items-center justify-between h-12 pl-3 pr-0.5 cursor-pointer"
                    >
                      <span
                        className={`font-manrope text-base ${
                          isExpanded || selectedValue
                            ? "text-[#020617] font-semibold"
                            : "text-[#94A3B8] font-medium"
                        }`}
                      >
                        {selectedValue
                          ? `${selectedValue}`
                          : `${group.type} сонгох`}
                      </span>
                      <div
                        className="transition-transform duration-300 p-1.5"
                        style={{
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
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
                          {group.values.map((value) => {
                            const isSelected =
                              selectedOptions[group.type] === value;
                            const outOfStock = isOptionOutOfStock(
                              group.type,
                              value,
                            );

                            return (
                              <button
                                key={value}
                                onClick={() =>
                                  !outOfStock &&
                                  handleOptionSelect(group.type, value)
                                }
                                disabled={outOfStock}
                                className={`w-full flex items-center h-14 justify-between pl-3 pr-3 py-3 border-t border-[#E2E8F0] transition-all duration-300 ${
                                  outOfStock
                                    ? "opacity-40 cursor-not-allowed"
                                    : isSelected
                                      ? "bg-[#F8FAFC]"
                                      : "cursor-pointer active:bg-[#F8FAFC]"
                                }`}
                              >
                                <span className="text-base font-manrope font-medium text-[#020617]">
                                  {value}
                                </span>
                                {outOfStock ? (
                                  <span className="text-[#F43F5E] text-xs font-medium font-manrope">
                                    Дууссан
                                  </span>
                                ) : isSelected ? (
                                  <Check
                                    size={16}
                                    className="text-[#020617]"
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : variants && variants.length > 0 ? (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              {variants.map((variant, index) => {
                const isOutOfStock = variant.stock_quantity <= 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() =>
                      !isOutOfStock && handleFlatVariantSelect(variant)
                    }
                    disabled={isOutOfStock}
                    className={`w-full flex items-center justify-between px-4 py-4 transition-colors duration-150 ${
                      index > 0 ? "border-t border-[#E2E8F0]" : ""
                    } ${
                      isOutOfStock
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer active:bg-[#F8FAFC]"
                    }`}
                  >
                    <span
                      className={`text-base font-manrope ${
                        currentVariantId === variant.id
                          ? "text-[#020617] font-semibold"
                          : "text-[#020617] font-normal"
                      }`}
                    >
                      {variant.name || variant.sku || "Variant"}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[#F43F5E] text-xs font-medium font-manrope">
                        Дууссан
                      </span>
                    ) : currentVariantId === variant.id ? (
                      <Check size={16} className="text-[#020617]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
};
