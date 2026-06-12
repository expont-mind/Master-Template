"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";

import type { FlatCategory } from "./_tree-helpers";
import type { Category } from "@/components/category/types";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

interface UseCategoryDndArgs {
  displayList: FlatCategory[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  refresh: () => Promise<void>;
}

function buildSortMap(reordered: FlatCategory[]): Map<string, number> {
  const sortMap = new Map<string, number>();
  reordered.forEach((cat, i) => sortMap.set(cat.id, i));
  return sortMap;
}

function buildSortOrderUpdates(
  reordered: FlatCategory[],
  siblings: FlatCategory[],
): { id: string; sort_order: number }[] {
  return reordered
    .map((cat, i) => ({ id: cat.id, sort_order: i }))
    .filter((u) => {
      const orig = siblings.find((s) => s.id === u.id);
      return orig && orig.sort_order !== u.sort_order;
    });
}

export function useCategoryDnd({ displayList, setCategories, refresh }: UseCategoryDndArgs) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedCat = displayList.find((c) => c.id === active.id);
    const targetCat = displayList.find((c) => c.id === over.id);
    if (!draggedCat || !targetCat) return;
    if (draggedCat.parentId !== targetCat.parentId) return;

    const siblings = displayList.filter((c) => c.parentId === draggedCat.parentId);
    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);
    const sortMap = buildSortMap(reordered);

    setCategories((prev) =>
      prev.map((c) => (sortMap.has(c.id) ? { ...c, sort_order: sortMap.get(c.id)! } : c)),
    );

    const updates = buildSortOrderUpdates(reordered, siblings);

    try {
      await Promise.all(
        updates.map((u) => adminApi.update("categories", u.id, { sort_order: u.sort_order })),
      );
    } catch (error) {
      log.error("category_sort_order_update_failed", error);
      await refresh();
    }
  };

  return { activeDragId, handleDragStart, handleDragEnd };
}
