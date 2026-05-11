"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { Event } from "@/components/event/types";
import type { ContentStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

function generateSlug(text: string): string {
  // Remove Mongolian/Cyrillic characters, only allow a-z and 0-9
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // If slug is empty (e.g., all Mongolian text), generate a random one
  if (!slug) {
    const random = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `event-${random}`;
  }
  return slug;
}

export function useEventEdit(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");

  const { data: event = null, isLoading } = useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => adminApi.getById<Event>("events", id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setLocation(event.location || "");
      setStartDate(event.start_date ? new Date(event.start_date) : undefined);
      setEndDate(event.end_date ? new Date(event.end_date) : undefined);
      setImageUrl(event.image_url || "");
      setVideoUrl(event.video_url || "");
      setStatus(event.status);
    }
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      isNew
        ? adminApi.insert("events", data)
        : adminApi.update("events", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      router.push("/events");
    },
  });

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Эвентийн гарчгийг заавал оруулна уу.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const eventData: Record<string, unknown> = {
        title: title.trim(),
        slug: generateSlug(title),
        description: description.trim() || null,
        location: location.trim() || null,
        start_date: startDate
          ? new Date(
              `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}T00:00:00+08:00`,
            ).toISOString()
          : null,
        end_date: endDate
          ? new Date(
              `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}T23:59:59+08:00`,
            ).toISOString()
          : null,
        image_url: imageUrl.trim() || null,
        video_url: videoUrl.trim() || null,
        status,
      };

      if (!isNew) {
        eventData.updated_at = new Date().toISOString();
      }

      await saveMutation.mutateAsync(eventData);
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Эвент хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setStatus("published");
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  return {
    isNew,
    event,
    isLoading,
    isSaving,
    error,
    title,
    description,
    location,
    startDate,
    endDate,
    imageUrl,
    videoUrl,
    status,
    setTitle,
    setDescription,
    setLocation,
    setStartDate,
    setEndDate,
    setImageUrl,
    setVideoUrl,
    setStatus,
    handleSave,
    handlePublish,
  };
}
