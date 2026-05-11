"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Cancel, Minus, Plus, ChevronDownBlack, ChevronDownCart } from "../svg";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, getDiscountPercentage } from "@/lib/utils/formatters";
import { ROUTES } from "@/lib/utils/constants";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { useProductDetail } from "@/lib/hooks/useProductDetail";
import type { ProductVariant } from "@/types/product";
import type { ProductWithDetails, OptionGroup } from "@/lib/queries/products";
import { Check } from "lucide-react";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithDetails;
  quantity?: number;
  variant?: ProductVariant | null;
}

export const AddToCartModal = ({
  isOpen,
  onClose,
  product,
  quantity: initialQuantity = 1,
  variant: initialVariant = null,
}: AddToCartModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragYRef = useRef(0);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  // Fetch full product details when variants are missing (e.g., from ProductCard)
  const needsFetch = isOpen && product.variants === undefined;
  const { data: fetchedProduct, isLoading: isLoadingDetails } =
    useProductDetail(needsFetch ? product.slug : "");
  const resolvedProduct = (fetchedProduct ?? product) as ProductWithDetails;

  // Mobile-specific state
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedVariantId, setSelectedVariantId] = useState<
    string | undefined
  >(initialVariant?.id);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [mobilePhase, setMobilePhase] = useState<"accordion" | "summary">(
    "accordion",
  );
  const [expandedGroupIndex, setExpandedGroupIndex] = useState<number>(0);
  const [cartItems, setCartItems] = useState<
    Array<{
      variantId: string;
      options: Record<string, string>;
      quantity: number;
    }>
  >([]);
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(
    null,
  );

  const variants = resolvedProduct.variants;
  const optionGroups = resolvedProduct.option_groups as
    | OptionGroup[]
    | undefined;
  const hasVariants = variants && variants.length > 0;
  const hasOptionGroups = optionGroups && optionGroups.length > 0;
  const requiredGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required !== false) ?? [],
    [optionGroups],
  );
  const optionalGroups = useMemo(
    () => optionGroups?.filter((g) => g.is_required === false) ?? [],
    [optionGroups],
  );
  const allAccordionGroups = useMemo(
    () => [...requiredGroups, ...optionalGroups],
    [requiredGroups, optionalGroups],
  );

  // Get selected variant
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId) || variants[0]
    : null;

  // Use variant price/discount if available, otherwise resolvedProduct price
  const currentPrice = selectedVariant
    ? selectedVariant.price
    : resolvedProduct.price;
  const currentDiscountPrice = selectedVariant
    ? selectedVariant.discount_price
    : resolvedProduct.discount_price;
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : resolvedProduct.stock_quantity;
  const discount = getDiscountPercentage(currentPrice, currentDiscountPrice);
  const displayImage =
    selectedVariant?.images?.[0] ?? resolvedProduct.images?.[0];
  const displayName = selectedVariant?.name || resolvedProduct.name;
  const sellingPrice =
    currentDiscountPrice != null && currentDiscountPrice < currentPrice
      ? currentDiscountPrice
      : currentPrice;

  useScrollLock(visible);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize selected options from variant
  useEffect(() => {
    if (!isOpen) return;

    setQuantity(initialQuantity);
    setHasAddedToCart(false);
    setCartItems([]);
    setEditingCartItemId(null);

    // Reset mobile phase
    const hasVars = variants && variants.length > 0;
    if (hasVars) {
      setMobilePhase("accordion");
      setExpandedGroupIndex(0);
    } else {
      setMobilePhase("summary");
    }

    if (optionGroups && optionGroups.length > 0 && variants) {
      // Prefer a base variant (required-only, no optional values) for initial selection
      const baseVariant = requiredGroups.length > 0
        ? variants.find((v) => v.option_values && v.option_values.length === requiredGroups.length)
        : undefined;
      const variant = initialVariant || baseVariant || variants[0];
      setSelectedVariantId(variant?.id);

      const options: Record<string, string> = {};

      if (variant?.option_values && variant.option_values.length > 0) {
        // Only map required groups (positional) - leave optional groups unselected
        requiredGroups.forEach((group, idx) => {
          if (variant.option_values && variant.option_values[idx]) {
            options[group.type] = variant.option_values[idx];
          }
        });
      } else {
        // Only pre-select required groups; leave optional groups empty
        optionGroups.forEach((group) => {
          if (group.values.length > 0 && group.is_required !== false) {
            options[group.type] = group.values[0];
          }
        });
      }
      setSelectedOptions(options);
    } else {
      setSelectedVariantId(initialVariant?.id || variants?.[0]?.id);
    }
  }, [isOpen, initialQuantity, initialVariant, optionGroups, variants]);

  // Desktop: Add to cart immediately when modal opens (wait for variant data if fetching)
  useEffect(() => {
    if (isOpen && !isMobile && !hasAddedToCart && !isLoadingDetails) {
      const defaultVariant =
        initialVariant ?? resolvedProduct.variants?.[0] ?? null;
      // Variant бүхий бүтээгдэхүүнийг variant-гүйгээр нэмэхээс сэргийлэх
      const hasVariants =
        resolvedProduct.variants && resolvedProduct.variants.length > 0;
      if (hasVariants && !defaultVariant) return;
      // Нөөц дууссан бүтээгдэхүүнийг сагсанд нэмэхээс сэргийлэх
      const currentStock =
        defaultVariant?.stock_quantity ?? resolvedProduct.stock_quantity;
      if (currentStock <= 0) return;
      addItem(resolvedProduct, initialQuantity, defaultVariant);
      setHasAddedToCart(true);
    }
  }, [
    isOpen,
    isMobile,
    hasAddedToCart,
    isLoadingDetails,
    addItem,
    resolvedProduct,
    initialQuantity,
    initialVariant,
  ]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  // Build variant name from options: required values + selected optional values (in order)
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

  const handleOptionSelect = useCallback(
    (groupType: string, value: string) => {
      // Allow toggling optional groups off by clicking the same value
      const isOptional = optionalGroups.some((g) => g.type === groupType);
      const newOptions = { ...selectedOptions };
      if (isOptional && selectedOptions[groupType] === value) {
        delete newOptions[groupType];
      } else {
        newOptions[groupType] = value;
      }
      setSelectedOptions(newOptions);

      if (!variants) return;

      const expectedName = buildVariantName(newOptions);
      if (!expectedName) return;

      const matchingVariant = variants.find((v) => v.name === expectedName);
      if (matchingVariant) {
        setSelectedVariantId(matchingVariant.id);
      }
    },
    [selectedOptions, optionalGroups, buildVariantName, variants],
  );

  const handleQuantityChange = useCallback(
    (delta: number) => {
      setQuantity((prev) => {
        let next = prev + delta;
        next = Math.max(1, next);
        if (currentStock != null) next = Math.min(currentStock, next);
        return next;
      });
    },
    [currentStock],
  );

  // Smooth content fade transition between drawer phases
  const slideTransition = useCallback((callback: () => void) => {
    setContentVisible(false);
    setTimeout(() => {
      callback();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setContentVisible(true);
        });
      });
    }, 200);
  }, []);

  const handleMobileAddToCart = useCallback(() => {
    if (hasVariants && cartItems.length > 0) {
      cartItems.forEach((item) => {
        const variant = variants?.find((v) => v.id === item.variantId) || null;
        if (!variant) return;
        // Skip items whose variant ran out of stock after the user
        // staged them — previously this branch had no guard and was
        // the primary path for mobile adding out-of-stock products
        // (seen on E.l.f Eyeshadow Palette: 80+ orders while the
        // product was at stock=0).
        if (variant.stock_quantity <= 0) return;
        addItem(resolvedProduct, item.quantity, variant);
      });
    } else {
      if (hasVariants && !selectedVariant) return;
      const stockNow =
        selectedVariant?.stock_quantity ?? resolvedProduct.stock_quantity;
      if (stockNow <= 0) return;
      addItem(resolvedProduct, quantity, selectedVariant);
    }
    slideTransition(() => setHasAddedToCart(true));
  }, [
    addItem,
    resolvedProduct,
    quantity,
    selectedVariant,
    hasVariants,
    cartItems,
    variants,
    slideTransition,
  ]);

  const canDecrease = quantity > 1;
  const canIncrease = currentStock == null || quantity < currentStock;

  // Get the correct position index in option_values for a group
  // option_values is ordered: required groups first, then optional groups
  const getOptionValuesIndex = useCallback(
    (groupType: string): number => {
      const reqIdx = requiredGroups.findIndex((g) => g.type === groupType);
      if (reqIdx !== -1) return reqIdx;
      const optIdx = optionalGroups.findIndex((g) => g.type === groupType);
      if (optIdx !== -1) return requiredGroups.length + optIdx;
      return -1;
    },
    [requiredGroups, optionalGroups],
  );

  // Check if all variants for this option value are out of stock
  const isOptionOutOfStock = useCallback(
    (groupType: string, value: string): boolean => {
      if (!variants) return false;
      const posIndex = getOptionValuesIndex(groupType);
      if (posIndex === -1) return false;
      const matching = variants.filter((v) => {
        if (!v.option_values || v.option_values.length <= posIndex)
          return false;
        return v.option_values[posIndex] === value;
      });
      return (
        matching.length > 0 && matching.every((v) => v.stock_quantity <= 0)
      );
    },
    [getOptionValuesIndex, variants],
  );

  // Find the first variant image matching a given option value
  const getOptionImage = useCallback(
    (groupType: string, value: string): string | null => {
      if (!variants) return null;
      const posIndex = getOptionValuesIndex(groupType);
      if (posIndex === -1) return null;
      const match = variants.find((v) => {
        if (!v.option_values || v.option_values.length <= posIndex)
          return false;
        return v.option_values[posIndex] === value && v.images?.length > 0;
      });
      return match?.images?.[0] ?? null;
    },
    [getOptionValuesIndex, variants],
  );

  // Helper: find matching variant and add to cart items, then transition to summary
  const finalizeVariantSelection = useCallback(
    (finalOptions: Record<string, string>) => {
      if (!variants) return;

      const expectedName = buildVariantName(finalOptions);
      if (!expectedName) return;

      const matchingVariant = variants.find((v) => v.name === expectedName);
      if (!matchingVariant) return;

      if (editingCartItemId) {
        setCartItems((prev) => {
          const oldItem = prev.find(
            (item) => item.variantId === editingCartItemId,
          );
          const oldQty = oldItem?.quantity ?? 1;
          const withoutOld = prev.filter(
            (item) => item.variantId !== editingCartItemId,
          );
          const existing = withoutOld.find(
            (item) => item.variantId === matchingVariant.id,
          );
          if (existing) {
            return withoutOld.map((item) =>
              item.variantId === matchingVariant.id
                ? { ...item, quantity: item.quantity + oldQty }
                : item,
            );
          }
          return [
            ...withoutOld,
            {
              variantId: matchingVariant.id,
              options: { ...finalOptions },
              quantity: oldQty,
            },
          ];
        });
        setEditingCartItemId(null);
      } else {
        setCartItems((prev) => {
          const existing = prev.find(
            (item) => item.variantId === matchingVariant.id,
          );
          if (existing) {
            return prev.map((item) =>
              item.variantId === matchingVariant.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            );
          }
          return [
            ...prev,
            {
              variantId: matchingVariant.id,
              options: { ...finalOptions },
              quantity: 1,
            },
          ];
        });
      }

      slideTransition(() => {
        setExpandedGroupIndex(-1);
        setMobilePhase("summary");
      });
    },
    [buildVariantName, variants, editingCartItemId, slideTransition],
  );

  // Accordion wrapper: calls existing handleOptionSelect then auto-advances
  const handleAccordionOptionSelect = useCallback(
    (groupType: string, value: string) => {
      handleOptionSelect(groupType, value);

      const currentIndex = allAccordionGroups.findIndex(
        (g) => g.type === groupType,
      );
      if (currentIndex === -1) return;
      if (currentIndex < allAccordionGroups.length - 1) {
        setTimeout(() => setExpandedGroupIndex(currentIndex + 1), 200);
      } else {
        // Last group - compute variant and add to cart items
        const newOptions = { ...selectedOptions, [groupType]: value };
        finalizeVariantSelection(newOptions);
      }
    },
    [
      handleOptionSelect,
      allAccordionGroups,
      selectedOptions,
      finalizeVariantSelection,
    ],
  );

  // Skip an optional group without selecting a value
  const handleSkipOptionalGroup = useCallback(
    (groupIndex: number) => {
      if (groupIndex < allAccordionGroups.length - 1) {
        setExpandedGroupIndex(groupIndex + 1);
      } else {
        // Last group - finalize without this optional group
        finalizeVariantSelection(selectedOptions);
      }
    },
    [allAccordionGroups, selectedOptions, finalizeVariantSelection],
  );

  // Fallback variant select wrapper (no option groups)
  const handleAccordionVariantSelect = useCallback(
    (variantId: string) => {
      setSelectedVariantId(variantId);
      setCartItems((prev) => {
        const existing = prev.find((item) => item.variantId === variantId);
        if (existing) {
          return prev.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        return [...prev, { variantId, options: {}, quantity: 1 }];
      });
      slideTransition(() => setMobilePhase("summary"));
    },
    [slideTransition],
  );

  const handleCartItemQuantityChange = useCallback(
    (variantId: string, delta: number) => {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.variantId !== variantId) return item;
          const variant = variants?.find((v) => v.id === variantId);
          const stock = variant?.stock_quantity;
          let next = item.quantity + delta;
          next = Math.max(1, next);
          if (stock != null) next = Math.min(stock, next);
          return { ...item, quantity: next };
        }),
      );
    },
    [variants],
  );

  const handleRemoveCartItem = useCallback((variantId: string) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.variantId !== variantId);
      if (next.length === 0) {
        setMobilePhase("accordion");
        setExpandedGroupIndex(0);
        setSelectedOptions({});
        setSelectedVariantId(undefined);
      }
      return next;
    });
  }, []);

  const totalPrice = useMemo(() => {
    if (cartItems.length === 0) return sellingPrice * quantity;
    return cartItems.reduce((sum, item) => {
      const variant = variants?.find((v) => v.id === item.variantId);
      const price = variant?.price ?? resolvedProduct.price;
      const discountPrice = variant
        ? variant.discount_price
        : resolvedProduct.discount_price;
      const selling =
        discountPrice != null && discountPrice < price ? discountPrice : price;
      return sum + selling * item.quantity;
    }, 0);
  }, [cartItems, variants, resolvedProduct, sellingPrice, quantity]);

  // Swipe-to-dismiss handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest(
      "[data-scrollable]",
    ) as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    touchStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = false;
    dragYRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    if (deltaY <= 0) {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragY(0);
      }
      return;
    }
    const target = e.target as HTMLElement;
    const scrollable = target.closest(
      "[data-scrollable]",
    ) as HTMLElement | null;
    if (scrollable && scrollable.scrollTop > 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragYRef.current = deltaY;
    setDragY(deltaY);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (dragYRef.current > 100) {
      onClose();
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    dragYRef.current = 0;
  }, [onClose]);

  // Shared drawer style with drag support
  const getDrawerStyle = (extraTransform?: string): React.CSSProperties => ({
    transform: isDragging
      ? `translateY(${dragY}px)`
      : animate
        ? (extraTransform ?? "translateY(0)")
        : "translateY(100%)",
    transition: isDragging
      ? "none"
      : "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform",
  });

  const drawerTouchProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  if (!visible || typeof window === "undefined") return null;

  // Mobile Bottom Sheet
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-999 flex flex-col justify-end">
        <div
          className="absolute inset-0 bg-[rgba(2,6,23,0.30)] touch-none"
          style={{
            opacity: isDragging
              ? Math.max(0, 1 - dragY / 300)
              : animate
                ? 1
                : 0,
            transition: isDragging
              ? "none"
              : "opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
          onClick={onClose}
          aria-hidden="true"
        />

        {hasAddedToCart ? (
          /* Phase 3: Success view after adding to cart */
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
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-[#020617] font-semibold text-xl font-manrope">
                  Сагсанд нэмэгдлээ
                </p>
                <button
                  onClick={onClose}
                  className="p-1 cursor-pointer"
                  aria-label="Close"
                >
                  <Cancel />
                </button>
              </div>

              {/* Product Info */}
              {hasVariants && cartItems.length > 0 ? (
                <div className="flex flex-col gap-6 pb-4">
                  {cartItems.map((item) => {
                    const itemVariant = variants?.find(
                      (v) => v.id === item.variantId,
                    );
                    if (!itemVariant) return null;
                    const itemImage =
                      itemVariant.images?.[0] ?? resolvedProduct.images?.[0];
                    const itemName = itemVariant.name || resolvedProduct.name;
                    const itemPrice = itemVariant.price;
                    const itemDiscountPrice = itemVariant.discount_price;
                    const itemSellingPrice =
                      itemDiscountPrice != null && itemDiscountPrice < itemPrice
                        ? itemDiscountPrice
                        : itemPrice;
                    const itemDiscount = getDiscountPercentage(
                      itemPrice,
                      itemDiscountPrice,
                    );
                    const itemOptionsText = hasOptionGroups
                      ? optionGroups!
                          .map((g) => item.options[g.type])
                          .filter(Boolean)
                          .join(" / ")
                      : null;

                    return (
                      <div key={item.variantId} className="flex gap-5">
                        <div className="w-[86px] h-[86px] rounded-sm border border-[#F1F5F9] shrink-0 overflow-hidden">
                          {itemImage ? (
                            <Image
                              src={itemImage}
                              alt={itemName}
                              width={86}
                              height={86}
                              quality={75}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#F1F5F9]" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex flex-col">
                            {itemOptionsText && (
                              <p className="text-[#64748B] font-medium text-sm font-manrope line-clamp-1">
                                {itemOptionsText}
                              </p>
                            )}
                            <p className="text-[#020617] font-semibold text-sm font-manrope line-clamp-1 leading-5">
                              {itemName}
                            </p>
                          </div>
                          <div className="flex flex-col">
                            {itemDiscountPrice != null &&
                              itemDiscountPrice < itemPrice && (
                                <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                                  {formatPrice(itemPrice)}
                                </p>
                              )}
                            <div className="flex items-center gap-1">
                              {itemDiscount && (
                                <p className="text-[#F43F5E] font-semibold text-sm font-manrope">
                                  {itemDiscount}%
                                </p>
                              )}
                              <p className="text-[#020617] font-semibold text-sm font-manrope">
                                {formatPrice(itemSellingPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-3 pb-2">
                  <div className="w-[86px] h-[86px] rounded-sm border border-[#F1F5F9] shrink-0 overflow-hidden">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={displayName}
                        width={86}
                        height={86}
                        quality={75}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F1F5F9]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col">
                      {(selectedVariant?.sku || resolvedProduct.sku) && (
                        <p className="text-[#64748B] font-medium text-sm font-manrope">
                          {selectedVariant?.sku || resolvedProduct.sku}
                        </p>
                      )}
                      <p className="text-[#020617] font-semibold text-sm font-manrope line-clamp-1 leading-5">
                        {displayName}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      {currentDiscountPrice != null &&
                        currentDiscountPrice < currentPrice && (
                          <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                            {formatPrice(currentPrice)}
                          </p>
                        )}
                      <div className="flex items-center gap-1">
                        {discount && (
                          <p className="text-[#F43F5E] font-semibold text-sm font-manrope">
                            {discount}%
                          </p>
                        )}
                        <p className="text-[#020617] font-semibold text-sm font-manrope">
                          {formatPrice(sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div
                className="flex items-center gap-2"
                style={{
                  paddingBottom: "max(8px, env(safe-area-inset-bottom))",
                }}
              >
                <button
                  onClick={() => {
                    onClose();
                    router.push(ROUTES.CART);
                  }}
                  className="flex-1 px-3 py-3 h-11 border border-[#E2E8F0] rounded-sm text-[#020617] font-normal text-base font-manrope flex items-center justify-center hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer"
                >
                  Сагсруу очих
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-3 h-11 bg-[#020617] rounded-sm text-white font-normal text-base font-manrope flex items-center justify-center hover:bg-[#1E293B] transition-colors duration-200 cursor-pointer"
                >
                  Өөр бараа үзэх
                </button>
              </div>
            </div>
          </div>
        ) : mobilePhase === "accordion" ? (
          /* Phase 1: Accordion variant selection */
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
                  {allAccordionGroups.map((group, groupIndex) => {
                    const isExpanded = expandedGroupIndex === groupIndex;
                    const selectedValue = selectedOptions[group.type];
                    const isOptionalGroup = group.is_required === false;

                    return (
                      <div
                        key={group.type}
                        className="border border-[#E2E8F0] rounded-sm overflow-hidden"
                      >
                        {/* Accordion header */}
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
                            {isOptionalGroup && (
                              <span className="text-[#94A3B8] font-normal text-sm ml-1">
                                (заавал биш)
                              </span>
                            )}
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

                        {/* Accordion content */}
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
                                  onClick={() =>
                                    handleSkipOptionalGroup(groupIndex)
                                  }
                                  className="w-full flex items-center h-12 justify-start pl-3 border-t border-[#E2E8F0] text-[#64748B] text-sm font-manrope font-medium cursor-pointer active:bg-[#F8FAFC]"
                                >
                                  Алгасах
                                </button>
                              )}
                              {group.values.map((value) => {
                                const isSelected =
                                  selectedOptions[group.type] === value;
                                const outOfStock = isOptionOutOfStock(
                                  group.type,
                                  value,
                                );
                                const optionImage = getOptionImage(
                                  group.type,
                                  value,
                                );

                                return (
                                  <button
                                    key={value}
                                    onClick={() =>
                                      !outOfStock &&
                                      handleAccordionOptionSelect(
                                        group.type,
                                        value,
                                      )
                                    }
                                    disabled={outOfStock}
                                    className={`w-full flex items-center h-14 justify-between pl-3 pr-6 py-3 border-t border-[#E2E8F0] transition-all duration-300`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {optionImage && (
                                        <Image
                                          src={optionImage}
                                          alt={value}
                                          width={32}
                                          height={32}
                                          quality={75}
                                          className="w-8 h-8 rounded-sm object-cover shrink-0"
                                        />
                                      )}
                                      <span
                                        className={`text-sm text-[#020617] font-manrope ${
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
                                      <span className="pt-0.5 pb-1 px-1.5 bg-[#F1F5F9] rounded-full text-[#94A3B8] text-xs font-medium font-manrope">
                                        Дууссан
                                      </span>
                                    ) : isSelected ? (
                                      <Check
                                        size={16}
                                        strokeWidth={1.5}
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
              ) : hasVariants ? (
                /* Fallback: flat variant list in bordered card */
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  {variants.map((variant, index) => {
                    const isOutOfStock = variant.stock_quantity <= 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() =>
                          !isOutOfStock &&
                          handleAccordionVariantSelect(variant.id)
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
                        <div className="flex items-center gap-3">
                          {variant.images?.[0] && (
                            <Image
                              src={variant.images[0]}
                              alt={variant.name || "Variant"}
                              width={36}
                              height={36}
                              quality={75}
                              className="w-9 h-9 rounded-sm object-cover shrink-0"
                            />
                          )}
                          <span
                            className={`text-base font-manrope ${
                              selectedVariantId === variant.id
                                ? "text-[#020617] font-semibold"
                                : "text-[#020617] font-normal"
                            }`}
                          >
                            {variant.name || variant.sku || "Variant"}
                          </span>
                        </div>
                        {isOutOfStock && (
                          <span className="text-[#F43F5E] text-xs font-medium font-manrope">
                            Дууссан
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Phase 2: Cart summary view */
          <div
            className="relative bg-white rounded-t-2xl flex flex-col"
            style={{ height: "60vh", ...getDrawerStyle() }}
            {...drawerTouchProps}
          >
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={{
                opacity: contentVisible ? 1 : 0,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Content */}
              <div
                data-scrollable
                className="flex-1 flex flex-col gap-6 w-full overflow-y-auto overscroll-y-contain px-4 py-5"
              >
                {/* Change variant button - styled as bordered select field */}
                {hasVariants && (
                  <button
                    onClick={() =>
                      slideTransition(() => {
                        setEditingCartItemId(null);
                        setSelectedOptions({});
                        setSelectedVariantId(undefined);
                        setMobilePhase("accordion");
                        setExpandedGroupIndex(0);
                      })
                    }
                    className="w-full bg-white flex items-center justify-between min-h-12 pl-3 pr-0.5 cursor-pointer border border-[#E2E8F0] rounded-sm"
                  >
                    <span className="text-[#020617] font-semibold text-base font-manrope">
                      Өөр төрлөөс нэмэх
                    </span>
                    <div className="p-1.5">
                      <ChevronDownBlack />
                    </div>
                  </button>
                )}

                {/* Cart items list (variant products) */}
                {hasVariants && cartItems.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {cartItems.map((item) => {
                      const itemVariant = variants?.find(
                        (v) => v.id === item.variantId,
                      );
                      if (!itemVariant) return null;
                      const itemImage =
                        itemVariant.images?.[0] ?? resolvedProduct.images?.[0];
                      const itemName = itemVariant.name || resolvedProduct.name;
                      const itemPrice = itemVariant.price;
                      const itemDiscountPrice = itemVariant.discount_price;
                      const itemSellingPrice =
                        itemDiscountPrice != null &&
                        itemDiscountPrice < itemPrice
                          ? itemDiscountPrice
                          : itemPrice;
                      const itemDiscount = getDiscountPercentage(
                        itemPrice,
                        itemDiscountPrice,
                      );
                      const itemStock = itemVariant.stock_quantity;
                      const itemCanDecrease = item.quantity > 1;
                      const itemCanIncrease =
                        itemStock == null || item.quantity < itemStock;
                      const itemOptionsText = hasOptionGroups
                        ? optionGroups!
                            .map((g) => item.options[g.type])
                            .filter(Boolean)
                            .join(" / ")
                        : null;

                      return (
                        <div
                          key={item.variantId}
                          className="flex gap-4 items-start"
                        >
                          <div className="w-[72px] h-[72px] rounded-sm shrink-0 overflow-hidden">
                            {itemImage ? (
                              <Image
                                src={itemImage}
                                alt={itemName}
                                width={72}
                                height={72}
                                quality={75}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#F1F5F9]" />
                            )}
                          </div>

                          <div className="flex gap-4 items-start flex-1 min-w-0">
                            <div className="flex flex-col gap-4 flex-1 min-w-0">
                              <div className="flex flex-col gap-2">
                                <p className="text-[#020617] font-normal text-xs font-manrope leading-5 line-clamp-1">
                                  {resolvedProduct.name}
                                </p>
                                {itemOptionsText && (
                                  <button
                                    onClick={() =>
                                      slideTransition(() => {
                                        setEditingCartItemId(item.variantId);
                                        setSelectedOptions(item.options);
                                        setMobilePhase("accordion");
                                        setExpandedGroupIndex(0);
                                      })
                                    }
                                    className="inline-flex items-center justify-between gap-0.5 px-1 py-1.5 bg-[#F8FAFC] rounded-sm cursor-pointer"
                                  >
                                    <span className="w-full text-[#64748B] font-normal text-xs font-manrope line-clamp-1 text-left">
                                      {itemOptionsText}
                                    </span>
                                    <div className="flex-1">
                                      <ChevronDownCart />
                                    </div>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-6">
                                {/* Quantity selector */}
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() =>
                                      handleCartItemQuantityChange(
                                        item.variantId,
                                        -1,
                                      )
                                    }
                                    disabled={!itemCanDecrease}
                                    className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                                      itemCanDecrease
                                        ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                                        : "border-[#E2E8F0]"
                                    }`}
                                  >
                                    <Minus
                                      color={
                                        itemCanDecrease ? "#020617" : "#CBD5E1"
                                      }
                                    />
                                  </button>
                                  <span className="w-8 h-8 flex items-center justify-center text-[#020617] font-semibold text-sm font-manrope">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleCartItemQuantityChange(
                                        item.variantId,
                                        1,
                                      )
                                    }
                                    disabled={!itemCanIncrease}
                                    className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                                      itemCanIncrease
                                        ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                                        : "border-[#E2E8F0]"
                                    }`}
                                  >
                                    <Plus
                                      color={
                                        itemCanIncrease ? "#020617" : "#CBD5E1"
                                      }
                                    />
                                  </button>
                                </div>

                                {/* Price */}
                                <div className="flex flex-col">
                                  {itemDiscountPrice != null &&
                                    itemDiscountPrice < itemPrice && (
                                      <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                                        {formatPrice(itemPrice)}
                                      </p>
                                    )}
                                  <div className="flex items-center gap-1">
                                    {itemDiscount && (
                                      <p className="text-[#F43F5E] font-semibold text-xs font-manrope">
                                        {itemDiscount}%
                                      </p>
                                    )}
                                    <p className="text-[#020617] font-semibold text-xs font-manrope whitespace-nowrap">
                                      {formatPrice(itemSellingPrice)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                handleRemoveCartItem(item.variantId)
                              }
                              className="p-2 shrink-0 cursor-pointer"
                              aria-label="Remove"
                            >
                              <Cancel />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !hasVariants ? (
                  /* Single product card for non-variant products */
                  <div className="flex gap-4 items-start">
                    <div className="w-[72px] h-[72px] rounded-lg border border-[#F1F5F9] shrink-0 overflow-hidden">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={displayName}
                          width={72}
                          height={72}
                          quality={75}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F1F5F9]" />
                      )}
                    </div>

                    <div className="flex gap-8 items-start">
                      <div className="flex flex-col gap-4 flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <p className="text-[#020617] font-medium text-sm font-manrope leading-5 line-clamp-2 flex-1">
                            {displayName}
                          </p>
                        </div>

                        {/* Quantity selector */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={!canDecrease}
                            className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                              canDecrease
                                ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                                : "border-[#E2E8F0]"
                            }`}
                          >
                            <Minus
                              color={canDecrease ? "#020617" : "#CBD5E1"}
                            />
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center text-[#020617] font-semibold text-sm font-manrope">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={!canIncrease}
                            className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
                              canIncrease
                                ? "border-[#020617] cursor-pointer hover:bg-[#F8FAFC]"
                                : "border-[#E2E8F0]"
                            }`}
                          >
                            <Plus color={canIncrease ? "#020617" : "#CBD5E1"} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="flex flex-col">
                          {currentDiscountPrice != null &&
                            currentDiscountPrice < currentPrice && (
                              <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                                {formatPrice(currentPrice)}
                              </p>
                            )}
                          <div className="flex items-center gap-1">
                            {discount && (
                              <p className="text-[#F43F5E] font-semibold text-sm font-manrope">
                                {discount}%
                              </p>
                            )}
                            <p className="text-[#020617] font-semibold text-sm font-manrope">
                              {formatPrice(sellingPrice)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={onClose}
                        className="p-0.5 shrink-0 cursor-pointer"
                        aria-label="Remove"
                      >
                        <Cancel />
                      </button>
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Fixed Bottom */}
              <div
                className="border-t border-[#F1F5F9] px-4 py-3"
                style={{
                  paddingBottom: "max(16px, env(safe-area-inset-bottom))",
                }}
              >
                <div className="flex items-center justify-end gap-3 mb-3 px-0.5">
                  <span className="text-[#020617] font-medium text-sm font-manrope">
                    Сонгосон хувилбаруудын үнэ:
                  </span>
                  <span className="text-[#020617] font-bold text-2xl leading-8 font-manrope tracking-[-0.6px]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                {(() => {
                  // Resolve whether at least one staged line is actually
                  // buyable. Previously the button was enabled whenever
                  // cartItems.length > 0 regardless of stock, letting
                  // the user tap Сагслах on a variant at stock=0.
                  const stagedBuyable = hasVariants
                    ? cartItems.some((item) => {
                        const v = variants?.find((x) => x.id === item.variantId);
                        return !!v && v.stock_quantity > 0;
                      })
                    : (currentStock ?? 0) > 0;
                  const disabled = hasVariants
                    ? cartItems.length === 0 || !stagedBuyable
                    : currentStock != null && currentStock <= 0;
                  return (
                    <button
                      onClick={handleMobileAddToCart}
                      disabled={disabled}
                      className={`w-full px-4 py-3.5 rounded-sm text-white font-normal text-lg font-manrope flex items-center justify-center gap-1 transition-colors ${
                        disabled
                          ? "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"
                          : "bg-[#020617] hover:bg-[#1E293B] cursor-pointer"
                      }`}
                    >
                      {!stagedBuyable && (hasVariants ? cartItems.length > 0 : true)
                        ? "Дууссан"
                        : "Сагслах"}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>,
      document.body,
    );
  }

  // Desktop Modal (unchanged)
  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[480px] bg-white rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[#020617] font-semibold text-xl font-manrope">
            Сагсанд нэмэгдлээ
          </p>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Close"
          >
            <Cancel />
          </button>
        </div>

        {/* Product Info */}
        <div className="flex gap-5 pb-4">
          <div className="w-[104px] h-[104px] rounded-sm border border-[#F1F5F9] shrink-0 overflow-hidden">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={displayName}
                width={104}
                height={104}
                quality={75}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#E2E8F0]" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-col">
              {(selectedVariant?.sku || resolvedProduct.sku) && (
                <p className="text-[#64748B] font-medium text-sm font-manrope">
                  {selectedVariant?.sku || resolvedProduct.sku}
                </p>
              )}
              <p className="text-[#020617] font-semibold text-sm font-manrope leading-5">
                {displayName}
              </p>
            </div>
            <div className="flex flex-col">
              {currentDiscountPrice != null &&
                currentDiscountPrice < currentPrice && (
                  <p className="text-[#64748B] font-normal text-xs font-manrope line-through">
                    {formatPrice(currentPrice)}
                  </p>
                )}
              <div className="flex items-center gap-1">
                {discount && (
                  <p className="text-[#F43F5E] font-semibold text-sm font-manrope">
                    {discount}%
                  </p>
                )}
                <p className="text-[#020617] font-semibold text-sm font-manrope">
                  {formatPrice(sellingPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              router.push(ROUTES.CART);
            }}
            className="flex px-3 py-2.5 h-11 border border-[#E2E8F0] rounded-sm text-[#020617] font-normal text-base font-manrope hover:bg-[#F8FAFC] transition-colors duration-200 cursor-pointer"
          >
            Сагсруу очих
          </button>
          <button
            onClick={onClose}
            className="flex px-3 py-2.5 h-11 bg-[#020617] rounded-sm text-white font-normal text-base font-manrope hover:bg-[#1E293B] transition-colors duration-200 cursor-pointer"
          >
            Өөр бараа үзэх
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
