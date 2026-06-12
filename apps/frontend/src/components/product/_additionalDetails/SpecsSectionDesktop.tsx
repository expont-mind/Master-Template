"use client";

import { useEffect, useRef, useState } from "react";

import { ExpandToggleButton } from "./ExpandToggleButton";
import { SpecsTable } from "./SpecsTable";

import type { Spec } from "./specs";

const COLLAPSED_HEIGHT = 400;

interface SpecsSectionDesktopProps {
  specs: Spec[];
}

export function SpecsSectionDesktop({ specs }: SpecsSectionDesktopProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [specs]);

  const showExpandButton = isExpanded || contentHeight > COLLAPSED_HEIGHT;

  return (
    <div className="hidden md:flex flex-col">
      <div className="md:pt-10 flex flex-col gap-4 max-w-[640px] w-full">
        <p className="text-text-primary font-semibold text-xl font-manrope py-1">
          Дэлгэрэнгүй тайлбар
        </p>

        <div
          className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{
            maxHeight: isExpanded ? contentHeight + 100 : COLLAPSED_HEIGHT,
          }}
        >
          <div ref={contentRef}>
            <SpecsTable specs={specs} desktop />
          </div>

          {!isExpanded && showExpandButton && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent pointer-events-none" />
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
    </div>
  );
}
