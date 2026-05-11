"use client";

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  Heart,
  Slash,
  ShoppingCartProduct,
  ChevronDownCategory,
  Star,
  StarEmpty,
  ChevronRightProduct,
  ChevronLeft28,
  ChevronRight28,
} from "@/components/svg";
import {
  AdditionalDetails,
  ProductVariants,
  Reviews,
  Section,
} from "@/components/product";
import { AddToCartModal } from "@/components/product/AddToCartModal";
import { ImageModal } from "@/components/product/ImageModal";
import { ReviewsDrawer } from "@/components/product/ReviewsDrawer";

import {
  useProductDetail,
  useRelatedProducts,
} from "@/lib/hooks/useProductDetail";
import { useReviewSummary } from "@/lib/hooks/useReviews";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/utils/formatters";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useUIStore } from "@/stores/ui-store";
import Link from "next/link";
import Image from "next/image";

import type { ProductWithDetails } from "@/lib/queries/products";
import { MutedTextSm, PrimaryMediumSm } from "@/components/ui/typography";

export function ProductDetailClient({
  slug,
  serverProduct,
}: {
  slug: string;
  serverProduct?: ProductWithDetails | null;
}) {
  const { data: product, isLoading, isFetching } = useProductDetail(slug, serverProduct);
  const { data: reviewSummary } = useReviewSummary(product?.id ?? "");
  const { data: relatedProducts } = useRelatedProducts(
    product?.id ?? "",
    product?.categoryPath?.[product.categoryPath.length - 1]?.id,
    product?.brand?.id,
  );
  const [quantity, setQuantity] = useState(1);

  // Compute default variant synchronously (no useEffect delay)
  // Prefer in-stock variants; fall back to first variant if all are out of stock
  const defaultVariantId = useMemo(() => {
    if (!product?.variants?.length) return undefined;
    const optionGroups = product.option_groups;
    const requiredCount =
      optionGroups?.filter((g) => g.is_required !== false).length ?? 0;

    const inStock = product.variants.filter((v) => v.stock_quantity > 0);
    const pool = inStock.length > 0 ? inStock : product.variants;

    const baseVariant =
      requiredCount > 0
        ? pool.find(
            (v) => v.option_values && v.option_values.length === requiredCount,
          )
        : undefined;
    return (
      baseVariant ||
      pool.find((v) => v.is_default) ||
      pool[0]
    )?.id;
  }, [product]);

  const [userSelectedVariantId, setUserSelectedVariantId] = useState<
    string | undefined
  >(undefined);
  const selectedVariantId = userSelectedVariantId ?? defaultVariantId;

  // Show skeleton for variants until the first client-side fetch completes.
  // This prevents displaying stale stock data that would select an out-of-stock variant.
  // useEffect (not inline ref) ensures skeleton shows on the first paint,
  // and refetchOnMount: 'always' on the query guarantees a fresh fetch happens.
  const [variantsReady, setVariantsReady] = useState(false);
  useEffect(() => {
    if (!isFetching && product?.variants?.length) {
      setVariantsReady(true);
    }
  }, [isFetching, product]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReviewsDrawerOpen, setIsReviewsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"brief" | "details" | "reviews">(
    "brief",
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [descFullHeight, setDescFullHeight] = useState(0);
  const descRef = useRef<HTMLParagraphElement>(null);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [stickyTop, setStickyTop] = useState(140);

  // Get all images in stable order: main image, then variant images (fixed order), then remaining product images
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: string[] = [];

    // 1. Main product image first
    if (product.images && product.images.length > 0) {
      images.push(product.images[0]);
    }

    // 2. All variant images in fixed order (by variant array position)
    if (product.variants) {
      for (const variant of product.variants) {
        if (variant.images) {
          images.push(...variant.images);
        }
      }
    }

    // 3. Remaining product images
    if (product.images && product.images.length > 1) {
      images.push(...product.images.slice(1));
    }

    return images;
  }, [product]);

  // Find the starting image index for a given variant
  const getVariantImageIndex = useCallback(
    (variantId: string) => {
      if (!product?.variants) return 0;
      const offset = product.images && product.images.length > 0 ? 1 : 0;
      let index = offset;
      for (const variant of product.variants) {
        if (variant.id === variantId) {
          return variant.images && variant.images.length > 0 ? index : 0;
        }
        index += variant.images?.length ?? 0;
      }
      return 0;
    },
    [product],
  );

  const handleImageScroll = useCallback(() => {
    if (!imageScrollRef.current) return;
    const scrollLeft = imageScrollRef.current.scrollLeft;
    const width = imageScrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  }, []);

  const scrollToImage = useCallback((index: number) => {
    if (!imageScrollRef.current) return;
    const width = imageScrollRef.current.clientWidth;
    imageScrollRef.current.scrollTo({
      left: index * width,
      behavior: "smooth",
    });
  }, []);

  const isScrollingRef = useRef(false);

  const scrollToSection = (tab: "brief" | "details" | "reviews") => {
    setActiveTab(tab);
    isScrollingRef.current = true;
    const ref =
      tab === "brief" ? briefRef : tab === "details" ? detailsRef : reviewsRef;
    const el = ref.current;
    if (el) {
      const tabsHeight = tabsRef.current?.offsetHeight ?? 42;
      const top =
        el.getBoundingClientRect().top + window.scrollY - 70 - tabsHeight;
      window.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  // Scroll spy: update active tab based on which section is in view
  useEffect(() => {
    const sections = [
      { ref: briefRef, tab: "brief" as const },
      { ref: detailsRef, tab: "details" as const },
      { ref: reviewsRef, tab: "reviews" as const },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sections.find((s) => s.ref.current === entry.target);
            if (match) setActiveTab(match.tab);
          }
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );

    for (const { ref } of sections) {
      if (ref.current) observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [product]);

  // Sync image index when default variant is computed (first load)
  useEffect(() => {
    if (defaultVariantId && !userSelectedVariantId) {
      setCurrentImageIndex(getVariantImageIndex(defaultVariantId));
    }
  }, [defaultVariantId, userSelectedVariantId, getVariantImageIndex]);

  // Calculate sticky top for right panel: scroll together, stick when bottom reached
  useEffect(() => {
    const el = rightPanelRef.current;
    if (!el) return;

    const calculate = () => {
      const panelHeight = el.offsetHeight;
      const viewportHeight = window.innerHeight;
      setStickyTop(Math.min(140, viewportHeight - panelHeight - 20));
    };

    calculate();

    const resizeObserver = new ResizeObserver(calculate);
    resizeObserver.observe(el);
    window.addEventListener("resize", calculate);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculate);
    };
  }, [product, selectedVariantId]);

  // Reset quantity, description state, and image index when variant changes
  const handleVariantChange = useCallback(
    (variantId: string) => {
      setUserSelectedVariantId(variantId);
      setQuantity(1);
      setDescExpanded(false);

      const targetIndex = getVariantImageIndex(variantId);
      setCurrentImageIndex(targetIndex);

      // Smooth scroll mobile carousel to the target image
      if (imageScrollRef.current) {
        const width = imageScrollRef.current.clientWidth;
        imageScrollRef.current.scrollTo({
          left: targetIndex * width,
          behavior: "smooth",
        });
      }
    },
    [getVariantImageIndex],
  );

  // Check if description overflows 2 lines
  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (descRef.current) {
        // Clone the element to measure without constraints
        const clone = descRef.current.cloneNode(true) as HTMLElement;
        const computedStyle = getComputedStyle(descRef.current);

        // Use parent's width minus button width (70px + 4px gap) for accurate measurement
        const parentWidth =
          descRef.current.parentElement?.offsetWidth ??
          descRef.current.offsetWidth;
        const measureWidth = parentWidth - 100; // 70px button + 4px gap + 4px buffer

        // Copy essential font/text styles for accurate measurement
        clone.style.cssText = `
          position: absolute;
          visibility: hidden;
          height: auto;
          max-height: none;
          overflow: visible;
          width: ${measureWidth}px;
          font-family: ${computedStyle.fontFamily};
          font-size: ${computedStyle.fontSize};
          font-weight: ${computedStyle.fontWeight};
          line-height: ${computedStyle.lineHeight};
          letter-spacing: ${computedStyle.letterSpacing};
          word-spacing: ${computedStyle.wordSpacing};
          white-space: ${computedStyle.whiteSpace};
          word-break: ${computedStyle.wordBreak};
          padding: ${computedStyle.padding};
        `;

        document.body.appendChild(clone);
        const fullHeight = clone.scrollHeight;
        document.body.removeChild(clone);

        const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
        const maxHeight = lineHeight * 2;
        setDescOverflows(fullHeight > maxHeight + 1);
        setDescFullHeight(fullHeight);
      }
    };
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [product?.description, selectedVariantId, product?.variants]);

  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const userId = useWishlistStore((s) => s.userId);
  const openLogin = useUIStore((s) => s.openLogin);
  const showTopHeader = useUIStore((s) => s.showTopHeader);
  const wishlisted = useWishlistStore(
    (s) =>
      s.isHydrated &&
      !!product &&
      s.items.some((item) => item.id === product.id),
  );

  if (isLoading) {
    return (
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col max-w-[1064px] w-full px-0 pb-0 md:pb-[200px]">
          {/* Breadcrumb - desktop only */}
          <div className="py-4 hidden md:flex items-center gap-1.5 px-4 xl:px-0">
            <div className="h-5 w-48 skeleton" />
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left */}
            <div className="flex flex-col w-full md:max-w-[696px]">
              {/* Tabs */}
              <div className="flex items-center gap-8 sm:gap-6 px-4 md:px-0 mb-[10px]">
                <div className="h-10 w-[100px] skeleton" />
                <div className="h-10 w-[130px] skeleton" />
                <div className="h-10 w-[70px] skeleton" />
              </div>

              <div className="flex flex-col gap-0 md:gap-[10px] max-w-[640px]">
                <div className="flex flex-col md:flex-row gap-0 md:gap-4">
                  {/* Thumbnails - desktop */}
                  <div className="hidden md:flex flex-col gap-2 w-[96px] shrink-0">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-[96px] h-[120px] skeleton rounded-sm" />
                    ))}
                  </div>
                  {/* Main image */}
                  <div className="w-full md:w-[528px] h-[472px] md:h-[660px] skeleton md:rounded-sm" />
                </div>

                {/* Mobile thumbnails */}
                <div className="md:hidden flex gap-2 pl-[18px] pt-3 pb-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[46px] h-[46px] skeleton rounded-[9px] shrink-0" />
                  ))}
                </div>
              </div>

              {/* Mobile: Product Info */}
              <div className="md:hidden flex flex-col gap-1 w-full px-4 pb-6">
                <div className="py-2">
                  <div className="w-full h-px bg-[#E2E8F0]" />
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[34px] h-[34px] rounded-full skeleton" />
                        <div className="h-5 w-24 skeleton" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="h-7 w-full skeleton" />
                        <div className="h-7 w-2/3 skeleton" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-4 h-4 skeleton rounded-sm" />
                          ))}
                        </div>
                        <div className="h-4 w-6 skeleton" />
                        <div className="h-4 w-16 skeleton" />
                      </div>
                    </div>
                    <div className="flex items-end gap-1">
                      <div className="h-8 w-12 skeleton" />
                      <div className="h-8 w-28 skeleton" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-5 w-full skeleton" />
                      <div className="h-5 w-3/4 skeleton" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="h-5 w-20 skeleton" />
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 w-20 skeleton rounded-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />
            </div>

            {/* Right - desktop only */}
            <div className="hidden md:flex flex-col gap-5 w-full md:max-w-[368px]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-[14px]">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full skeleton" />
                      <div className="h-5 w-24 skeleton" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="h-7 w-full skeleton" />
                      <div className="h-7 w-2/3 skeleton" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 skeleton rounded-sm" />
                        ))}
                      </div>
                      <div className="h-4 w-6 skeleton" />
                      <div className="h-4 w-16 skeleton" />
                    </div>
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="h-8 w-12 skeleton" />
                    <div className="h-8 w-28 skeleton" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-full skeleton" />
                    <div className="h-5 w-3/4 skeleton" />
                  </div>
                </div>
                <div className="py-2">
                  <div className="w-full h-px bg-[#E2E8F0]" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="h-5 w-20 skeleton" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 w-20 skeleton rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex justify-end items-end gap-3 px-0.5">
                  <div className="h-5 w-32 skeleton" />
                  <div className="h-6 w-24 skeleton" />
                </div>
                <div className="flex gap-3 md:pl-2 items-center">
                  <div className="w-11 h-11 skeleton rounded-sm" />
                  <div className="flex-1 h-11 skeleton rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom bar */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-4 py-3"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-3 items-center">
            <div className="w-14 h-14 skeleton rounded-sm" />
            <div className="flex-1 h-14 skeleton rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full bg-white flex justify-center">
        <div className="flex flex-col items-center justify-center max-w-[1064px] w-full py-20">
          <MutedTextSm>
            Бүтээгдэхүүн олдсонгүй
          </MutedTextSm>
        </div>
      </div>
    );
  }

  // Get selected variant data
  const selectedVariant = product.variants?.find(
    (v) => v.id === selectedVariantId,
  );
  const hasVariants = product.variants && product.variants.length > 0;

  // If product has variants, use selected variant's data only (no fallback to other variants)
  const activeVariant = selectedVariant ?? product.variants?.[0];
  const currentPrice = hasVariants
    ? (activeVariant?.price ?? product.price)
    : product.price;
  const currentDiscountPrice = hasVariants
    ? (activeVariant?.discount_price ?? null)
    : product.discount_price;
  const currentStock = hasVariants
    ? (activeVariant?.stock_quantity ?? 0)
    : product.stock_quantity;

  const hasDiscount =
    currentDiscountPrice != null && currentDiscountPrice < currentPrice;
  const discount = hasDiscount
    ? Math.round(((currentPrice - currentDiscountPrice!) / currentPrice) * 100)
    : null;

  const sellingPrice = hasDiscount ? currentDiscountPrice! : currentPrice;
  const variantsLoading = !!(hasVariants && !variantsReady);
  const cartDisabled = currentStock <= 0 || variantsLoading;

  const handleAddToCart = () => {
    if (cartDisabled) return;
    setIsModalOpen(true);
  };

  const handleToggleWishlist = () => {
    if (!userId) {
      openLogin();
      return;
    }
    toggleWishlist(product);
  };

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-0 pb-0 md:pb-[200px]">
        {/* Breadcrumb */}
        <div className="py-4 hidden md:flex items-center gap-1.5 flex-wrap">
          <Link
            href="/products"
            prefetch={true}
            className="cursor-pointer text-[#64748B] font-normal text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
          >
            Категори
          </Link>
          {product.categoryPath?.map((cat, index) => {
            const isLast = index === (product.categoryPath?.length ?? 0) - 1;
            return (
              <span key={cat.id} className="flex items-center gap-1.5">
                <Slash />
                <Link
                  href={`/products?category=${cat.slug}`}
                  prefetch={true}
                  className={`cursor-pointer font-normal text-sm font-manrope transition-colors duration-200 ${isLast ? "text-[#020617]" : "text-[#64748B] hover:text-[#020617]"}`}
                >
                  {cat.name}
                </Link>
              </span>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left: Images */}
          <div className="flex flex-col w-full md:max-w-[696px]">
            {/* Sticky tabs */}
            <div
              ref={tabsRef}
              className={`sticky z-40 bg-white mb-[10px] transition-[top] duration-300 ${showTopHeader ? "top-[93px] md:top-[131px]" : "top-[50px] md:top-[61px]"}`}
            >
              <div className="flex items-center gap-8 sm:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-0 max-w-[640px]">
                <button
                  className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "brief" ? "border-[#020617] text-[#020617]" : "border-transparent text-[#64748B] hover:text-[#020617]"}`}
                  onClick={() => scrollToSection("brief")}
                >
                  Товч мэдээлэл
                </button>
                <button
                  className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "details" ? "border-[#020617] text-[#020617]" : "border-transparent text-[#64748B] hover:text-[#020617]"}`}
                  onClick={() => scrollToSection("details")}
                >
                  Дэлгэрэнгүй тайлбар
                </button>
                <button
                  className={`py-2.5 border-b-2 font-medium text-sm font-manrope transition-colors duration-200 cursor-pointer whitespace-nowrap ${activeTab === "reviews" ? "border-[#020617] text-[#020617]" : "border-transparent text-[#64748B] hover:text-[#020617]"}`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsReviewsDrawerOpen(true);
                    } else {
                      scrollToSection("reviews");
                    }
                  }}
                >
                  Сэтгэгдэл
                  {reviewSummary?.totalCount
                    ? ` (${reviewSummary.totalCount})`
                    : ""}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-0 md:gap-[10px] max-w-[640px]">
              <div
                ref={briefRef}
                className="flex flex-col md:flex-row gap-0 md:gap-4"
              >
                {/* Thumbnail images - left side (desktop only) */}
                {allImages.length > 1 && (
                  <div className="hidden md:flex flex-col gap-2 w-[96px] shrink-0 max-h-[660px] overflow-y-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-[96px] h-[120px] shrink-0 rounded-sm overflow-hidden border cursor-pointer transition-all ${
                          index === currentImageIndex
                            ? "border-[#020617]"
                            : "border-transparent hover:border-[#E2E8F0]"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          width={96}
                          height={120}
                          quality={75}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main image */}
                <div
                  className={`group w-full ${allImages.length === 1 ? "md:w-full" : "md:w-[528px]"} md:h-[660px] bg-white rounded-none md:rounded-sm relative overflow-hidden`}
                >
                  {allImages.length > 0 ? (
                    <>
                      {/* Desktop: Show selected image with smooth slide animation */}
                      <div
                        className={`hidden md:flex cursor-pointer h-[660px] transition-transform duration-300 ease-in-out ${allImages.length === 1 ? "w-full" : ""}`}
                        style={
                          allImages.length === 1
                            ? undefined
                            : {
                                width: `${528 * allImages.length}px`,
                                transform: `translateX(-${currentImageIndex * 528}px)`,
                              }
                        }
                        onClick={() => setIsImageModalOpen(true)}
                      >
                        {allImages.map((image, index) => (
                          <div
                            key={index}
                            className={`${allImages.length === 1 ? "w-full" : "w-[528px]"} h-[660px] shrink-0`}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} - ${index + 1}`}
                              width={allImages.length === 1 ? 640 : 528}
                              height={660}
                              quality={75}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Mobile: Horizontal scroll carousel */}
                      <div
                        ref={imageScrollRef}
                        onScroll={handleImageScroll}
                        className="flex md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full h-[472px]"
                      >
                        {allImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative shrink-0 w-full h-[472px] snap-center cursor-pointer"
                            onClick={() => {
                              setCurrentImageIndex(index);
                              setIsImageModalOpen(true);
                            }}
                          >
                            <Image
                              src={image}
                              alt={`${product.name} - ${index + 1}`}
                              fill
                              sizes="100vw"
                              quality={75}
                              className="w-full h-full object-contain object-center"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Image counter - mobile only */}
                      {allImages.length > 1 && (
                        <div className="md:hidden absolute top-4 right-4 bg-[rgba(2,6,23,0.40)] text-white text-sm font-medium font-manrope px-1.5 py-0.5 rounded-full">
                          {currentImageIndex + 1}/{allImages.length}
                        </div>
                      )}

                      {/* Desktop image counter */}
                      {allImages.length > 1 && (
                        <div className="hidden md:block absolute top-4 right-4 bg-[rgba(2,6,23,0.40)] text-white text-sm font-medium font-manrope px-1.5 py-0.5 rounded-full">
                          {currentImageIndex + 1}/{allImages.length}
                        </div>
                      )}

                      {/* Desktop navigation arrows */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === 0 ? allImages.length - 1 : prev - 1,
                              );
                            }}
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
                          >
                            <ChevronLeft28 />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === allImages.length - 1 ? 0 : prev + 1,
                              );
                            }}
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-[rgba(255,255,255,0.80)] border-2 border-[rgba(255,255,255,0.10)] rounded-full backdrop-blur-[50px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[#F8FAFC]"
                          >
                            <ChevronRight28 />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#94A3B8]">
                      Product Image
                    </div>
                  )}
                </div>

                {/* Mobile: Thumbnail row */}
                {allImages.length > 1 && (
                  <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pl-[18px] pt-3 pb-1.5 md:px-4 md:py-3">
                    {allImages.map((image, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <button
                          onClick={() => {
                            setCurrentImageIndex(index);
                            scrollToImage(index);
                          }}
                          className={`w-[46px] md:w-[72px] h-[46px] md:h-[72px] p-0.5 md:p-0 shrink-0 rounded-[9px] md:rounded-sm overflow-hidden border md:border-2 cursor-pointer transition-all ${
                            index === currentImageIndex
                              ? "border-[#020617]"
                              : "border-transparent"
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${product.name} - ${index + 1}`}
                            width={48}
                            height={48}
                            quality={75}
                            className="w-full h-full object-cover rounded-[6px] md:rounded-sm"
                          />
                        </button>
                        {index === 0 && (
                          <div className="w-px h-[38px] bg-[#E2E8F0] shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Product Info - shown below images */}
            <div className="md:hidden flex flex-col gap-1 w-full px-4 pb-6">
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 md:gap-2.5">
                    <div className="flex flex-col gap-1 pb-1">
                      {product.brand && (
                        <Link
                          href={`/brands/${product.brand.slug}`}
                          className="flex items-center gap-2.5 group transition-all duration-200 w-fit"
                        >
                          <div className="w-[34px] h-[34px] flex items-center justify-center border border-[#F1F5F9] rounded-full bg-[#F8FAFC] overflow-hidden">
                            {product.brand.logo_url && (
                              <Image
                                src={product.brand.logo_url}
                                alt={product.brand.name}
                                width={30}
                                height={30}
                                quality={75}
                                className="object-contain"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[#020617] font-medium text-base font-manrope group-hover:text-[#020617]/80 duration-200">
                              {product.brand.name}
                            </p>
                            <ChevronRightProduct />
                          </div>
                        </Link>
                      )}
                      <p className="text-[#020617] font-medium text-lg font-manrope leading-7 transition-all duration-300">
                        {product.name}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsReviewsDrawerOpen(true)}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) =>
                          i < Math.round(reviewSummary?.averageRating ?? 0) ? (
                            <Star key={i} />
                          ) : (
                            <StarEmpty key={i} />
                          ),
                        )}
                      </div>
                      <PrimaryMediumSm>
                        {reviewSummary?.averageRating ?? 0}
                      </PrimaryMediumSm>
                      <p className="text-[#64748B] font-normal text-xs font-manrope underline underline-offset-2">
                        {reviewSummary?.totalCount ?? 0} Сэтгэгдэл
                      </p>
                    </button>
                  </div>

                  <div className="flex items-end gap-1 transition-all duration-300">
                    {discount && (
                      <span className="text-[#F43F5E] font-semibold text-2xl font-manrope transition-all duration-300">
                        {discount}%
                      </span>
                    )}
                    <p className="text-[#020617] font-semibold text-2xl font-manrope tracking-[-1.44px] transition-all duration-300">
                      {formatPrice(sellingPrice)}
                    </p>
                    {discount && (
                      <p className="text-[#64748B] font-normal text-base font-manrope pb-[3px] line-through transition-all duration-300">
                        {formatPrice(currentPrice)}
                      </p>
                    )}
                  </div>

                  {product.description && (
                    <div>
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: descExpanded
                            ? `${descFullHeight + 192}px`
                            : "48px",
                        }}
                      >
                        <p
                          ref={descRef}
                          className="text-[#64748B] font-normal text-base font-manrope leading-6 transition-all duration-300"
                        >
                          {product.description}
                        </p>
                      </div>
                      {descOverflows && (
                        <button
                          onClick={() => setDescExpanded((prev) => !prev)}
                          className="flex items-center gap-0.5 cursor-pointer mt-1 ml-auto"
                        >
                          <span className="text-[#64748B] font-medium text-sm font-manrope">
                            {descExpanded ? "Хураах" : "Цааш"}
                          </span>
                          <div
                            className="transition-transform duration-300 ease-in-out"
                            style={{
                              transform: descExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          >
                            <ChevronDownCategory />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <ProductVariants
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  maxQuantity={currentStock}
                  variants={product.variants}
                  selectedVariantId={selectedVariantId}
                  onVariantChange={handleVariantChange}
                  productName={product.name}
                  productImage={product.images?.[0]}
                  optionGroups={product.option_groups}
                  loading={variantsLoading}
                />
              </div>
            </div>

            <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />

            <div ref={detailsRef} className="flex flex-col">
              <AdditionalDetails
                productName={product.name}
                details={product.product_details}
                richDescription={product.rich_description}
                middleSlot={
                  relatedProducts && relatedProducts.length > 0 ? (
                    <div className="hidden md:block w-full max-w-[640px]">
                      <Section
                        title="Төстэй бүтээгдэхүүн"
                        href={`/products?category=${product.categoryPath?.[product.categoryPath.length - 1]?.slug ?? ""}`}
                        products={relatedProducts as Product[]}
                      />
                    </div>
                  ) : undefined
                }
              />
            </div>

            <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />

            <div
              ref={reviewsRef}
              className="flex flex-col max-w-[640px] w-full px-4 md:px-0 pt-4 md:pt-0 pb-8 md:pb-0"
            >
              <Reviews
                productId={product.id}
                productName={product.name}
                productDescription={product.description}
                productImage={product.images?.[0]}
                onMobileTitleClick={() => setIsReviewsDrawerOpen(true)}
              />
            </div>

            <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />

            {/* Mobile: Related Products - at the very bottom */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div className="md:hidden w-full max-w-[640px]">
                <Section
                  title="Төстэй бүтээгдэхүүн"
                  href={`/products?category=${product.categoryPath?.[product.categoryPath.length - 1]?.slug ?? ""}`}
                  products={relatedProducts as Product[]}
                />
              </div>
            )}

            <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />
          </div>

          {/* Right: Info - Desktop only */}
          <div
            ref={rightPanelRef}
            className="hidden md:flex flex-col gap-5 w-full md:max-w-[368px] md:sticky md:self-start"
            style={{ top: `${stickyTop}px` }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-2 pb-1">
                    {product.brand && (
                      <Link
                        href={`/brands/${product.brand.slug}`}
                        className="flex items-center gap-2.5 group transition-all duration-200 w-fit"
                      >
                        <div className="w-[34px] h-[34px] flex items-center justify-center border border-[#F1F5F9] rounded-full bg-[#F8FAFC] overflow-hidden">
                          {product.brand.logo_url && (
                            <Image
                              src={product.brand.logo_url}
                              alt={product.brand.name}
                              width={30}
                              height={30}
                              quality={75}
                              className="object-contain"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[#020617] font-medium text-base font-manrope group-hover:text-[#020617]/80 duration-200">
                            {product.brand.name}
                          </p>
                          <ChevronRightProduct />
                        </div>
                      </Link>
                    )}
                    <p className="text-[#020617] font-semibold text-xl font-manrope leading-7 transition-all duration-300">
                      {product.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) =>
                        i < Math.round(reviewSummary?.averageRating ?? 0) ? (
                          <Star key={i} />
                        ) : (
                          <StarEmpty key={i} />
                        ),
                      )}
                    </div>
                    <p
                      onClick={() => scrollToSection("reviews")}
                      className="text-[#020617] font-medium text-sm font-manrope cursor-pointer"
                    >
                      {reviewSummary?.averageRating ?? 0}
                    </p>
                    <p
                      onClick={() => scrollToSection("reviews")}
                      className="text-[#64748B] font-normal text-xs font-manrope underline underline-offset-2 cursor-pointer"
                    >
                      {reviewSummary?.totalCount ?? 0} Сэтгэгдэл
                    </p>
                  </div>
                </div>

                <div className="flex items-end gap-1 transition-all duration-300">
                  {discount && (
                    <span className="text-[#F43F5E] font-semibold text-2xl font-manrope transition-all duration-300">
                      {discount}%
                    </span>
                  )}
                  <p className="text-[#020617] font-semibold text-2xl font-manrope tracking-[-1.44px] transition-all duration-300">
                    {formatPrice(sellingPrice)}
                  </p>
                  {discount && (
                    <p className="text-[#64748B] font-normal text-base font-manrope pb-[3px] line-through transition-all duration-300">
                      {formatPrice(currentPrice)}
                    </p>
                  )}
                </div>

                {product.description && (
                  <div className="flex items-end gap-1">
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: descExpanded
                          ? `${descFullHeight}px`
                          : "48px",
                      }}
                    >
                      <p
                        ref={descRef}
                        className="text-[#64748B] font-normal text-base font-manrope leading-6 transition-all duration-300"
                      >
                        {product.description}
                      </p>
                    </div>
                    {descOverflows && (
                      <button
                        onClick={() => setDescExpanded((prev) => !prev)}
                        className="flex items-center gap-0.5 cursor-pointer self-end"
                      >
                        <span className="text-[#64748B] w-[70px] font-medium text-sm font-manrope">
                          {descExpanded ? "Хураах" : "Цааш"}
                        </span>
                        <div
                          className="transition-transform duration-300 ease-in-out"
                          style={{
                            transform: descExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          <ChevronDownCategory />
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>

              <ProductVariants
                quantity={quantity}
                onQuantityChange={setQuantity}
                maxQuantity={currentStock}
                variants={product.variants}
                selectedVariantId={selectedVariantId}
                onVariantChange={handleVariantChange}
                productName={product.name}
                productImage={product.images?.[0]}
                optionGroups={product.option_groups}
                loading={variantsLoading}
              />
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Total Block */}
            <div className="fixed bottom-0 left-0 right-0 z-30 md:static flex flex-col gap-3 md:gap-5">
              <div className="hidden md:flex justify-end items-end gap-3 px-0.5">
                <PrimaryMediumSm>
                  Сонгосон хувилбарын үнэ:
                </PrimaryMediumSm>
                <p className="text-[#020617] font-semibold text-xl font-manrope tracking-[-1.2px] leading-6 transition-all duration-300">
                  {formatPrice(sellingPrice * quantity)}
                </p>
              </div>
              <div className="flex gap-3 md:pl-2 items-center px-4 py-3 md:px-0 md:py-0 bg-white">
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-sm cursor-pointer shrink-0"
                  onClick={handleToggleWishlist}
                >
                  <Heart filled={wishlisted} />
                </button>
                <button
                  className={`flex-1 px-3 py-2.5 rounded-sm text-white font-normal text-base transition-colors flex items-center justify-center gap-0.5 ${!cartDisabled ? "bg-[#020617] hover:bg-[#1e293b] cursor-pointer" : "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"}`}
                  onClick={handleAddToCart}
                  disabled={cartDisabled}
                >
                  <ShoppingCartProduct />
                  <span className="px-0.5">
                    {currentStock <= 0 ? "Дууссан" : "Сагслах"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed bottom bar for add to cart */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-4 py-3"
        style={{
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <div className="flex gap-3 items-center">
          <button
            className="w-14 h-14 flex items-center justify-center rounded-sm cursor-pointer shrink-0"
            onClick={handleToggleWishlist}
          >
            <Heart filled={wishlisted} />
          </button>
          <button
            className={`flex-1 px-3 py-3.5 rounded-sm text-white font-normal text-lg transition-colors flex items-center justify-center gap-0.5 ${!cartDisabled ? "bg-[#020617] hover:bg-[#1e293b] cursor-pointer" : "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"}`}
            onClick={handleAddToCart}
            disabled={cartDisabled}
          >
            <ShoppingCartProduct />
            <span className="px-0.5">
              {currentStock <= 0 ? "Дууссан" : "Сагслах"}
            </span>
          </button>
        </div>
      </div>

      <AddToCartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        quantity={quantity}
        variant={selectedVariant}
      />

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={allImages}
        currentIndex={currentImageIndex}
        onIndexChange={setCurrentImageIndex}
        productName={product.name}
      />

      <ReviewsDrawer
        isOpen={isReviewsDrawerOpen}
        onClose={() => setIsReviewsDrawerOpen(false)}
        productId={product.id}
        productName={product.name}
        productDescription={product.description}
        productImage={product.images?.[0]}
      />
    </div>
  );
}
