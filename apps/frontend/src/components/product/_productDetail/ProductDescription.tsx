"use client";

import { ChevronDownCategory } from "@/components/svg";

interface ProductDescriptionProps {
  description: string;
  descRef: React.RefObject<HTMLParagraphElement | null>;
  expanded: boolean;
  setExpanded: (next: (prev: boolean) => boolean) => void;
  overflows: boolean;
  fullHeight: number;
  /** Adds extra room when expanded — mobile has a +192 cushion. */
  expansionPadding?: number;
  /** Wraps the toggle button in a self-end container (desktop layout). */
  desktop?: boolean;
}

/**
 * 2-line clamp description (48px) with a "Цааш / Хураах" toggle. When
 * `desktop` is true the description and toggle live side-by-side; on
 * mobile the toggle sits below on its own row.
 */
export function ProductDescription({
  description,
  descRef,
  expanded,
  setExpanded,
  overflows,
  fullHeight,
  expansionPadding = 0,
  desktop = false,
}: ProductDescriptionProps) {
  const maxHeight = expanded ? `${fullHeight + expansionPadding}px` : "48px";

  const toggleButton = overflows ? (
    <button
      onClick={() => setExpanded((prev) => !prev)}
      className={
        desktop
          ? "flex items-center gap-0.5 cursor-pointer self-end"
          : "flex items-center gap-0.5 cursor-pointer mt-1 ml-auto"
      }
    >
      <span
        className={
          desktop
            ? "text-text-secondary w-[70px] font-medium text-sm font-manrope"
            : "text-text-secondary font-medium text-sm font-manrope"
        }
      >
        {expanded ? "Хураах" : "Цааш"}
      </span>
      <div
        className="transition-transform duration-300 ease-in-out"
        style={{
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <ChevronDownCategory />
      </div>
    </button>
  ) : null;

  const descBlock = (
    <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight }}>
      <p
        ref={descRef}
        className="text-text-secondary font-normal text-base font-manrope leading-6 transition-all duration-300"
      >
        {description}
      </p>
    </div>
  );

  if (desktop) {
    return (
      <div className="flex items-end gap-1">
        {descBlock}
        {toggleButton}
      </div>
    );
  }

  return (
    <div>
      {descBlock}
      {toggleButton}
    </div>
  );
}
