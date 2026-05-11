"use client";

import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { CategoryTreeProps } from "./types";
import { useCategoryTree } from "@/hooks/useCategoryTree";
import { SortableItem } from "./SortableItem";
import { DragOverlayItem } from "./DragOverlayItem";

export function CategoryTree({
  categories,
  onMove,
  onDelete,
}: CategoryTreeProps) {
  const {
    sensors,
    tree,
    flatList,
    expandedIds,
    activeId,
    overId,
    activeNode,
    toggleExpand,
    expandAll,
    collapseAll,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getVisibleNodes,
    getTotalDescendants,
  } = useCategoryTree({ categories, onMove });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Бүгдийг нээх
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Бүгдийг хаах
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {categories.length} ангилал
        </span>
      </div>

      {/* Tree - 2 columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={flatList.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Split root categories into 2 columns */}
            {[0, 1].map((colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {tree
                  .filter((_, i) => i % 2 === colIndex)
                  .map((rootNode) => {
                    const visibleNodes = getVisibleNodes(rootNode);

                    return visibleNodes.map((node) => (
                      <SortableItem
                        key={node.id}
                        node={node}
                        isExpanded={expandedIds.has(node.id)}
                        onToggle={toggleExpand}
                        onDelete={onDelete}
                        totalCount={getTotalDescendants(node)}
                        isDragging={activeId === node.id}
                        isOver={overId === node.id}
                      />
                    ));
                  })}
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeNode && <DragOverlayItem node={activeNode} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
