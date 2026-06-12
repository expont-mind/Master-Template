"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { VARIANT_DETAIL_TYPES } from "./types";

import type { ProductDetail } from "@/hooks/useProductEdit";

function SortableDetailRow({
  detail,
  onRemove,
  onUpdate,
}: {
  detail: ProductDetail;
  onRemove: (detailId: string) => void;
  onUpdate: (detailId: string, field: "type" | "content", value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: detail.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex border-b last:border-b-0 group bg-background",
        isDragging && "opacity-50 shadow-lg z-10 relative",
      )}
    >
      <div
        className="w-11 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="w-12 shrink-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(detail.id)}
          className="p-1.5 rounded hover:bg-muted transition-colors"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="w-[200px] shrink-0 px-2 py-3">
        <Select
          value={detail.type || "placeholder"}
          onValueChange={(val) => onUpdate(detail.id, "type", val === "placeholder" ? "" : val)}
        >
          <SelectTrigger className="border-0 shadow-none h-auto p-0 text-sm font-medium">
            <SelectValue placeholder="Сонгох" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder" disabled>
              Сонгох
            </SelectItem>
            {VARIANT_DETAIL_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 px-2 py-3">
        <textarea
          className="w-full text-sm resize-none bg-transparent outline-none min-h-[20px]"
          placeholder="Тайлбар бичих..."
          rows={Math.max(1, Math.ceil(detail.content.length / 60))}
          value={detail.content}
          onChange={(e) => onUpdate(detail.id, "content", e.target.value)}
        />
      </div>
    </div>
  );
}

interface ProductDetailsTableProps {
  productDetails: ProductDetail[];
  addProductDetail: () => void;
  removeProductDetail: (detailId: string) => void;
  updateProductDetail: (detailId: string, field: "type" | "content", value: string) => void;
  reorderProductDetails: (fromIndex: number, toIndex: number) => void;
}

export function ProductDetailsTable({
  productDetails,
  addProductDetail,
  removeProductDetail,
  updateProductDetail,
  reorderProductDetails,
}: ProductDetailsTableProps) {
  const detailSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDetailDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = productDetails.findIndex((d) => d.id === active.id);
    const newIndex = productDetails.findIndex((d) => d.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderProductDetails(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base">Нэмэлт мэдээлэл</Label>
      <div className="border rounded-md overflow-x-auto">
        <div className="flex border-b bg-muted/30">
          <div className="w-11 shrink-0 flex items-center justify-center py-3">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="w-12 shrink-0 flex items-center justify-center py-3">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="w-[200px] shrink-0 px-2 py-3 text-sm text-muted-foreground">Гарчиг</div>
          <div className="flex-1 px-2 py-3 text-sm text-muted-foreground">Тайлбар</div>
        </div>

        <DndContext
          sensors={detailSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDetailDragEnd}
        >
          <SortableContext
            items={productDetails.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {productDetails.map((detail) => (
              <SortableDetailRow
                key={detail.id}
                detail={detail}
                onRemove={removeProductDetail}
                onUpdate={updateProductDetail}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={addProductDetail}
          className="flex items-center gap-2 w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted/30 transition-colors border-t"
        >
          <Plus className="h-4 w-4" />
          Шинэ мөр нэмэх
        </button>
      </div>
    </div>
  );
}
