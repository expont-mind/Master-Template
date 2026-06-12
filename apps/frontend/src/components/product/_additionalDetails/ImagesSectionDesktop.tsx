"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { ExpandToggleButton } from "./ExpandToggleButton";

interface ImagesSectionDesktopProps {
  images: string[];
}

/**
 * Desktop rich-description images. Collapsed height adapts to the
 * height of the first image (≥1200px) so we don't crop in awkward
 * places on tall product images.
 */
export function ImagesSectionDesktop({ images }: ImagesSectionDesktopProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [firstImageHeight, setFirstImageHeight] = useState<number | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleFirstImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (firstImageHeight === null) {
        setFirstImageHeight(e.currentTarget.offsetHeight);
      }
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    },
    [firstImageHeight],
  );

  const handleImageLoad = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  const collapsedHeight = firstImageHeight ? Math.max(firstImageHeight * 1.5, 1200) : 1200;
  const showExpandButton = isExpanded || contentHeight > collapsedHeight;

  return (
    <div className="hidden md:flex flex-col gap-4 pt-12 max-w-[640px] w-full">
      <p className="text-text-primary font-semibold text-xl font-manrope py-1">Зурган тайлбар</p>
      <div
        className="relative overflow-hidden rounded-sm transition-[max-height] duration-500 ease-in-out"
        style={{
          maxHeight: isExpanded ? contentHeight + 100 : collapsedHeight,
        }}
      >
        <div ref={contentRef} className="flex flex-col">
          {images.map((imageUrl, index) => (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={`Product detail ${index + 1}`}
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto"
              unoptimized
              onLoad={index === 0 ? handleFirstImageLoad : handleImageLoad}
            />
          ))}
        </div>
        {!isExpanded && showExpandButton && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {showExpandButton && (
        <div className="pb-5 w-full">
          <ExpandToggleButton
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            desktop
          />
        </div>
      )}
    </div>
  );
}
