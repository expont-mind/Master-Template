"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 3;

/**
 * Form state for the review modal: comment text, image files, and
 * preview data URLs (rendered as <Image> thumbnails).
 *
 * Extracted from ReviewModal so the modal stays focused on layout +
 * open/close animation.
 */
export function useReviewModalForm() {
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setComment("");
    setImages([]);
    setPreviews([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, MAX_IMAGES - images.length);
    setImages((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    comment,
    setComment,
    images,
    previews,
    fileInputRef,
    handleImageSelect,
    handleRemoveImage,
    reset,
    canAddMore: images.length < MAX_IMAGES,
  };
}
