"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronDownBig } from "../svg";

interface ProductDetail {
  id: string;
  type: string;
  content: string;
  sort_order: number;
}

interface RichDescription {
  content: string | null;
  images: string[];
}

interface AdditionalDetailsProps {
  productName?: string;
  details?: ProductDetail[];
  richDescription?: RichDescription;
  middleSlot?: React.ReactNode;
}

const SPECS_COLLAPSED_HEIGHT = 400;
const IMAGES_COLLAPSED_HEIGHT = 800;

export const AdditionalDetails = ({
  productName,
  details,
  richDescription,
  middleSlot,
}: AdditionalDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
  const [isImagesExpanded, setIsImagesExpanded] = useState(false);
  const [imagesExpandedFinal, setImagesExpandedFinal] = useState(false);
  const [firstImageHeight, setFirstImageHeight] = useState<number | null>(null);
  const [specsContentHeight, setSpecsContentHeight] = useState<number>(0);
  const [imagesContentHeight, setImagesContentHeight] = useState<number>(0);
  const [desktopContentHeight, setDesktopContentHeight] = useState<number>(0);
  const [isDesktopSpecsExpanded, setIsDesktopSpecsExpanded] = useState(false);
  const [desktopSpecsHeight, setDesktopSpecsHeight] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const specsContentRef = useRef<HTMLDivElement>(null);
  const desktopSpecsRef = useRef<HTMLDivElement>(null);
  const imagesContentRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Measure specs content height
  useEffect(() => {
    if (specsContentRef.current) {
      setSpecsContentHeight(specsContentRef.current.scrollHeight);
    }
    if (desktopSpecsRef.current) {
      setDesktopSpecsHeight(desktopSpecsRef.current.scrollHeight);
    }
  }, [details, productName]);

  // Measure images content height
  useEffect(() => {
    const measureImagesHeight = () => {
      if (imagesContentRef.current) {
        setImagesContentHeight(imagesContentRef.current.scrollHeight);
      }
    };
    // Delay to allow images to load
    const timer = setTimeout(measureImagesHeight, 500);
    return () => clearTimeout(timer);
  }, [richDescription]);

  const handleFirstImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (firstImageHeight === null) {
        setFirstImageHeight(e.currentTarget.offsetHeight);
      }
      // Re-measure images container height after first image loads
      if (imagesContentRef.current) {
        setImagesContentHeight(imagesContentRef.current.scrollHeight);
      }
      if (contentRef.current) {
        setDesktopContentHeight(contentRef.current.scrollHeight);
      }
    },
    [firstImageHeight],
  );

  // Re-measure images container height on every image load
  const handleImageLoad = useCallback(() => {
    if (imagesContentRef.current) {
      setImagesContentHeight(imagesContentRef.current.scrollHeight);
    }
    if (contentRef.current) {
      setDesktopContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  // Toggle images expansion with proper animation and iOS reliability
  const handleToggleImages = useCallback(() => {
    if (isImagesExpanded) {
      // Collapsing: measure current height, apply overflow-hidden, then animate down
      if (imagesContentRef.current) {
        setImagesContentHeight(imagesContentRef.current.scrollHeight);
      }
      setImagesExpandedFinal(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsImagesExpanded(false);
        });
      });
    } else {
      // Expanding: animate to measured height, then remove constraints for iOS
      if (imagesContentRef.current) {
        setImagesContentHeight(imagesContentRef.current.scrollHeight);
      }
      setIsImagesExpanded(true);
      setTimeout(() => {
        setImagesExpandedFinal(true);
      }, 550);
    }
  }, [isImagesExpanded]);

  // Build specs array from product data
  const specs: { label: string; value: string }[] = [];

  if (productName) {
    specs.push({ label: "Нэр", value: productName });
  }

  if (details && details.length > 0) {
    for (const detail of details) {
      specs.push({ label: detail.type, value: detail.content });
    }
  }

  const hasRichImages =
    richDescription?.images && richDescription.images.length > 0;

  if (specs.length === 0 && !hasRichImages) {
    return null;
  }

  const showSpecsExpandButton =
    isMobile &&
    (isSpecsExpanded || specsContentHeight > SPECS_COLLAPSED_HEIGHT);
  const showImagesExpandButton =
    isMobile &&
    (isImagesExpanded || imagesContentHeight > IMAGES_COLLAPSED_HEIGHT);

  return (
    <div className="flex flex-col">
      {/* Mobile: Specs section */}
      {specs.length > 0 && (
        <div className="md:hidden">
          <div
            className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
            style={{
              maxHeight: isSpecsExpanded
                ? specsContentHeight + 100
                : SPECS_COLLAPSED_HEIGHT,
            }}
          >
            <div
              ref={specsContentRef}
              className="p-4 flex flex-col gap-3 max-w-[640px] w-full"
            >
              <p className="text-[#020617] font-medium text-lg font-manrope py-1">
                Дэлгэрэнгүй тайлбар
              </p>

              <div className="border-t border-[#E2E8F0]">
                {specs.map((spec, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] items-center border-b border-[#E2E8F0] min-h-[56px]"
                  >
                    <p className="p-2 border-r h-full flex items-center border-[#E2E8F0] bg-[#F8FAFC] text-[#020617] text-sm font-normal font-manrope">
                      {spec.label}
                    </p>
                    <p className="p-2 text-[#020617] text-sm font-normal font-manrope leading-5">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient overlay when collapsed */}
            {!isSpecsExpanded && showSpecsExpandButton && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand/Collapse button for specs */}
          {showSpecsExpandButton && (
            <div className="px-4 pb-5 w-full">
              <button
                onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
                className="px-3 py-2.5 w-full border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
              >
                <span className="px-0.5 text-[#020617] font-normal text-base font-manrope">
                  {isSpecsExpanded ? "Хураах" : "Цааш нь үзэх"}
                </span>
                <span
                  className={`transition-transform duration-300 ${isSpecsExpanded ? "rotate-180" : ""}`}
                >
                  <ChevronDownBig />
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Desktop: Specs section */}
      {specs.length > 0 &&
        (() => {
          const desktopSpecsCollapsedHeight = SPECS_COLLAPSED_HEIGHT;
          const showDesktopSpecsButton =
            isDesktopSpecsExpanded ||
            desktopSpecsHeight > desktopSpecsCollapsedHeight;

          return (
            <div className="hidden md:flex flex-col">
              <div className="md:pt-10 flex flex-col gap-4 max-w-[640px] w-full">
                <p className="text-[#020617] font-semibold text-xl font-manrope py-1">
                  Дэлгэрэнгүй тайлбар
                </p>

                <div
                  className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
                  style={{
                    maxHeight: isDesktopSpecsExpanded
                      ? desktopSpecsHeight + 100
                      : desktopSpecsCollapsedHeight,
                  }}
                >
                  <div
                    ref={desktopSpecsRef}
                    className="border-t border-[#E2E8F0]"
                  >
                    {specs.map((spec, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[120px_1fr] items-center border-b border-[#E2E8F0] min-h-[56px]"
                      >
                        <p className="p-2 border-r h-full flex items-center border-[#E2E8F0] bg-[#F8FAFC] text-[#020617] text-sm font-normal font-manrope">
                          {spec.label}
                        </p>
                        <p className="p-2 text-[#020617] text-sm font-normal font-manrope leading-5">
                          {spec.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {!isDesktopSpecsExpanded && showDesktopSpecsButton && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>

                {showDesktopSpecsButton && (
                  <div className="pb-5 w-full">
                    <button
                      onClick={() =>
                        setIsDesktopSpecsExpanded(!isDesktopSpecsExpanded)
                      }
                      className="px-3 py-3.5 w-full border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
                    >
                      <span className="px-0.5 text-[#020617] font-normal text-lg font-manrope">
                        {isDesktopSpecsExpanded ? "Хураах" : "Цааш нь үзэх"}
                      </span>
                      <span
                        className={`transition-transform duration-300 ${isDesktopSpecsExpanded ? "rotate-180" : ""}`}
                      >
                        <ChevronDownBig />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />

      {middleSlot}

      {/* Mobile: Images section */}
      {hasRichImages && (
        <div className="md:hidden">
          <div
            className={`relative transition-[max-height] duration-500 ease-in-out ${imagesExpandedFinal ? "" : "overflow-hidden"}`}
            style={{
              maxHeight: imagesExpandedFinal
                ? undefined
                : isImagesExpanded
                  ? imagesContentHeight + 500
                  : IMAGES_COLLAPSED_HEIGHT,
              WebkitTransform: "translateZ(0)",
            }}
          >
            <div
              ref={imagesContentRef}
              className="flex flex-col gap-4 max-w-[640px] w-full"
            >
              <div className="flex flex-col">
                {richDescription.images.map((imageUrl, index) => (
                  <Image
                    key={index}
                    src={imageUrl}
                    alt={`Product detail ${index + 1}`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                    unoptimized
                    onLoad={
                      index === 0 ? handleFirstImageLoad : handleImageLoad
                    }
                  />
                ))}
              </div>
            </div>

            {/* Gradient overlay when collapsed */}
            {!isImagesExpanded && showImagesExpandButton && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand/Collapse button for images */}
          {showImagesExpandButton && (
            <div className="px-4 pb-5 pt-4 w-full">
              <button
                onClick={handleToggleImages}
                className="px-3 py-2.5 w-full border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
              >
                <span className="px-0.5 text-[#020617] font-normal text-base font-manrope">
                  {isImagesExpanded ? "Хураах" : "Цааш нь үзэх"}
                </span>
                <span
                  className={`transition-transform duration-300 ${isImagesExpanded ? "rotate-180" : ""}`}
                >
                  <ChevronDownBig />
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Desktop: Images section */}
      {hasRichImages &&
        (() => {
          const desktopCollapsedHeight = firstImageHeight
            ? Math.max(firstImageHeight * 1.5, 1200)
            : 1200;
          const showDesktopExpandButton =
            isExpanded || desktopContentHeight > desktopCollapsedHeight;

          return (
            <div className="hidden md:flex flex-col gap-4 pt-12 max-w-[640px] w-full">
              <p className="text-[#020617] font-semibold text-xl font-manrope py-1">
                Зурган тайлбар
              </p>
              <div
                className="relative overflow-hidden rounded-sm transition-[max-height] duration-500 ease-in-out"
                style={{
                  maxHeight: isExpanded
                    ? desktopContentHeight + 100
                    : desktopCollapsedHeight,
                }}
              >
                <div ref={contentRef} className="flex flex-col">
                  {richDescription.images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      src={imageUrl}
                      alt={`Product detail ${index + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto"
                      unoptimized
                      onLoad={
                        index === 0 ? handleFirstImageLoad : handleImageLoad
                      }
                    />
                  ))}
                </div>
                {!isExpanded && showDesktopExpandButton && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>

              {showDesktopExpandButton && (
                <div className="pb-5 w-full">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-3.5 w-full border border-[#E2E8F0] rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface"
                  >
                    <span className="px-0.5 text-[#020617] font-normal text-lg font-manrope">
                      {isExpanded ? "Хураах" : "Цааш нь үзэх"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <ChevronDownBig />
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};
