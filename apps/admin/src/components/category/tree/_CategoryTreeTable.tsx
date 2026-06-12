"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { CategoryDragOverlayContent } from "./_CategoryDragOverlayContent";
import { type FlatCategory } from "./_tree-helpers";
import { SortableRow } from "./SortableRow";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

interface CategoryTreeTableProps {
  displayList: FlatCategory[];
  collapsedIds: Set<string>;
  activeDragId: string | null;
  onToggleCollapse: (id: string) => void;
  onAddSub: (parentId: string) => void;
  onEdit: (cat: FlatCategory) => void;
  onProducts: (cat: FlatCategory) => void;
  onDelete: (cat: FlatCategory) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => Promise<void> | void;
}

export function CategoryTreeTable({
  displayList,
  collapsedIds,
  activeDragId,
  onToggleCollapse,
  onAddSub,
  onEdit,
  onProducts,
  onDelete,
  onDragStart,
  onDragEnd,
}: CategoryTreeTableProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeDragCat = activeDragId ? displayList.find((c) => c.id === activeDragId) : null;

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <div className="flex items-center border-b border-slate-200 bg-slate-100 px-4 h-10">
        <span className="flex-1 text-sm font-medium text-slate-950">
          Ангиллын түвшин ба дараалал
        </span>
        <span className="text-sm font-medium text-slate-950 w-[80px] text-center mr-28">Төрөл</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={displayList.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {displayList.map((cat) => (
            <SortableRow
              key={cat.id}
              cat={cat}
              isExpanded={!collapsedIds.has(cat.id)}
              onToggle={onToggleCollapse}
              onAddSub={onAddSub}
              onEdit={onEdit}
              onProducts={onProducts}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        <DragOverlay>
          {activeDragCat ? <CategoryDragOverlayContent cat={activeDragCat} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
