"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Banner } from "./types";

interface SortableBannerItemProps {
  banner: Banner;
  onDelete: (banner: Banner) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function SortableBannerItem({
  banner,
  onDelete,
  onToggleActive,
}: SortableBannerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border rounded-lg hover:bg-muted/30 transition-colors p-3",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors shrink-0"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Image preview */}
        <div
          className="w-16 h-10 sm:w-24 sm:h-14 rounded border overflow-hidden shrink-0"
          style={{ backgroundColor: banner.background_color }}
        >
          {banner.image_url && (
            <img
              src={banner.image_url}
              alt="Banner"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Type badge + color (hidden on mobile) */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full shrink-0",
              banner.type === "carousel"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {banner.type === "carousel" ? "Carousel" : "Promo"}
          </span>

          {/* Background color - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div
              className="w-6 h-6 rounded border shadow-sm"
              style={{ backgroundColor: banner.background_color }}
            />
            <span className="font-mono text-xs text-muted-foreground hidden md:inline">
              {banner.background_color}
            </span>
          </div>

          {/* Sort order - hidden on mobile */}
          <span className="hidden sm:inline text-sm text-muted-foreground w-8 text-center">
            #{banner.sort_order}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active toggle */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={banner.is_active}
            onCheckedChange={(checked) => onToggleActive(banner.id, checked)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Link href={`/banners/${banner.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(banner)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
