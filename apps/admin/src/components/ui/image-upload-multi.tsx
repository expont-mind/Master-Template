"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { compressImages } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";
import { cn } from "@/lib/utils";

import { uploadFiles, useDragAndDrop, type ImageLoadingState } from "./_imageUploadHelpers";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

function ImageTile({
  url,
  index,
  showPrimaryBadge,
  disabled,
  onRemove,
}: {
  url: string;
  index: number;
  showPrimaryBadge: boolean;
  disabled: boolean | undefined;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Image ${index + 1}`} className="h-full w-full object-cover" />
      {!disabled && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {showPrimaryBadge && (
        <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
          Үндсэн
        </span>
      )}
    </div>
  );
}

function AddTile({
  htmlFor,
  isDragging,
  disabled,
  loading,
  loadingState,
  currentCount,
  maxImages,
}: {
  htmlFor: string;
  isDragging: boolean;
  disabled: boolean | undefined;
  loading: boolean;
  loadingState: ImageLoadingState;
  currentCount: number;
  maxImages: number;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
        isDragging && "border-primary bg-primary/10",
        (disabled || loading) && "cursor-not-allowed opacity-50 pointer-events-none",
      )}
    >
      {loadingState ? (
        <div className="flex flex-col items-center gap-1">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          <span className="text-xs text-muted-foreground">
            {loadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
          </span>
        </div>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {isDragging ? "Тавина уу" : `${currentCount}/${maxImages}`}
          </span>
        </>
      )}
    </label>
  );
}

export function MultiImageUpload({
  values = [],
  onChange,
  disabled,
  maxImages = 10,
}: MultiImageUploadProps) {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>(null);
  const inputId = useId();

  const processFiles = async (files: File[]) => {
    const remaining = maxImages - values.length;
    const sliced = files.slice(0, remaining);
    if (sliced.length === 0) return;

    try {
      setLoadingState("compressing");
      const compressed = await compressImages(sliced);
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      onChange([...values, ...urls]);
    } catch (err) {
      log.error("image_upload_failed", err);
    } finally {
      setLoadingState(null);
    }
  };

  const { isDragging, handlers } = useDragAndDrop({
    onFilesDropped: processFiles,
    disabled,
    loading: !!loadingState,
  });

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    await processFiles(Array.from(fileList));
    e.target.value = "";
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(values.filter((url) => url !== urlToRemove));
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- drop zone for drag-and-drop file upload; the underlying file input handles keyboard interaction
    <div
      className="space-y-4"
      onDragOver={handlers.handleDragOver}
      onDragEnter={handlers.handleDragEnter}
      onDragLeave={handlers.handleDragLeave}
      onDrop={handlers.handleDrop}
    >
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg transition-colors",
          isDragging && "ring-2 ring-primary bg-primary/5",
        )}
      >
        {values.map((url, index) => (
          <ImageTile
            key={url}
            url={url}
            index={index}
            showPrimaryBadge={index === 0 && maxImages > 1}
            disabled={disabled}
            onRemove={() => handleRemove(url)}
          />
        ))}

        {values.length < maxImages && (
          <>
            <input
              id={inputId}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="peer sr-only"
              onChange={handleFilesChange}
              disabled={disabled || !!loadingState}
            />
            <AddTile
              htmlFor={inputId}
              isDragging={isDragging}
              disabled={disabled}
              loading={!!loadingState}
              loadingState={loadingState}
              currentCount={values.length}
              maxImages={maxImages}
            />
          </>
        )}
      </div>

      {values.length > 0 && maxImages > 1 && (
        <p className="text-xs text-muted-foreground">
          Эхний зураг үндсэн зураг болно. Дарааллыг өөрчлөхийн тулд зургийг устгаад дахин оруулна
          уу.
        </p>
      )}
    </div>
  );
}
