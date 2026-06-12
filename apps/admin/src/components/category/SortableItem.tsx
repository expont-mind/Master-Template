"use client";

import { useSortable } from "@dnd-kit/sortable";
import {
  ChevronRight,
  ChevronDown,
  GripVertical,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SortableItemProps } from "./types";

const DEPTH_COLORS = [
  "text-blue-500", // depth 0 - main category
  "text-green-500", // depth 1 - subcategory
  "text-orange-500", // depth 2
  "text-purple-500", // depth 3
  "text-pink-500", // depth 4+
];

export function SortableItem({
  node,
  isExpanded,
  onToggle,
  onDelete,
  totalCount,
  isDragging,
  isOver,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isSortableDragging,
  } = useSortable({ id: node.id });

  const hasChildren = node.children.length > 0;
  const folderColor = DEPTH_COLORS[Math.min(node.depth, DEPTH_COLORS.length - 1)];

  return (
    <div ref={setNodeRef} className={cn("group w-full", isSortableDragging && "opacity-50")}>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors border bg-background",
          isDragging && "bg-muted",
          isOver && "bg-muted",
        )}
        style={{ marginLeft: `${node.depth * 20}px` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Expand/collapse button */}
        <button
          onClick={() => onToggle(node.id)}
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
            !hasChildren && "invisible",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Folder icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className={cn("h-4 w-4", folderColor)} />
        ) : (
          <Folder className={cn("h-4 w-4", folderColor)} />
        )}

        {/* Name */}
        <span className="flex-1 text-sm font-medium truncate ml-1">{node.name}</span>

        {/* Total descendants count */}
        {totalCount > 0 && <span className="text-xs text-muted-foreground mr-2">{totalCount}</span>}

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Link href={`/categories/new?parent=${node.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/categories/${node.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {totalCount === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
              onClick={() => onDelete(node.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
