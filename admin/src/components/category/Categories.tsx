"use client";

import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { log } from "@/lib/observability/log";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Boxes, GripVertical, Loader2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDialog, type CategoryDialogMode } from "./CategoryDialog";
import { CategoryProductsDialog } from "./CategoryProductsDialog";
import {
  deactivateCategorySubtree,
  invalidateCategoryCaches,
} from "./actions";
import type { Category } from "./types";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  flattenCategories,
  LEVEL_COLORS,
  type FlatCategory,
  type Tab,
} from "./tree/_tree-helpers";
import { SortableRow } from "./tree/SortableRow";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Search state
  const [search, setSearch] = useState("");

  // Expand/collapse state (tracks collapsed parent IDs)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<CategoryDialogMode>("new");
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [subParentId, setSubParentId] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Products dialog state
  const [productsOpen, setProductsOpen] = useState(false);
  const [productsTarget, setProductsTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // DnD state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getAll<Category>("categories", {
        select: "id, name, slug, parent_id, image, is_featured, is_active, sort_order",
        order: "sort_order.asc",
      });
      setCategories(data);
    } catch (error) {
      log.error("categories_fetch_failed", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const flatList = useMemo(
    () => flattenCategories(categories, null, 1, collapsedIds),
    [categories, collapsedIds]
  );

  const displayList = useMemo(() => {
    let list = flatList;
    if (activeTab === "home") list = list.filter((c) => c.is_featured);
    if (activeTab === "category_menu") list = list.filter((c) => !c.is_featured);

    const query = search.trim().toLowerCase();
    if (!query) return list;

    // Find matching IDs, then collect their ancestor IDs for tree context
    const matchIds = new Set(
      list.filter((c) => c.name.toLowerCase().includes(query)).map((c) => c.id)
    );
    const ancestorIds = new Set<string>();
    for (const id of matchIds) {
      let current = categories.find((c) => c.id === id);
      while (current?.parent_id) {
        ancestorIds.add(current.parent_id);
        current = categories.find((c) => c.id === current!.parent_id);
      }
    }

    return list.filter((c) => matchIds.has(c.id) || ancestorIds.has(c.id));
  }, [flatList, activeTab, search, categories]);

  // ── Expand/Collapse handlers ────────────────────────────────
  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());

  const collapseAll = () => {
    const parentIds = new Set(
      categories
        .filter((c) => categories.some((ch) => ch.parent_id === c.id))
        .map((c) => c.id)
    );
    setCollapsedIds(parentIds);
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleAddRoot = () => {
    setEditTarget(null);
    setSubParentId(null);
    setDialogMode("new");
    setDialogOpen(true);
  };

  const handleAddSub = (parentId: string) => {
    setEditTarget(null);
    setSubParentId(parentId);
    setDialogMode("sub");
    setDialogOpen(true);
  };

  const handleEdit = (cat: FlatCategory) => {
    const original = categories.find((c) => c.id === cat.id);
    if (original) {
      setEditTarget(original);
      setSubParentId(null);
      setDialogMode("edit");
      setDialogOpen(true);
    }
  };

  // Generate a unique slug from name
  const generateSlug = (name: string): string => {
    let baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "");

    // If slug is empty (e.g., all Mongolian text), generate a random one
    if (!baseSlug) {
      baseSlug = `category-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    // Check for existing slugs and append number if needed
    const existingSlugs = categories.map((c) => c.slug).filter(Boolean);
    let slug = baseSlug;
    let counter = 1;
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  };

  const handleDialogSave = async (data: {
    name: string;
    image: string;
    is_featured: boolean;
    is_active: boolean;
  }) => {
    setIsSaving(true);
    try {
      if (dialogMode === "edit" && editTarget) {
        const wasActive = editTarget.is_active !== false;
        const becomingInactive = wasActive && !data.is_active;

        // For an active→inactive transition we delegate the WHOLE write
        // to the server action: it walks the live DB tree (avoiding the
        // stale-state hazard of a client BFS) and bulk-flips is_active
        // on every descendant in one query. Then it busts Redis caches.
        if (becomingInactive) {
          await adminApi.update("categories", editTarget.id, {
            name: data.name,
            image: data.image || null,
            is_featured: data.is_featured,
          });
          await deactivateCategorySubtree(editTarget.id);
        } else {
          await adminApi.update("categories", editTarget.id, {
            name: data.name,
            image: data.image || null,
            is_featured: data.is_featured,
            is_active: data.is_active,
          });
          const activeChanged = wasActive !== !!data.is_active;
          if (activeChanged) {
            await invalidateCategoryCaches();
          }
        }
      } else {
        const parentId = dialogMode === "sub" ? subParentId : null;

        // Auto-increment sort_order among siblings
        const siblings = categories.filter((c) => c.parent_id === parentId);
        const maxSortOrder = siblings.reduce(
          (max, c) => Math.max(max, c.sort_order ?? 0),
          -1
        );

        // Generate slug from name
        const slug = generateSlug(data.name);

        await adminApi.insert("categories", {
          name: data.name,
          slug,
          image: data.image || null,
          is_featured: data.is_featured,
          is_active: data.is_active,
          parent_id: parentId,
          sort_order: maxSortOrder + 1,
        });
      }
      await fetchCategories();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      // Server-side cascade: walks fresh DB tree, bulk updates the entire
      // subtree, busts Redis caches. Avoids the per-row PATCH fan-out and
      // any stale-state pitfall in the client BFS.
      await deactivateCategorySubtree(deleteTarget.id);
      await fetchCategories();
    } catch (error) {
      log.error("category_deactivate_failed", error);
    }
    setIsSaving(false);
    setDeleteTarget(null);
  };

  const handleProductsClick = (cat: FlatCategory) => {
    setProductsTarget({ id: cat.id, name: cat.name });
    setProductsOpen(true);
  };

  // ── Drag-and-drop (reorder only, no reparenting) ─────────
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

    // Only allow reorder within the same parent
    if (draggedCat.parentId !== targetCat.parentId) return;

    const siblings = displayList.filter(
      (c) => c.parentId === draggedCat.parentId
    );
    const oldIndex = siblings.findIndex((c) => c.id === active.id);
    const newIndex = siblings.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);
    const sortMap = new Map<string, number>();
    reordered.forEach((cat, i) => sortMap.set(cat.id, i));

    setCategories((prev) =>
      prev.map((c) =>
        sortMap.has(c.id)
          ? { ...c, sort_order: sortMap.get(c.id)! }
          : c
      )
    );

    const updates = reordered
      .map((cat, i) => ({ id: cat.id, sort_order: i }))
      .filter((u) => {
        const orig = siblings.find((s) => s.id === u.id);
        return orig && orig.sort_order !== u.sort_order;
      });

    try {
      await Promise.all(
        updates.map((u) =>
          adminApi.update("categories", u.id, {
            sort_order: u.sort_order,
          })
        )
      );
    } catch (error) {
      log.error("category_sort_order_update_failed", error);
      await fetchCategories();
    }
  };

  // ── Render ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: "Бүх категори" },
    { value: "home", label: "Home дээрх" },
    { value: "category_menu", label: "Категори меню дээрх" },
  ];

  return (
    <div className="space-y-0">
      {/* Tabs + Actions */}
      <div className="flex items-center justify-between border-b mb-6">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors relative",
                activeTab === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Бүгдийг нээх
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Бүгдийг хаах
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddRoot}>
            <Plus className="h-4 w-4 mr-1" />
            Ангилал нэмэх
          </Button>
        </div>
      </div>

      {/* Table */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Ангилал байхгүй</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Эхний ангилалаа нэмнэ үү
          </p>
          <Button onClick={handleAddRoot}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ ангилал
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          {/* Table header */}
          <div className="flex items-center border-b border-slate-200 bg-slate-100 px-4 h-10">
            <span className="flex-1 text-sm font-medium text-slate-950">
              Ангиллын түвшин ба дараалал
            </span>
            <span className="text-sm font-medium text-slate-950 w-[80px] text-center mr-28">
              Төрөл
            </span>
          </div>

          {/* Table rows — draggable */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
                  onToggle={toggleCollapse}
                  onAddSub={handleAddSub}
                  onEdit={handleEdit}
                  onProducts={handleProductsClick}
                  onDelete={(c) => {
                    const original = categories.find((cat) => cat.id === c.id);
                    if (original) setDeleteTarget(original);
                  }}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeDragId ? (() => {
                const cat = displayList.find((c) => c.id === activeDragId);
                if (!cat) return null;
                const levelColor = LEVEL_COLORS[cat.level] ?? LEVEL_COLORS[5];
                return (
                  <div className="flex items-center px-4 py-4 bg-background border rounded-md shadow-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 mr-3" />
                    <div className="h-8 w-8 rounded bg-muted shrink-0 overflow-hidden mr-3">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="h-full w-full object-cover"
                        />
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
              })() : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialName={editTarget?.name ?? ""}
        initialImage={editTarget?.image ?? ""}
        initialFeatured={editTarget?.is_featured ?? false}
        initialStatus={editTarget?.is_active !== false}
        onSave={handleDialogSave}
      />

      {/* Delete Confirm (soft delete: deactivate cascade) */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Ангилал нуух"
        description={`"${deleteTarget?.name}" ангилал болон түүний дэд ангилалуудыг идэвхгүй болгож нуух уу? Бүтээгдэхүүнүүд хэвээр харагдана.`}
        confirmText="Нуух"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Products Dialog */}
      <CategoryProductsDialog
        open={productsOpen}
        onOpenChange={(open) => {
          setProductsOpen(open);
          if (!open) setTimeout(() => setProductsTarget(null), 300);
        }}
        categoryId={productsTarget?.id ?? ""}
        categoryName={productsTarget?.name ?? ""}
      />
    </div>
  );
}
