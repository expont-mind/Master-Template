"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage, compressImages } from "@/lib/image-compression";

async function uploadFiles(files: File[]): Promise<string[]> {
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
  return data.urls;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "wide";
  hideText?: boolean;
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
  const [loadingState, setLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[3/1]",
  };

  const processFile = async (file: File) => {
    try {
      setLoadingState("compressing");
      const compressed = await compressImage(file);
      setLoadingState("uploading");
      const [url] = await uploadFiles([compressed]);
      onChange(url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoadingState(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

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
    if (disabled || loadingState) return;

    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) await processFile(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border overflow-hidden bg-muted transition-colors",
            aspectClasses[aspectRatio],
            isDragging && "border-primary border-2 bg-primary/10",
          )}
        >
          <img
            src={value}
            alt="Uploaded image"
            className="h-full w-full object-contain"
          />
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
          <label
            htmlFor={inputId}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
              aspectClasses[aspectRatio],
              isDragging && "border-primary bg-primary/10",
              (disabled || loadingState) && "cursor-not-allowed opacity-50 pointer-events-none"
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
                    <p className="text-xs text-muted-foreground">
                      Чирж оруулах эсвэл дарж сонгох
                    </p>
                  </div>
                )}
              </>
            )}
          </label>
        </>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export function MultiImageUpload({
  values = [],
  onChange,
  disabled,
  maxImages = 10,
}: MultiImageUploadProps) {
  const [loadingState, setLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
      console.error("Upload failed:", err);
    } finally {
      setLoadingState(null);
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    await processFiles(Array.from(fileList));
    e.target.value = "";
  };

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
    if (disabled || loadingState) return;

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    await processFiles(files);
  };

  const onRemove = (urlToRemove: string) => {
    onChange(values.filter((url) => url !== urlToRemove));
  };

  return (
    <div
      className="space-y-4"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg transition-colors",
        isDragging && "ring-2 ring-primary bg-primary/5",
      )}>
        {values.map((url, index) => (
          <div
            key={url}
            className="relative aspect-square rounded-lg border overflow-hidden bg-muted group"
          >
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {index === 0 && maxImages > 1 && (
              <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Үндсэн
              </span>
            )}
          </div>
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
            <label
              htmlFor={inputId}
              className={cn(
                "flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer",
                isDragging && "border-primary bg-primary/10",
                (disabled || loadingState) && "cursor-not-allowed opacity-50 pointer-events-none"
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
                    {isDragging ? "Тавина уу" : `${values.length}/${maxImages}`}
                  </span>
                </>
              )}
            </label>
          </>
        )}
      </div>

      {values.length > 0 && maxImages > 1 && (
        <p className="text-xs text-muted-foreground">
          Эхний зураг үндсэн зураг болно. Дарааллыг өөрчлөхийн тулд зургийг устгаад дахин оруулна уу.
        </p>
      )}
    </div>
  );
}
