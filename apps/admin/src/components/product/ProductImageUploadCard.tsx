"use client";

import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { compressImages } from "@/lib/image-compression";
import { log } from "@/lib/observability/log";
import { cn } from "@/lib/utils";

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

interface ProductImageUploadCardProps {
  images: string[];
  setImages: (images: string[]) => void;
  disabled?: boolean;
}

function UploadedImageItem({
  url,
  index,
  disabled,
  onRemove,
  onSetMain,
}: {
  url: string;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  onSetMain: () => void;
}) {
  const isPrimary = index === 0;
  return (
    <div
      className={cn(
        "relative aspect-square w-full rounded-lg border overflow-hidden bg-muted group",
        isPrimary && "ring-2 ring-primary",
      )}
    >
      <button
        type="button"
        onClick={() => !disabled && onSetMain()}
        disabled={disabled}
        className="block w-full h-full cursor-pointer bg-transparent border-0 p-0"
        aria-label={isPrimary ? "Үндсэн зураг" : "Үндсэн болгох"}
      >
        <Image
          src={url}
          alt={`Image ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
      </button>
      {!disabled && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isPrimary && (
        <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded pointer-events-none">
          Үндсэн
        </span>
      )}
    </div>
  );
}

export function ProductImageUploadCard({
  images,
  setImages,
  disabled,
}: ProductImageUploadCardProps) {
  const [loadingState, setLoadingState] = useState<"compressing" | "uploading" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const maxImages = 10;

  const processFiles = async (files: File[]) => {
    const remaining = maxImages - images.length;
    const sliced = files.slice(0, remaining);
    if (sliced.length === 0) return;

    try {
      setLoadingState("compressing");
      const compressed = await compressImages(sliced);
      setLoadingState("uploading");
      const urls = await uploadFiles(compressed);
      setImages([...images, ...urls]);
    } catch (err) {
      log.error("product_image_upload_failed", err);
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

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    await processFiles(files);
  };

  const onRemove = (urlToRemove: string) => {
    setImages(images.filter((url) => url !== urlToRemove));
  };

  const setAsMain = (url: string) => {
    const filtered = images.filter((img) => img !== url);
    setImages([url, ...filtered]);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Бүтээгдэхүүний зураг</h3>

        {/* Upload button - full width square */}
        <div className="aspect-square w-full">
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
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer h-full",
              isDragging && "border-primary bg-primary/10",
              (disabled || loadingState) && "cursor-not-allowed opacity-50 pointer-events-none",
            )}
          >
            {loadingState ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">
                  {loadingState === "compressing" ? "Шахаж байна..." : "Байршуулж байна..."}
                </span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  {isDragging ? "Зургаа тавина уу" : "Зураг нэмэх"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Чирж оруулах эсвэл дарж сонгох
                </span>
              </>
            )}
          </label>
        </div>

        {images.length > 0 && (
          <div className="flex flex-col gap-3">
            {images.map((url, index) => (
              <UploadedImageItem
                key={url}
                url={url}
                index={index}
                disabled={disabled}
                onRemove={() => onRemove(url)}
                onSetMain={() => setAsMain(url)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
