"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ExpandToggleButton } from "./ExpandToggleButton";

const COLLAPSED_HEIGHT = 800;

interface ImagesSectionMobileProps {
  images: string[];
}

/**
 * Mobile rich-description images with the iOS-safe expand/collapse
 * animation pattern: measure height before transitioning, hold
 * `overflow-hidden` only while animating, then drop the constraint
 * when fully open so subsequent image loads can grow the container.
 */
export function ImagesSectionMobile({ images }: ImagesSectionMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFinal, setExpandedFinal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Delay so the first image has a chance to load before measurement.
    const timer = setTimeout(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [images]);

  const handleImageLoad = useCallback(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
      setExpandedFinal(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(false);
        });
      });
    } else {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
      setIsExpanded(true);
      setTimeout(() => {
        setExpandedFinal(true);
      }, 550);
    }
  }, [isExpanded]);

  const showExpandButton = isMobile && (isExpanded || contentHeight > COLLAPSED_HEIGHT);

  return (
    <div className="md:hidden">
      <div
        className={`relative transition-[max-height] duration-500 ease-in-out ${expandedFinal ? "" : "overflow-hidden"}`}
        style={{
          maxHeight: expandedFinal
            ? undefined
            : isExpanded
              ? contentHeight + 500
              : COLLAPSED_HEIGHT,
          WebkitTransform: "translateZ(0)",
        }}
      >
        <div ref={contentRef} className="flex flex-col gap-4 max-w-[640px] w-full">
          <div className="flex flex-col">
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
                onLoad={handleImageLoad}
              />
            ))}
          </div>
        </div>

        {!isExpanded && showExpandButton && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {showExpandButton && (
        <div className="px-4 pb-5 pt-4 w-full">
          <ExpandToggleButton isExpanded={isExpanded} onToggle={handleToggle} />
        </div>
      )}
    </div>
  );
}
