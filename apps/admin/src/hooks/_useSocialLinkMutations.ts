"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getPlatformData } from "@/components/social-link/platform-options";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { SocialLink } from "@/components/social-link/types";

interface EditInput {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

interface CreateInput {
  platform: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
}

export function useSocialLinkMutations() {
  const queryClient = useQueryClient();

  const reorderMutation = useMutation({
    mutationFn: async (newLinks: SocialLink[]) => {
      await Promise.all(
        newLinks.map((link, index) =>
          adminApi.update("social_links", link.id, { sort_order: index }),
        ),
      );
    },
    onMutate: async (newLinks: SocialLink[]) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.socialLinks.lists(),
      });
      const previousLinks = queryClient.getQueryData<SocialLink[]>(queryKeys.socialLinks.lists());
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
    mutationFn: async ({ id, platform, url, isActive }: EditInput) => {
      const platformData = getPlatformData(platform);
      await adminApi.update("social_links", id, {
        platform: platformData?.label ?? platform,
        url: url.trim(),
        is_active: isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.socialLinks.all });
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ platform, url, isActive, sortOrder }: CreateInput) => {
      const platformData = getPlatformData(platform);
      await adminApi.insert("social_links", {
        platform: platformData?.label ?? platform,
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

  return { reorderMutation, editMutation, createMutation, deleteMutation };
}
