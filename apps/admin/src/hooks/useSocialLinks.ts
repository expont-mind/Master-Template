"use client";

import { KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SocialLink } from "@/components/social-link/types";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { queryKeys } from "@/lib/query-keys";

import { useSocialLinkAddState, useSocialLinkEditState } from "./_useSocialLinkFormState";
import { useSocialLinkMutations } from "./_useSocialLinkMutations";

export function useSocialLinks() {
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  const editState = useSocialLinkEditState();
  const addState = useSocialLinkAddState();

  const { reorderMutation, editMutation, createMutation, deleteMutation } =
    useSocialLinkMutations();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { data: socialLinks = [], isLoading } = useQuery({
    queryKey: queryKeys.socialLinks.lists(),
    queryFn: () =>
      adminApi.getAll<SocialLink>("social_links", {
        order: "sort_order.asc",
      }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = socialLinks.findIndex((link) => link.id === active.id);
    const newIndex = socialLinks.findIndex((link) => link.id === over.id);
    const newLinks = arrayMove(socialLinks, oldIndex, newIndex);
    reorderMutation.mutate(newLinks);
  };

  // Edit flow — composes edit-state hook with mutation
  const startEdit = (link: SocialLink) => {
    editState.startEdit(link);
    addState.cancelAdding();
  };

  const saveEdit = async () => {
    if (!editState.editingId || !editState.editPlatform || !editState.editUrl.trim()) {
      return;
    }
    try {
      await editMutation.mutateAsync({
        id: editState.editingId,
        platform: editState.editPlatform,
        url: editState.editUrl,
        isActive: editState.editIsActive,
      });
      editState.cancelEdit();
    } catch (error) {
      log.error("social_link_update_failed", error);
    }
  };

  // Add flow
  const startAdding = () => {
    addState.startAdding();
    editState.setEditingId(null);
  };

  const saveNew = async () => {
    if (!addState.newPlatform || !addState.newUrl.trim()) return;
    try {
      await createMutation.mutateAsync({
        platform: addState.newPlatform,
        url: addState.newUrl,
        isActive: addState.newIsActive,
        sortOrder: socialLinks.length,
      });
      addState.cancelAdding();
    } catch (error) {
      log.error("social_link_create_failed", error);
    }
  };

  // Delete flow
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (error) {
      log.error("social_link_delete_failed", error);
    }
    setDeleteTarget(null);
  };

  const isSaving = editMutation.isPending || createMutation.isPending;

  return {
    socialLinks,
    isLoading,
    isSaving,
    deleteTarget,
    setDeleteTarget,
    sensors,
    handleDragEnd,

    editingId: editState.editingId,
    editPlatform: editState.editPlatform,
    editUrl: editState.editUrl,
    editIsActive: editState.editIsActive,
    setEditPlatform: editState.setEditPlatform,
    setEditUrl: editState.setEditUrl,
    setEditIsActive: editState.setEditIsActive,
    startEdit,
    cancelEdit: editState.cancelEdit,
    saveEdit,

    isAdding: addState.isAdding,
    newPlatform: addState.newPlatform,
    newUrl: addState.newUrl,
    newIsActive: addState.newIsActive,
    setNewPlatform: addState.setNewPlatform,
    setNewUrl: addState.setNewUrl,
    setNewIsActive: addState.setNewIsActive,
    startAdding,
    cancelAdding: addState.cancelAdding,
    saveNew,

    handleDelete,
  };
}
