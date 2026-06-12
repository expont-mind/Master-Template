"use client";

import { ChevronDownBig } from "@/components/svg";

interface ExpandToggleButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  /** Use the larger desktop sizing (py-3.5 + text-lg) when true. */
  desktop?: boolean;
}

/**
 * Shared "Цааш нь үзэх / Хураах" toggle button used by both the specs
 * and images expandable sections in `AdditionalDetails`. The desktop
 * variant uses a slightly larger touch target + font size to match the
 * surrounding desktop layout.
 */
export function ExpandToggleButton({
  isExpanded,
  onToggle,
  desktop = false,
}: ExpandToggleButtonProps) {
  const padding = desktop ? "py-3.5" : "py-2.5";
  const fontSize = desktop ? "text-lg" : "text-base";

  return (
    <button
      onClick={onToggle}
      className={`px-3 ${padding} w-full border border-border rounded-sm flex items-center justify-center gap-0.5 cursor-pointer hover:bg-surface`}
    >
      <span className={`px-0.5 text-text-primary font-normal ${fontSize} font-manrope`}>
        {isExpanded ? "Хураах" : "Цааш нь үзэх"}
      </span>
      <span className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
        <ChevronDownBig />
      </span>
    </button>
  );
}
