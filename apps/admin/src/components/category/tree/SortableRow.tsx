"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LEVEL_COLORS, type FlatCategory } from "./_tree-helpers";
import { TreeLines } from "./TreeLines";

interface SortableRowProps {
  cat: FlatCategory;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onAddSub: (id: string) => void;
  onEdit: (cat: FlatCategory) => void;
  onProducts: (cat: FlatCategory) => void;
  onDelete: (cat: FlatCategory) => void;
}

export function SortableRow({
  cat,
  isExpanded,
  onToggle,
  onAddSub,
  onEdit,
  onProducts,
  onDelete,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const levelColor = LEVEL_COLORS[cat.level] ?? LEVEL_COLORS[5];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center border-b border-slate-200 last:border-b-0 px-4 py-2 hover:bg-slate-50 transition-colors",
        isDragging && "opacity-50 bg-slate-50 z-10",
        cat.is_active === false && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Tree lines */}
        <TreeLines cat={cat} />

        {/* Expand/collapse chevron */}
        <button
          onClick={() => cat.hasChildren && onToggle(cat.id)}
          className={cn(
            "p-0.5 rounded hover:bg-slate-200 transition-colors shrink-0",
            !cat.hasChildren && "invisible",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </button>

        {/* Category image */}
        <div className="h-8 w-8 rounded bg-muted shrink-0 overflow-hidden">
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
          className={`${levelColor} shrink-0 text-xs px-2.5 py-0.5 font-medium`}
        >
          {cat.level}-р
        </Badge>
        <button
          type="button"
          className="text-sm truncate cursor-pointer hover:underline bg-transparent border-0 p-0 text-left"
          onClick={() => onProducts(cat)}
        >
          {cat.name}
        </button>
      </div>

      {/* Type badge */}
      <div className="w-[80px] text-center shrink-0">
        <Badge
          variant="secondary"
          className={
            cat.is_featured
              ? "bg-rose-50 text-rose-600 text-xs"
              : "bg-gray-50 text-gray-500 text-xs"
          }
        >
          {cat.is_featured ? "Онцлох" : "Энгийн"}
        </Badge>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 ml-4 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddSub(cat.id)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onProducts(cat)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(cat)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
