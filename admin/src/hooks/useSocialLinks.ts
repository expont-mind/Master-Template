"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { SocialLink } from "@/components/social-link/types";
import { getPlatformData } from "@/components/social-link/platform-options";
import { queryKeys } from "@/lib/query-keys";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function useSocialLinks() {
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPlatform, setEditPlatform] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  // New item state
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: socialLinks = [], isLoading } = useQuery({
    queryKey: queryKeys.socialLinks.lists(),
    queryFn: () =>
      adminApi.getAll<SocialLink>("social_links", {
        order: "sort_order.asc",
      }),
  });

  // Optimistic DnD reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (newLinks: SocialLink[]) => {
      await Promise.all(
        newLinks.map((link, index) =>
          adminApi.update("social_links", link.id, { sort_order: index })
        )
      );
    },
    onMutate: async (newLinks: SocialLink[]) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.socialLinks.lists() });
      const previousLinks = queryClient.getQueryData<SocialLink[]>(
        queryKeys.socialLinks.lists()
      );
      queryClient.setQueryData(queryKeys.socialLinks.lists(), newLinks);
      return { previousLinks };
    },
    onError: (_err, _newLinks, context) => {
      if (context?.previousLinks) {
        queryClient.setQueryData(queryKeys.socialLinks.lists(), context.previousLinks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialLinks.all });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      id,
      platform,
      url,
      isActive,
    }: {
      id: string;
      platform: string;
      url: string;
      isActive: boolean;
    }) => {
      const platformData = getPlatformData(platform);
      await adminApi.update("social_links", id, {
        platform: platformData?.label || platform,
        url: url.trim(),
        is_active: isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialLinks.all });
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({
      platform,
      url,
      isActive,
      sortOrder,
    }: {
      platform: string;
      url: string;
      isActive: boolean;
      sortOrder: number;
    }) => {
      const platformData = getPlatformData(platform);
      await adminApi.insert("social_links", {
        platform: platformData?.label || platform,
        url: url.trim(),
        is_active: isActive,
        sort_order: sortOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialLinks.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete("social_links", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialLinks.all });
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = socialLinks.findIndex((link) => link.id === active.id);
      const newIndex = socialLinks.findIndex((link) => link.id === over.id);
      const newLinks = arrayMove(socialLinks, oldIndex, newIndex);
      reorderMutation.mutate(newLinks);
    }
  };

  // Edit handlers
  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setEditPlatform(link.platform.toLowerCase());
    setEditUrl(link.url);
    setEditIsActive(link.is_active);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPlatform("");
    setEditUrl("");
    setEditIsActive(true);
  };

  const saveEdit = async () => {
    if (!editingId || !editPlatform || !editUrl.trim()) return;

    try {
      await editMutation.mutateAsync({
        id: editingId,
        platform: editPlatform,
        url: editUrl,
        isActive: editIsActive,
      });
      cancelEdit();
    } catch (error) {
      log.error("social_link_update_failed", error);
    }
  };

  // New item handlers
  const startAdding = () => {
    setIsAdding(true);
    setNewPlatform("");
    setNewUrl("");
    setNewIsActive(true);
    setEditingId(null);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewPlatform("");
    setNewUrl("");
    setNewIsActive(true);
  };

  const saveNew = async () => {
    if (!newPlatform || !newUrl.trim()) return;

    try {
      await createMutation.mutateAsync({
        platform: newPlatform,
        url: newUrl,
        isActive: newIsActive,
        sortOrder: socialLinks.length,
      });
      cancelAdding();
    } catch (error) {
      log.error("social_link_create_failed", error);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (error) {
      log.error("social_link_delete_failed", error);
    }
    setDeleteTarget(null);
  };

  const isSaving =
    editMutation.isPending || createMutation.isPending;

  return {
    // Data
    socialLinks,
    isLoading,
    isSaving,
    deleteTarget,
    setDeleteTarget,

    // DnD
    sensors,
    handleDragEnd,

    // Edit state
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

    // New item state
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

    // Delete
    handleDelete,
  };
}
