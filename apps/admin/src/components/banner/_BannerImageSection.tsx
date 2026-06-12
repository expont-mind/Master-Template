"use client";

// Reusable image upload section for BannerForm. Renders either the
// preview (with remove button) or the file drop zone with loading state.

import { Loader2, Upload, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { FileLoadingState } from "./_useBannerFormState";

interface BannerImageSectionProps {
  label: string;
  helpText: string;
  inputId: string;
  imageUrl: string | null | undefined;
  loadingState: FileLoadingState;
  isPicking: boolean;
  maxHeightClass: string; // "max-h-48"
  iconSize: "lg" | "md";
  emptyText: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorPickClick: (e: React.MouseEvent<HTMLImageElement>) => void;
  onRemove: () => void;
}

export function BannerImageSection({
  label,
  helpText,
  inputId,
  imageUrl,
  loadingState,
  isPicking,
  maxHeightClass,
  iconSize,
  emptyText,
  onFileChange,
  onColorPickClick,
  onRemove,
}: BannerImageSectionProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{helpText}</p>
      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="peer sr-only"
        onChange={onFileChange}
        disabled={!!loadingState}
      />
      {imageUrl ? (
        <div className="relative rounded-lg border overflow-hidden bg-muted max-h-48 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/click-events-have-key-events -- color-picking by pixel coordinate is inherently mouse-only; keyboard has no equivalent */}
          <img
            src={imageUrl}
            alt={`${label} preview`}
            className={cn(
              `max-w-full ${maxHeightClass} object-contain`,
              isPicking && "cursor-crosshair",
            )}
            onClick={onColorPickClick}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <UploadZone
          inputId={inputId}
          loadingState={loadingState}
          iconSize={iconSize}
          emptyText={emptyText}
        />
      )}
    </div>
  );
}

function UploadZone({
  inputId,
  loadingState,
  iconSize,
  emptyText,
}: {
  inputId: string;
  loadingState: FileLoadingState;
  iconSize: "lg" | "md";
  emptyText: string;
}) {
  const padding = iconSize === "lg" ? "p-8" : "p-6";
  const uploadIconSize = iconSize === "lg" ? "h-8 w-8" : "h-6 w-6";
  return (
    <label
      htmlFor={inputId}
      className={cn(
        `flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed ${padding} text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer`,
        loadingState && "cursor-not-allowed opacity-50 pointer-events-none",
      )}
    >
      {loadingState ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">
            {loadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
          </p>
        </div>
      ) : (
        <>
          <Upload className={`${uploadIconSize} text-muted-foreground`} />
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </>
      )}
    </label>
  );
}
