"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Image, Loader2 } from "lucide-react";
import { useBannerList } from "@/hooks/useBannerList";
import { SortableBannerItem } from "./SortableBannerItem";
import type { Banner, BannerType } from "./types";

export function BannerList() {
  const {
    filteredBanners,
    isLoading,
    statusFilter,
    setStatusFilter,
    handleDelete,
    handleToggleActive,
    handleReorder,
  } = useBannerList();

  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDelete = useCallback((banner: Banner) => {
    setDeleteTarget(banner);
  }, []);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleDelete]);

  // Filter banners by type
  const displayedBanners = filteredBanners.filter((banner) => {
    if (typeFilter === "all") return true;
    return banner.type === typeFilter;
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = displayedBanners.findIndex((b) => b.id === active.id);
        const newIndex = displayedBanners.findIndex((b) => b.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(displayedBanners, oldIndex, newIndex);

          // Create updates with new sort_order values
          const updates = reordered.map((banner, index) => ({
            id: banner.id,
            sort_order: index,
          }));

          await handleReorder(updates);
        }
      }
    },
    [displayedBanners, handleReorder]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">Баннер</p>
        <Link href="/banners/new">
          <Button size="sm" className="sm:size-default">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Шинэ баннер</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Төрөл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүх төрөл</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Төлөв" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="active">Идэвхтэй</SelectItem>
              <SelectItem value="inactive">Идэвхгүй</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {displayedBanners.length} баннер
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayedBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Баннер байхгүй</p>
          <p className="text-sm text-muted-foreground">
            Эхний баннераа үүсгэнэ үү
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedBanners.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {displayedBanners.map((banner) => (
                <SortableBannerItem
                  key={banner.id}
                  banner={banner}
                  onDelete={onDelete}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Баннер устгах"
        description="Энэ баннерыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй."
        confirmText="Устгах"
        cancelText="Цуцлах"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
