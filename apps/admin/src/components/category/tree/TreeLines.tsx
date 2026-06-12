"use client";

import { cn } from "@/lib/utils";

import type { FlatCategory } from "./_tree-helpers";

/**
 * Renders the ├── / └── tree connector lines next to a flattened
 * category row. Level 1 (root) shows no lines.
 */
export function TreeLines({ cat }: { cat: FlatCategory }) {
  if (cat.level <= 1) return null;

  const slots: React.ReactNode[] = [];

  // Ancestor continuation lines (one per ancestor level)
  for (let i = 0; i < cat.ancestorIsLastFlags.length; i++) {
    const ancestorIsLast = cat.ancestorIsLastFlags[i];
    slots.push(
      <div key={`a-${i}`} className="w-5 relative shrink-0">
        {!ancestorIsLast && (
          <div className="absolute left-[9px] top-0 bottom-0 w-px bg-slate-300" />
        )}
      </div>,
    );
  }

  // Current node junction: ├── or └──
  slots.push(
    <div key="junction" className="w-5 relative shrink-0">
      <div
        className={cn(
          "absolute left-[9px] w-px bg-slate-300",
          cat.isLastChild ? "top-0 h-1/2" : "top-0 bottom-0",
        )}
      />
      <div className="absolute left-[9px] top-1/2 w-[11px] h-px bg-slate-300" />
    </div>,
  );

  return <div className="flex self-stretch -my-2">{slots}</div>;
}
