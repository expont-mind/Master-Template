"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Loader2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSocialLinks } from "@/hooks/useSocialLinks";

import { NewSocialLinkRow } from "./NewSocialLinkRow";
import { SocialLinkItem } from "./SocialLinkItem";

export function SocialLinkList() {
  const {
    socialLinks,
    isLoading,
    isSaving,
    deleteTarget,
    setDeleteTarget,
    sensors,
    handleDragEnd,
    editingId,
    editPlatform,
    editUrl,
    editIsActive,
    setEditPlatform,
    setEditUrl,
    setEditIsActive,
    startEdit,
    cancelEdit,
    saveEdit,
    isAdding,
    newPlatform,
    newUrl,
    newIsActive,
    setNewPlatform,
    setNewUrl,
    setNewIsActive,
    startAdding,
    cancelAdding,
    saveNew,
    handleDelete,
  } = useSocialLinks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Сошиал холбоос</h1>
        <Button onClick={startAdding} disabled={isAdding} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Шинэ холбоос</span>
          <span className="sm:hidden">Нэмэх</span>
        </Button>
      </div>

      <div className="space-y-2">
        {isAdding && (
          <NewSocialLinkRow
            platform={newPlatform}
            url={newUrl}
            isActive={newIsActive}
            isSaving={isSaving}
            onPlatformChange={setNewPlatform}
            onUrlChange={setNewUrl}
            onIsActiveChange={setNewIsActive}
            onSave={saveNew}
            onCancel={cancelAdding}
          />
        )}

        {socialLinks.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Сошиал холбоос байхгүй</h3>
            <p className="text-sm text-muted-foreground mb-4">Эхний сошиал холбоосоо нэмнэ үү</p>
            <Button onClick={startAdding}>
              <Plus className="mr-2 h-4 w-4" />
              Шинэ холбоос
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={socialLinks.map((link) => link.id)}
              strategy={verticalListSortingStrategy}
            >
              {socialLinks.map((link) => (
                <SocialLinkItem
                  key={link.id}
                  link={link}
                  isEditing={editingId === link.id}
                  editPlatform={editPlatform}
                  editUrl={editUrl}
                  editIsActive={editIsActive}
                  isSaving={isSaving}
                  onEdit={() => startEdit(link)}
                  onDelete={() => setDeleteTarget(link)}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  onPlatformChange={setEditPlatform}
                  onUrlChange={setEditUrl}
                  onIsActiveChange={setEditIsActive}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Холбоос устгах"
        description={`"${deleteTarget?.platform}" холбоосыг устгах уу?`}
        confirmText="Устгах"
        cancelText="Болих"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
