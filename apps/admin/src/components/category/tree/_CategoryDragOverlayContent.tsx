"use client";

import { Boxes, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { LEVEL_COLORS, type FlatCategory } from "./_tree-helpers";

interface CategoryDragOverlayContentProps {
  cat: FlatCategory;
}

export function CategoryDragOverlayContent({ cat }: CategoryDragOverlayContentProps) {
  const levelColor = LEVEL_COLORS[cat.level] ?? LEVEL_COLORS[5];
  return (
    <div className="flex items-center px-4 py-4 bg-background border rounded-md shadow-lg">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 mr-3" />
      <div className="h-8 w-8 rounded bg-muted shrink-0 overflow-hidden mr-3">
        {cat.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Boxes className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <Badge
        variant="secondary"
        className={`${levelColor} shrink-0 text-xs px-2.5 py-0.5 font-medium mr-3`}
      >
        {cat.level}-р
      </Badge>
      <span className="text-sm">{cat.name}</span>
    </div>
  );
}
