"use client";

import Image from "next/image";

import { Cancel, ChevronRightProduct, StarEmpty } from "@/components/svg";
import { parseAsUTC } from "@/lib/utils/formatters";

import type { OrderItem } from "./_useReviewPromptState";

function formatDate(dateStr: string): string {
  return parseAsUTC(dateStr)
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, ".");
}

function ImagePlaceholder() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 3H3C1.89543 3 1 3.89543 1 5V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V5C23 3.89543 22.1046 3 21 3Z"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 15L17 9L3 21"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProductImageProps {
  src: string | undefined;
  alt: string;
  sizes: string;
}

function ProductImage({ src, alt, sizes }: ProductImageProps) {
  if (src) {
    return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} quality={90} />;
  }
  return (
    <div className="w-full h-full bg-border flex items-center justify-center">
      <ImagePlaceholder />
    </div>
  );
}

interface ReviewPromptImagesProps {
  items: OrderItem[];
}

function resolveItemImage(item: OrderItem | undefined): { src: string | undefined; alt: string } {
  return {
    src: item?.products?.images?.[0],
    alt: item?.products?.name ?? "Бүтээгдэхүүн",
  };
}

function ReviewPromptImages({ items }: ReviewPromptImagesProps) {
  const first = resolveItemImage(items[0]);
  const second = resolveItemImage(items[1]);
  const isSingle = items.length === 1;

  if (isSingle) {
    return (
      <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-[4px] border border-border-light bg-surface overflow-hidden relative">
        <ProductImage src={first.src} alt={first.alt} sizes="100px" />
      </div>
    );
  }

  return (
    <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px]">
      {/* Back image (rotated) */}
      <div className="absolute top-0 left-2 md:left-3 w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-[4px] border border-border-light bg-surface overflow-hidden rotate-6 shadow-sm">
        <ProductImage src={second.src} alt={second.alt} sizes="96px" />
      </div>
      {/* Front image */}
      <div className="absolute top-2 md:top-3 left-0 w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-[4px] border border-border-light bg-surface overflow-hidden -rotate-3 shadow-sm">
        <ProductImage src={first.src} alt={first.alt} sizes="96px" />
      </div>
    </div>
  );
}

interface ReviewPromptCardProps {
  allItems: OrderItem[];
  reviewableCount: number;
  orderCreatedAt: string;
  onDismiss: () => void;
  onCardClick: () => void;
}

export function ReviewPromptCard({
  allItems,
  reviewableCount,
  orderCreatedAt,
  onDismiss,
  onCardClick,
}: ReviewPromptCardProps) {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="max-w-[1064px] w-full px-4 flex justify-center xl:px-0 py-3 md:py-6">
        <div
          className="relative flex items-center gap-4 md:gap-6 cursor-pointer"
          onClick={onCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCardClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Үнэлгээ өгөх"
        >
          {/* X dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="shrink-0 p-1 cursor-pointer hover:bg-surface rounded transition-colors"
            aria-label="Dismiss"
          >
            <Cancel />
          </button>

          {/* Product images */}
          <div className="shrink-0 flex flex-col gap-1 items-center justify-center">
            <ReviewPromptImages items={allItems} />

            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <StarEmpty key={i} />
              ))}
            </div>
          </div>

          {/* Text content */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col">
              <p className="text-text-primary font-normal text-sm md:text-base font-manrope">
                <span className="font-medium">{formatDate(orderCreatedAt)}</span>
                -ийн хүргэлт
              </p>
              <p className="text-text-primary font-normal text-sm md:text-base font-manrope">
                <span className="font-medium">{reviewableCount}</span>ш бүтээгдэхүүнд үнэлгээ өгөх
              </p>
            </div>
            <div className="shrink-0">
              <ChevronRightProduct />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
