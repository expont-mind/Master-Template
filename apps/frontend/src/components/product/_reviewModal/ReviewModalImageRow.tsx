"use client";

import { X } from "lucide-react";
import Image from "next/image";

import { ImagePlus } from "@/components/svg";

interface ReviewModalImageRowProps {
  previews: string[];
  canAddMore: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

/**
 * Row of up to 3 image thumbnails plus an "add" tile. The hidden file
 * input lives here so the parent doesn't have to forward refs.
 */
export function ReviewModalImageRow({
  previews,
  canAddMore,
  fileInputRef,
  onSelect,
  onRemove,
}: ReviewModalImageRowProps) {
  return (
    <div className="flex gap-4">
      {previews.map((preview, index) => (
        <div
          key={preview}
          className="relative w-[106px] h-[106px] rounded-md border-[1.5px] border-border overflow-hidden"
        >
          <Image
            src={preview}
            alt={`Preview ${index + 1}`}
            fill
            sizes="106px"
            quality={90}
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 w-5 h-5 bg-text-primary/50 rounded-full flex items-center justify-center cursor-pointer"
          >
            <X size={12} color="#fff" />
          </button>
        </div>
      ))}
      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-[106px] h-[106px] border-[1.5px] border-dashed bg-surface border-border rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-text-primary transition-colors"
        >
          <ImagePlus />
          <span className="text-text-secondary font-medium text-sm font-manrope">Зураг</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onSelect}
        className="hidden"
      />
    </div>
  );
}
