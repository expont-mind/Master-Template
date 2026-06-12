"use client";

import { useEffect, useRef, useState } from "react";

import { ExpandToggleButton } from "./ExpandToggleButton";
import { SpecsTable } from "./SpecsTable";

import type { Spec } from "./specs";

const COLLAPSED_HEIGHT = 400;

interface SpecsSectionMobileProps {
  specs: Spec[];
}

export function SpecsSectionMobile({ specs }: SpecsSectionMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track viewport so the expand button only appears on mobile widths —
  // desktop has its own section component with a separate measurement.
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Re-measure whenever the spec list changes (e.g. variant switch).
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [specs]);

  const showExpandButton = isMobile && (isExpanded || contentHeight > COLLAPSED_HEIGHT);

  return (
    <div className="md:hidden">
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{
          maxHeight: isExpanded ? contentHeight + 100 : COLLAPSED_HEIGHT,
        }}
      >
        <div ref={contentRef} className="p-4 flex flex-col gap-3 max-w-[640px] w-full">
          <p className="text-text-primary font-medium text-lg font-manrope py-1">
            Дэлгэрэнгүй тайлбар
          </p>
          <SpecsTable specs={specs} />
        </div>

        {!isExpanded && showExpandButton && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {showExpandButton && (
        <div className="px-4 pb-5 w-full">
          <ExpandToggleButton isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
        </div>
      )}
    </div>
  );
}
