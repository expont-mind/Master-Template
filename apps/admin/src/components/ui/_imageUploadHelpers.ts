"use client";

import { useState } from "react";

export type ImageLoadingState = "compressing" | "uploading" | null;

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();
  return data.urls as string[];
}

export const ASPECT_CLASSES = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[3/1]",
} as const;

export type AspectRatio = keyof typeof ASPECT_CLASSES;

/**
 * Returns drag-and-drop handlers + isDragging state. `onFilesDropped` receives
 * the dropped image files. Callers may guard on disabled / loading flags.
 */
export function useDragAndDrop(options: {
  onFilesDropped: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { onFilesDropped, disabled, loading } = options;
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || loading) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) await onFilesDropped(files);
  };

  return {
    isDragging,
    handlers: { handleDragOver, handleDragEnter, handleDragLeave, handleDrop },
  };
}
