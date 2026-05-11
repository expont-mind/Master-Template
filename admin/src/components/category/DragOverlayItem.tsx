"use client";

import { GripVertical, Folder } from "lucide-react";
import { DragOverlayItemProps } from "./types";

export function DragOverlayItem({ node }: DragOverlayItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 bg-background border rounded-lg shadow-lg">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <Folder className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-medium">{node.name}</span>
    </div>
  );
}
