"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";
import { cn } from "@/lib/utils";

import {
  ASPECT_CLASSES,
  uploadFiles,
  useDragAndDrop,
  type AspectRatio,
  type ImageLoadingState,
} from "./_imageUploadHelpers";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: AspectRatio;
  hideText?: boolean;
}

function PreviewArea({
  value,
  aspectClass,
  isDragging,
  dragHandlers,
  disabled,
  onRemove,
}: {
  value: string;
  aspectClass: string;
  isDragging: boolean;
  dragHandlers: ReturnType<typeof useDragAndDrop>["handlers"];
  disabled: boolean | undefined;
  onRemove?: () => void;
}) {
  return (
    <div
      onDragOver={dragHandlers.handleDragOver}
      onDragEnter={dragHandlers.handleDragEnter}
      onDragLeave={dragHandlers.handleDragLeave}
      onDrop={dragHandlers.handleDrop}
      role="region"
      aria-label="Зургийн урьдчилсан харагдац — шинэ зургаа орлуулахаар тавина уу"
      className={cn(
        "relative rounded-lg border overflow-hidden bg-muted transition-colors",
        aspectClass,
        isDragging && "border-primary border-2 bg-primary/10",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value} alt="Uploaded image" className="h-full w-full object-contain" />
      {onRemove && !disabled && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function DropZoneLabel({
  htmlFor,
  aspectClass,
  isDragging,
  disabled,
  loading,
  loadingState,
  hideText,
  dragHandlers,
}: {
  htmlFor: string;
  aspectClass: string;
  isDragging: boolean;
  disabled: boolean | undefined;
  loading: boolean;
  loadingState: ImageLoadingState;
  hideText: boolean | undefined;
  dragHandlers: ReturnType<typeof useDragAndDrop>["handlers"];
}) {
  return (
    <label
      htmlFor={htmlFor}
      onDragOver={dragHandlers.handleDragOver}
      onDragEnter={dragHandlers.handleDragEnter}
      onDragLeave={dragHandlers.handleDragLeave}
      onDrop={dragHandlers.handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
        aspectClass,
        isDragging && "border-primary bg-primary/10",
        (disabled || loading) && "cursor-not-allowed opacity-50 pointer-events-none",
      )}
    >
      {loadingState ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          {!hideText && (
            <p className="text-xs text-muted-foreground">
              {loadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          {!hideText && (
            <div>
              <p className="text-sm font-medium">
                {isDragging ? "Зургаа тавина уу" : "Зураг оруулах"}
              </p>
              <p className="text-xs text-muted-foreground">Чирж оруулах эсвэл дарж сонгох</p>
            </div>
          )}
        </>
      )}
    </label>
  );
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
  aspectRatio = "square",
  hideText,
}: ImageUploadProps) {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>(null);
  const inputId = useId();

  const processFile = async (file: File) => {
    try {
      setLoadingState("compressing");
      const compressed = await compressImage(file);
      setLoadingState("uploading");
      const [url] = await uploadFiles([compressed]);
      onChange(url);
    } catch (err) {
      log.error("image_upload_failed", err);
    } finally {
      setLoadingState(null);
    }
  };

  const { isDragging, handlers } = useDragAndDrop({
    onFilesDropped: async (files) => {
      const file = files[0];
      if (file) await processFile(file);
    },
    disabled,
    loading: !!loadingState,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

  const aspectClass = ASPECT_CLASSES[aspectRatio];

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <PreviewArea
          value={value}
          aspectClass={aspectClass}
          isDragging={isDragging}
          dragHandlers={handlers}
          disabled={disabled}
          onRemove={onRemove}
        />
      ) : (
        <>
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="peer sr-only"
            onChange={handleFileChange}
            disabled={disabled || !!loadingState}
          />
          <DropZoneLabel
            htmlFor={inputId}
            aspectClass={aspectClass}
            isDragging={isDragging}
            disabled={disabled}
            loading={!!loadingState}
            loadingState={loadingState}
            hideText={hideText}
            dragHandlers={handlers}
          />
        </>
      )}
    </div>
  );
}
